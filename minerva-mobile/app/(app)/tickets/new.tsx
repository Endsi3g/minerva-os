import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { BottomSheet } from '@/components/BottomSheet';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type PriorityKey = 'low' | 'medium' | 'high' | 'urgent';
const PRIORITY_KEYS: PriorityKey[] = ['low', 'medium', 'high', 'urgent'];

type Client = { id: string; company: string };

export default function NewTicket() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priorityIdx, setPriorityIdx] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [clientSheetVisible, setClientSheetVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => { trackScreen('NewTicket'); }, []);

  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      setWorkspaceId(wid);
      const { data } = await supabase.from('clients').select('id,company').eq('workspace_id', wid).order('company');
      setClients(data ?? []);
    }
    load();
  }, []);

  const priorityLabels = [t.tickets.priority.low, t.tickets.priority.medium, t.tickets.priority.high, t.tickets.priority.urgent];
  const selectedClient = clients.find(c => c.id === selectedClientId);

  async function handleSubmit() {
    if (!workspaceId) return;
    if (!subject.trim()) { setError(t.tickets.subject); return; }
    if (!description.trim()) { setError(t.tickets.description); return; }
    setSubmitting(true);
    setError('');
    try {
      await supabase.from('tickets').insert({
        workspace_id: workspaceId,
        subject: subject.trim(),
        description: description.trim(),
        priority: PRIORITY_KEYS[priorityIdx],
        status: 'open',
        ...(selectedClientId ? { client_id: selectedClientId } : {}),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      captureException(err, { screen: 'NewTicket', action: 'submit' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t.errors.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.tickets.newTicket} showBack />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={labelStyle}>{t.tickets.subject}</Text>
        <TextInput style={inputStyle} placeholder={t.tickets.subjectPlaceholder} placeholderTextColor="#8A9099" value={subject} onChangeText={setSubject} returnKeyType="next" />

        <Text style={labelStyle}>{t.tickets.description}</Text>
        <TextInput style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]} placeholder={t.tickets.descriptionPlaceholder} placeholderTextColor="#8A9099" multiline value={description} onChangeText={setDescription} />

        <Text style={labelStyle}>{t.tickets.priorityLabel}</Text>
        <NativeSegmentedControl values={priorityLabels} selectedIndex={priorityIdx} onChange={setPriorityIdx} />

        <Text style={labelStyle}>{t.tickets.client} ({t.common.optional})</Text>
        <TouchableOpacity style={inputStyle} onPress={() => setClientSheetVisible(true)}>
          <Text style={{ color: selectedClient ? '#F5F1E8' : '#8A9099', fontSize: 14 }}>
            {selectedClient ? selectedClient.company : t.tickets.selectClient}
          </Text>
        </TouchableOpacity>

        {error.length > 0 && <Text style={{ color: '#A86A6A', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</Text>}

        <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{ backgroundColor: '#F5F1E8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, opacity: submitting ? 0.6 : 1 }}>
          <Text style={{ color: '#0A0D14', fontSize: 15, fontWeight: '700' }}>{submitting ? t.common.loading : t.common.submit}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet visible={clientSheetVisible} onClose={() => setClientSheetVisible(false)} title={t.tickets.selectClient}>
        <FlatList
          data={clients}
          keyExtractor={c => c.id}
          scrollEnabled={false}
          renderItem={({ item: client }) => (
            <TouchableOpacity
              onPress={() => { setSelectedClientId(client.id); setClientSheetVisible(false); }}
              style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#F5F1E8', fontSize: 15 }}>{client.company}</Text>
              {client.id === selectedClientId && <Text style={{ color: '#7FA38A', fontSize: 14 }}>✓</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color: '#8A9099', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>{t.clients.noClients}</Text>}
        />
        {selectedClientId && (
          <TouchableOpacity onPress={() => { setSelectedClientId(undefined); setClientSheetVisible(false); }} style={{ marginTop: 12, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: '#A86A6A', fontSize: 14 }}>{t.common.cancel}</Text>
          </TouchableOpacity>
        )}
      </BottomSheet>
    </View>
  );
}

const labelStyle = { color: '#8A9099', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginTop: 20, marginBottom: 6 };
const inputStyle = { backgroundColor: '#111522', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: '#F5F1E8', fontSize: 14 };
