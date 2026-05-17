import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { Platform, ActionSheetIOS, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../convex/_generated/api';

type Project = {
  _id: string;
  name: string;
  clientName: string;
  status: string;
  dueDate: string;
  budget: number;
  healthScore?: number;
  activeRiskFlags?: string[];
};

const STATUS_VALUES = ['all', 'active', 'on_hold', 'completed'] as const;

export default function Projects() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => { trackScreen('Projects'); }, []);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const allProjects = (useQuery(api.projects.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Project[];
  const updateProject = useMutation(api.projects.update);

  const selectedStatus = STATUS_VALUES[statusIdx];
  const projects = selectedStatus === 'all'
    ? allProjects
    : allProjects.filter(p => p.status === selectedStatus);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const segmentLabels = [t.projects.all, t.projects.active, t.projects.onHold, t.projects.completed];

  function handleUpdateStatus(project: Project) {
    const options = [t.projects.active, t.projects.onHold, t.projects.completed, t.common.cancel];
    const statusMap: Record<string, string> = {
      [t.projects.active]: 'active',
      [t.projects.onHold]: 'on_hold',
      [t.projects.completed]: 'completed',
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: t.projects.updateStatus, options, cancelButtonIndex: 3 },
        async (idx) => {
          if (idx < 3) {
            const newStatus = statusMap[options[idx]];
            await updateProject({ id: project._id as Parameters<typeof updateProject>[0]['id'], status: newStatus });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        },
      );
    } else {
      Alert.alert(
        t.projects.updateStatus,
        undefined,
        ([...options.slice(0, 3).map(label => ({
          text: label,
          onPress: async () => {
            await updateProject({ id: project._id as Parameters<typeof updateProject>[0]['id'], status: statusMap[label] });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        })), { text: t.common.cancel, style: 'cancel' as const }]),
      );
    }
  }

  function ProjectCard({ project }: { project: Project }) {
    const health = project.healthScore ?? 80;
    const healthColor = health >= 70 ? '#7FA38A' : health >= 40 ? '#B89B6A' : '#A86A6A';
    return (
      <SwipeableRow
        rightActions={[
          {
            label: t.projects.updateStatus,
            color: '#B89B6A',
            onPress: () => handleUpdateStatus(project),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(app)/projects/[id]', params: { id: project._id } })}
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>{project.clientName}</Text>
            </View>
            <StatusPill status={project.status} />
          </View>
          {/* Health score bar */}
          <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }}>
            <View style={{ height: 3, width: `${health}%`, backgroundColor: healthColor, borderRadius: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#8A9099', fontSize: 11 }}>
              {t.projects.dueDate}: {project.dueDate}
            </Text>
            <Text style={{ color: '#8A9099', fontSize: 11 }}>
              {t.projects.health}: {health}%
            </Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  }

  return (
    <View className="flex-1 bg-obsidian">
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 4 }}>
        <Text className="text-ivory text-2xl font-semibold mb-3">{t.projects.title}</Text>
        <NativeSegmentedControl
          values={segmentLabels}
          selectedIndex={statusIdx}
          onChange={setStatusIdx}
        />
      </View>
      <FlatList
        data={projects}
        keyExtractor={p => p._id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        renderItem={({ item }) => <ProjectCard project={item} />}
        ListEmptyComponent={<EmptyState emoji="📁" title={t.projects.noProjects} />}
      />
    </View>
  );
}
