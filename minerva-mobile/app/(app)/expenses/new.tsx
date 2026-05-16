import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActionSheetIOS,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../convex/_generated/api';

type CategoryKey = 'travel' | 'meals' | 'software' | 'hardware' | 'marketing' | 'office' | 'other';
const CATEGORY_KEYS: CategoryKey[] = ['travel', 'meals', 'software', 'hardware', 'marketing', 'office', 'other'];

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewExpense() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryKey>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [receiptStorageId, setReceiptStorageId] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { trackScreen('NewExpense'); }, []);

  let workspaces: { _id: string }[] = [];
  try {
    workspaces = (useQuery(api.workspaces.list, {}) ?? []) as { _id: string }[];
  } catch (err) {
    captureException(err, { screen: 'NewExpense' });
  }
  const workspaceId = workspaces[0]?._id;

  const createExpense = useMutation(api.expenses.create);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);

  const categoryLabels: Record<CategoryKey, string> = {
    travel: t.expenses.categories.travel,
    meals: t.expenses.categories.meals,
    software: t.expenses.categories.software,
    hardware: t.expenses.categories.hardware,
    marketing: t.expenses.categories.marketing,
    office: t.expenses.categories.office,
    other: t.expenses.categories.other,
  };

  function handleCategorySelect() {
    if (Platform.OS === 'ios') {
      const options = [...CATEGORY_KEYS.map(k => categoryLabels[k]), t.common.cancel];
      ActionSheetIOS.showActionSheetWithOptions(
        { title: t.expenses.category, options, cancelButtonIndex: options.length - 1 },
        (idx) => {
          if (idx < CATEGORY_KEYS.length) {
            setCategory(CATEGORY_KEYS[idx]);
          }
        },
      );
    } else {
      setShowCategoryModal(true);
    }
  }

  function handleDateChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      setDate(selected);
    }
  }

  async function handlePickReceipt() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t.expenses.addReceipt,
          options: [t.files.camera, t.files.photoLibrary, t.common.cancel],
          cancelButtonIndex: 2,
        },
        async (idx) => {
          if (idx === 0) await launchCamera();
          else if (idx === 1) await launchLibrary();
        },
      );
    } else {
      Alert.alert(t.expenses.addReceipt, undefined, [
        { text: t.files.camera, onPress: launchCamera },
        { text: t.files.photoLibrary, onPress: launchLibrary },
        { text: t.common.cancel, style: 'cancel' },
      ]);
    }
  }

  async function launchCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.errors.permissionDenied);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await uploadReceipt(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
    }
  }

  async function launchLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.errors.permissionDenied);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) {
      await uploadReceipt(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
    }
  }

  async function uploadReceipt(uri: string, mimeType: string) {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const { storageId } = await uploadResponse.json() as { storageId: string };
      setReceiptStorageId(storageId);
    } catch (err) {
      captureException(err, { screen: 'NewExpense', action: 'uploadReceipt' });
      setError(t.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!workspaceId || !user) return;
    if (!amount || isNaN(parseFloat(amount))) {
      setError(t.expenses.amount);
      return;
    }
    if (!description.trim()) {
      setError(t.expenses.description);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createExpense({
        workspaceId,
        submittedBy: user._id,
        amount: parseFloat(amount),
        currency: 'USD',
        category,
        description: description.trim(),
        date: date.toISOString().split('T')[0],
        ...(receiptStorageId ? { receiptStorageId } : {}),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      captureException(err, { screen: 'NewExpense', action: 'submit' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t.errors.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.expenses.addExpense} showBack />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <Text style={labelStyle}>{t.expenses.amount}</Text>
        <View style={[inputRowStyle, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={{ color: '#8A9099', fontSize: 16, marginRight: 6 }}>$</Text>
          <TextInput
            style={{ flex: 1, color: '#F5F1E8', fontSize: 16 }}
            placeholder="0.00"
            placeholderTextColor="#8A9099"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Category */}
        <Text style={labelStyle}>{t.expenses.category}</Text>
        <TouchableOpacity style={inputRowStyle} onPress={handleCategorySelect}>
          <Text style={{ color: '#F5F1E8', fontSize: 14 }}>
            {categoryLabels[category]}
          </Text>
        </TouchableOpacity>

        {/* Description */}
        <Text style={labelStyle}>{t.expenses.description}</Text>
        <TextInput
          style={[inputRowStyle, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder={t.expenses.description}
          placeholderTextColor="#8A9099"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Date */}
        <Text style={labelStyle}>{t.expenses.date}</Text>
        <TouchableOpacity
          style={inputRowStyle}
          onPress={() => {
            if (Platform.OS === 'android') {
              setShowDatePicker(true);
            } else {
              setShowDatePicker(prev => !prev);
            }
          }}
        >
          <Text style={{ color: '#F5F1E8', fontSize: 14 }}>{fmtDate(date)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            themeVariant="dark"
          />
        )}

        {/* Receipt */}
        <Text style={labelStyle}>{t.expenses.receipt}</Text>
        <TouchableOpacity style={inputRowStyle} onPress={handlePickReceipt} disabled={uploading}>
          <Text style={{ color: receiptStorageId ? '#7FA38A' : '#8A9099', fontSize: 14 }}>
            {uploading
              ? t.common.uploading
              : receiptStorageId
              ? '✓ Receipt attached'
              : t.expenses.addReceipt}
          </Text>
        </TouchableOpacity>

        {/* Error */}
        {error.length > 0 && (
          <Text style={{ color: '#A86A6A', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: '#F5F1E8',
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <Text style={{ color: '#0A0D14', fontSize: 15, fontWeight: '700' }}>
            {submitting ? t.common.loading : t.expenses.submitExpense}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Android category modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#171C2A',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginVertical: 12 }} />
            <Text style={{ color: '#F5F1E8', fontSize: 16, fontWeight: '600', paddingHorizontal: 16, marginBottom: 8 }}>
              {t.expenses.category}
            </Text>
            <FlatList
              data={CATEGORY_KEYS}
              keyExtractor={k => k}
              renderItem={({ item: key }) => (
                <TouchableOpacity
                  onPress={() => { setCategory(key); setShowCategoryModal(false); }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: key === category ? '#7FA38A' : '#F5F1E8', fontSize: 15 }}>
                    {categoryLabels[key]}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const labelStyle = {
  color: '#8A9099',
  fontSize: 11,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginTop: 20,
  marginBottom: 6,
};

const inputRowStyle = {
  backgroundColor: '#111522',
  borderRadius: 12,
  padding: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#F5F1E8',
  fontSize: 14,
};
