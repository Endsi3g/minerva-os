import { ScrollView, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Platform, ActionSheetIOS, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusPill } from '@/components/StatusPill';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { EmptyState } from '@/components/EmptyState';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../convex/_generated/api';

type Task = { _id: string; title: string; status: string; priority: string };
type Milestone = { _id: string; title: string; dueDate: string; status: string };
type ProjectDetail = {
  project: {
    _id: string;
    name: string;
    clientName: string;
    status: string;
    description?: string;
    budget: number;
    healthScore?: number;
    activeRiskFlags?: string[];
    dueDate: string;
  };
  tasks: Task[];
  milestones: Milestone[];
};

const TASK_STATUS_VALUES = ['todo', 'in_progress', 'done'] as const;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#8A9099',
  medium: '#B89B6A',
  high: '#A86A6A',
  urgent: '#A86A6A',
};

export default function ProjectDetail() {
  const { t } = useMobileLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabIdx, setTabIdx] = useState(0);

  useEffect(() => { trackScreen('ProjectDetail'); }, []);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const data = useQuery(
    api.projects.getProjectDashboard,
    id ? { projectId: id as Parameters<typeof api.projects.getProjectDashboard>[0]['projectId'] } : 'skip',
  ) as ProjectDetail | null | undefined;

  const updateTask = useMutation(api.tasks.update);

  const tabLabels = [t.projects.overview, t.projects.tasks, t.projects.files];

  const isLoading = workspaceId !== undefined && data === undefined;

  if (isLoading) {
    return <LoadingSpinner message={t.common.loading} />;
  }

  const project = data?.project;
  const tasks = data?.tasks ?? [];
  const milestones = data?.milestones ?? [];
  const health = project?.healthScore ?? 80;
  const healthColor = health >= 70 ? '#7FA38A' : health >= 40 ? '#B89B6A' : '#A86A6A';

  function handleUpdateTaskStatus(task: Task) {
    const statusLabels = [t.projects.active, t.projects.onHold, t.projects.completed, t.common.cancel];
    const statusValues = ['todo', 'in_progress', 'done'];
    const displayLabels = ['To Do', 'In Progress', 'Done'];
    const allOptions = [...displayLabels, t.common.cancel];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: task.title, options: allOptions, cancelButtonIndex: 3 },
        async (idx) => {
          if (idx < 3) {
            await updateTask({
              id: task._id as Parameters<typeof updateTask>[0]['id'],
              status: statusValues[idx],
            });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        },
      );
    } else {
      Alert.alert(
        task.title,
        undefined,
        ([...displayLabels.map((label, idx) => ({
          text: label,
          onPress: async () => {
            await updateTask({
              id: task._id as Parameters<typeof updateTask>[0]['id'],
              status: statusValues[idx],
            });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        })), { text: t.common.cancel, style: 'cancel' as const }]),
      );
    }
    // suppress unused warning
    void statusLabels;
    void TASK_STATUS_VALUES;
  }

  function OverviewTab() {
    if (!project) return null;
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Client + Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#8A9099', fontSize: 13 }}>
            {t.projects.client}: <Text style={{ color: '#F5F1E8' }}>{project.clientName}</Text>
          </Text>
          <StatusPill status={project.status} size="md" />
        </View>

        {/* Health bar */}
        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#B8BDC7', fontSize: 13 }}>{t.projects.health}</Text>
            <Text style={{ color: healthColor, fontSize: 13, fontWeight: '600' }}>{health}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <View style={{ height: 4, width: `${health}%`, backgroundColor: healthColor, borderRadius: 2 }} />
          </View>
        </View>

        {/* Budget + Due Date */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 4 }}>{t.projects.budget}</Text>
            <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '600' }}>{fmt(project.budget)}</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 4 }}>{t.projects.dueDate}</Text>
            <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '600' }}>{project.dueDate}</Text>
          </View>
        </View>

        {/* Description */}
        {project.description ? (
          <View
            style={{
              backgroundColor: '#111522',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 6 }}>{t.projects.description}</Text>
            <Text style={{ color: '#B8BDC7', fontSize: 13, lineHeight: 20 }}>{project.description}</Text>
          </View>
        ) : null}

        {/* Active Risk Flags */}
        {project.activeRiskFlags && project.activeRiskFlags.length > 0 ? (
          <View
            style={{
              backgroundColor: 'rgba(168,106,106,0.10)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(168,106,106,0.25)',
            }}
          >
            <Text style={{ color: '#A86A6A', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>
              {t.projects.activeRisks}
            </Text>
            {project.activeRiskFlags.map((flag, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#A86A6A', fontSize: 12, marginRight: 6 }}>·</Text>
                <Text style={{ color: '#F5F1E8', fontSize: 13, flex: 1 }}>{flag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Milestones */}
        {milestones.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 8 }}>
              {t.projects.milestones.toUpperCase()}
            </Text>
            {milestones.map(ms => (
              <View
                key={ms._id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <Text style={{ color: '#F5F1E8', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>
                  {ms.title}
                </Text>
                <Text style={{ color: '#8A9099', fontSize: 11, marginRight: 8 }}>{ms.dueDate}</Text>
                <StatusPill status={ms.status} />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  function TasksTab() {
    if (tasks.length === 0) {
      return <EmptyState emoji="✅" title={t.common.empty} />;
    }
    return (
      <FlatList
        data={tasks}
        keyExtractor={task => task._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const priorityColor = PRIORITY_COLORS[item.priority.toLowerCase()] ?? '#8A9099';
          return (
            <TouchableOpacity
              onPress={() => handleUpdateTaskStatus(item)}
              style={{
                backgroundColor: '#111522',
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: '#F5F1E8', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    backgroundColor: `${priorityColor}20`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: priorityColor, fontSize: 10, fontWeight: '600' }}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                  </Text>
                </View>
                <StatusPill status={item.status} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    );
  }

  function FilesTab() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#8A9099', fontSize: 14, textAlign: 'center' }}>{t.files.title}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={project?.name ?? t.common.loading} showBack />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <NativeSegmentedControl values={tabLabels} selectedIndex={tabIdx} onChange={setTabIdx} />
      </View>
      {tabIdx === 0 && <OverviewTab />}
      {tabIdx === 1 && <TasksTab />}
      {tabIdx === 2 && <FilesTab />}
    </View>
  );
}
