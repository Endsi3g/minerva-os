import { FlatList, View, Text, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type FileAsset = {
  _id: string;
  name: string;
  type: string;
  storageId: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const files = (useQuery(api.files.list, workspaceId ? { workspaceId } : 'skip') ?? []) as FileAsset[];

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.save);

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
      const { storageId } = await response.json() as { storageId: string };

      const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'upload';
      const type = (asset.mimeType ?? '').startsWith('image') ? 'image'
        : (asset.mimeType ?? '').startsWith('video') ? 'video' : 'document';

      await saveFile({
        workspaceId,
        storageId,
        name,
        type,
        size: asset.fileSize ?? 0,
      });
    } catch (err) {
      Alert.alert('Upload failed', String(err));
    } finally {
      setUploading(false);
    }
  }

  function showUploadOptions() {
    Alert.alert('Upload file', 'Choose a source', [
      { text: 'Camera', onPress: () => pickAndUpload(true) },
      { text: 'Photo Library', onPress: () => pickAndUpload(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View className="flex-1 bg-obsidian">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-ivory text-2xl font-semibold">Files</Text>
          <Text className="text-fog text-sm mt-0.5">{files.length} assets</Text>
        </View>
        <TouchableOpacity
          onPress={showUploadOptions}
          disabled={uploading}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#F5F1E8', opacity: uploading ? 0.6 : 1 }}
        >
          <Text className="text-obsidian text-sm font-semibold">{uploading ? 'Uploading...' : 'Upload'}</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-4xl">📁</Text>
          <Text className="text-fog text-sm">No files yet. Upload your first asset.</Text>
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
