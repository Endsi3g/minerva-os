import { FlatList, View, Text, TouchableOpacity, Alert, RefreshControl, Platform, ActionSheetIOS } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useMobileLang } from '@/lib/i18n';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type FileAsset = {
  _id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
};

const TYPE_COLORS: Record<string, string> = {
  image: '#7FA38A',
  video: '#B89B6A',
  document: '#8A9099',
  archive: '#A86A6A',
};

function FileItem({ file }: { file: FileAsset }) {
  const color = TYPE_COLORS[file.type] ?? '#8A9099';
  return (
    <View
      className="flex-1 m-1 rounded-2xl p-3 border border-white/8 aspect-square items-center justify-center"
      style={{ backgroundColor: '#111522' }}
    >
      <View
        className="h-10 w-10 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Text style={{ color, fontSize: 20 }}>
          {file.type === 'image' ? '🖼' : file.type === 'video' ? '🎬' : file.type === 'document' ? '📄' : '📦'}
        </Text>
      </View>
      <Text className="text-ivory text-xs text-center" numberOfLines={2}>{file.name}</Text>
      <Text className="text-fog/60 text-[10px] mt-0.5">{(file.size / 1024).toFixed(0)} KB</Text>
    </View>
  );
}

export default function Files() {
  const { t } = useMobileLang();
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const files = (useQuery(api.assets.list, workspaceId ? { workspaceId } : 'skip') ?? []) as FileAsset[];

  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const saveFile = useMutation(api.assets.add);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  async function pickAndUpload(fromCamera: boolean) {
    if (!workspaceId) { Alert.alert('No workspace found'); return; }
    setUploading(true);
    try {
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' },
        body: { uri: asset.uri } as unknown as BodyInit,
      });
      if (!response.ok) throw new Error('Upload failed');

      const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'upload';
      const type = (asset.mimeType ?? '').startsWith('image') ? 'image'
        : (asset.mimeType ?? '').startsWith('video') ? 'video' : 'document';

      await saveFile({
        workspaceId,
        name,
        type,
        size: asset.fileSize ?? 0,
        url: '',
        uploadedAt: Date.now(),
      });
    } catch (err) {
      Alert.alert(t.errors.uploadFailed, String(err));
    } finally {
      setUploading(false);
    }
  }

  function showUploadOptions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t.files.camera, t.files.photoLibrary, t.common.cancel], cancelButtonIndex: 2 },
        (idx) => { if (idx === 0) pickAndUpload(true); else if (idx === 1) pickAndUpload(false); }
      );
    } else {
      Alert.alert(t.files.uploadFile, t.files.chooseSource, [
        { text: t.files.camera, onPress: () => pickAndUpload(true) },
        { text: t.files.photoLibrary, onPress: () => pickAndUpload(false) },
        { text: t.common.cancel, style: 'cancel' },
      ]);
    }
  }

  return (
    <View className="flex-1 bg-obsidian">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-ivory text-2xl font-semibold">{t.files.title}</Text>
          <Text className="text-fog text-sm mt-0.5">{files.length} {t.files.assets}</Text>
        </View>
        <TouchableOpacity
          onPress={showUploadOptions}
          disabled={uploading}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#F5F1E8', opacity: uploading ? 0.6 : 1 }}
        >
          <Text className="text-obsidian text-sm font-semibold">{uploading ? t.files.uploading : t.files.upload}</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-4xl">📁</Text>
          <Text className="text-fog text-sm">{t.files.noFiles} {t.files.uploadFirst}</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={f => f._id}
          numColumns={3}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
          renderItem={({ item }) => <FileItem file={item} />}
        />
      )}
    </View>
  );
}
