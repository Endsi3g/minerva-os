import { ScrollView, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Platform, ActionSheetIOS, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusPill } from '@/components/StatusPill';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { EmptyState } from '@/components/EmptyState';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Task = { id: string; title: string; status: string; priority: string };
type Milestone = { id: string; title: string; due_date: string; status: string };
type Project = {
  id: string;
  name: string;
  client_name: string;
  status: string;
  description?: string;
  budget: number;
  health_score?: number;
  active_risk_flags?: string[];
  due_date: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#8A9099', medium: '#B89B6A', high: '#A86A6A', urgent: '#A86A6A',
};

export default function ProjectDetail() {
  const { t } = useMobileLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabIdx, setTabIdx] = useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { trackScreen('ProjectDetail'); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [projRes, tasksRes, milestonesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).maybeSingle(),
        supabase.from('tasks').select('*').eq('project_id', id),
        supabase.from('milestones').select('*').eq('project_id', id),
      ]);
      setProject(projRes.data ?? null);
      setTasks(tasksRes.data ?? []);
      setMilestones(milestonesRes.data ?? []);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) return <LoadingSpinner message={t.common.loading} />;

  const health = project?.health_score ?? 80;
  const healthColor = health >= 70 ? '#7FA38A' : health >= 40 ? '#B89B6A' : '#A86A6A';
  const tabLabels = [t.projects.overview, t.projects.tasks, t.projects.files];

  async function handleUpdateTaskStatus(task: Task, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t2 => t2.id === task.id ? { ...t2, status: newStatus } : t2));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function showTaskStatusSheet(task: Task) {
    const displayLabels = ['To Do', 'In Progress', 'Done'];
    const statusValues = ['todo', 'in_progress', 'done'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: task.title, options: [...displayLabels, t.common.cancel], cancelButtonIndex: 3 },
        async (idx) => { if (idx < 3) await handleUpdateTaskStatus(task, statusValues[idx]); },
      );
    } else {
      Alert.alert(task.title, undefined, [
        ...displayLabels.map((label, idx) => ({ text: label, onPress: () => handleUpdateTaskStatus(task, statusValues[idx]) })),
        { text: t.common.cancel, style: 'cancel' as const },
      ]);
    }
  }

  function OverviewTab() {
    if (!project) return null;
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#8A9099', fontSize: 13 }}>{t.projects.client}: <Text style={{ color: '#F5F1E8' }}>{project.client_name}</Text></Text>
          <StatusPill status={project.status} size="md" />
        </View>
        <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#B8BDC7', fontSize: 13 }}>{t.projects.health}</Text>
            <Text style={{ color: healthColor, fontSize: 13, fontWeight: '600' }}>{health}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <View style={{ height: 4, width: `${health}%`, backgroundColor: healthColor, borderRadius: 2 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {[
            { label: t.projects.budget, value: fmt(project.budget) },
            { label: t.projects.dueDate, value: project.due_date },
          ].map(kpi => (
            <View key={kpi.label} style={{ flex: 1, backgroundColor: '#111522', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 4 }}>{kpi.label}</Text>
              <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '600' }}>{kpi.value}</Text>
            </View>
          ))}
        </View>
        {project.description ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 6 }}>{t.projects.description}</Text>
            <Text style={{ color: '#B8BDC7', fontSize: 13, lineHeight: 20 }}>{project.description}</Text>
          </View>
        ) : null}
        {milestones.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 8 }}>{t.projects.milestones.toUpperCase()}</Text>
            {milestones.map(ms => (
              <View key={ms.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={{ color: '#F5F1E8', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>{ms.title}</Text>
                <Text style={{ color: '#8A9099', fontSize: 11, marginRight: 8 }}>{ms.due_date}</Text>
                <StatusPill status={ms.status} />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  function TasksTab() {
    if (tasks.length === 0) return <EmptyState emoji="✅" title={t.common.empty} />;
    return (
      <FlatList
        data={tasks}
        keyExtractor={task => task.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const priorityColor = PRIORITY_COLORS[item.priority.toLowerCase()] ?? '#8A9099';
          return (
            <TouchableOpacity
              onPress={() => showTaskStatusSheet(item)}
              style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ color: '#F5F1E8', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={2}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: `${priorityColor}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 }}>
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
