import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type TimeEntry = {
  id: string;
  project_id?: string;
  description?: string;
  duration: number; // minutes
  billable: boolean;
  start_time: number; // ms timestamp
};

type Project = {
  id: string;
  name: string;
};

type Translations = ReturnType<typeof import('@/lib/i18n').useMobileLang>['t'];

function getWeekKey(timestamp: number): string {
  const d = new Date(timestamp);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(timestamp: number, t: Translations): string {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${t.timeEntries.weekOf} ${label}`;
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type ListRow =
  | { type: 'header'; weekKey: string; label: string; totalMins: number; billableMins: number }
  | { type: 'entry'; entry: TimeEntry; projectName: string };

export default function TimeEntries() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => { trackScreen('TimeEntries'); }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const workspaceId = wsRes.data?.[0]?.id;
      if (!workspaceId) return;

      const [entriesRes, projectsRes] = await Promise.all([
        supabase.from('time_entries').select('*').eq('workspace_id', workspaceId).eq('user_id', user.id).order('start_time', { ascending: false }),
        supabase.from('projects').select('id,name').eq('workspace_id', workspaceId),
      ]);
      setAllEntries(entriesRes.data ?? []);
      setProjects(projectsRes.data ?? []);
    } catch (err) {
      captureException(err, { screen: 'TimeEntries' });
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const projectMap = new Map<string, string>(projects.map(p => [p.id, p.name]));

  // Group by week
  const weekMap = new Map<string, TimeEntry[]>();
  for (const entry of allEntries) {
    const key = getWeekKey(entry.start_time);
    const existing = weekMap.get(key) ?? [];
    existing.push(entry);
    weekMap.set(key, existing);
  }

  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => b.localeCompare(a));

  const rows: ListRow[] = [];
  for (const weekKey of sortedWeeks) {
    const entries = weekMap.get(weekKey) ?? [];
    const totalMins = entries.reduce((acc, e) => acc + e.duration, 0);
    const billableMins = entries.filter(e => e.billable).reduce((acc, e) => acc + e.duration, 0);
    rows.push({
      type: 'header',
      weekKey,
      label: getWeekLabel(entries[0].start_time, t),
      totalMins,
      billableMins,
    });
    for (const entry of entries.sort((a, b) => b.start_time - a.start_time)) {
      rows.push({
        type: 'entry',
        entry,
        projectName: entry.project_id ? (projectMap.get(entry.project_id) ?? '—') : '—',
      });
    }
  }

  const now = Date.now();
  const thisWeekKey = getWeekKey(now);
  const thisWeekEntries = weekMap.get(thisWeekKey) ?? [];
  const thisWeekTotal = thisWeekEntries.reduce((acc, e) => acc + e.duration, 0);
  const thisWeekBillable = thisWeekEntries.filter(e => e.billable).reduce((acc, e) => acc + e.duration, 0);
  const thisWeekBillablePct = thisWeekTotal > 0 ? Math.round((thisWeekBillable / thisWeekTotal) * 100) : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function handleExportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const header = 'Date,Project,Description,Duration (min),Billable\n';
      const lines = allEntries.map(e => {
        const date = new Date(e.start_time).toISOString().split('T')[0];
        const project = e.project_id ? (projectMap.get(e.project_id) ?? '') : '';
        const description = (e.description ?? '').replace(/,/g, ';');
        return `${date},"${project}","${description}",${e.duration},${e.billable ? 'Yes' : 'No'}`;
      });
      const csv = header + lines.join('\n');
      const path = `${FileSystem.cacheDirectory}time-entries.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (err) {
      captureException(err, { screen: 'TimeEntries', action: 'exportCsv' });
      Alert.alert(t.common.error, t.errors.saveFailed);
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.timeEntries.title} showBack />

      {/* Summary sticky bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#111522',
          borderBottomWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <View>
          <Text style={{ color: '#F5F1E8', fontSize: 16, fontWeight: '700' }}>
            {fmtDuration(thisWeekTotal)}
          </Text>
          <Text style={{ color: '#8A9099', fontSize: 11 }}>
            {thisWeekBillablePct}% {t.timeEntries.billablePercent}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleExportCsv}
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <Text style={{ color: '#B8BDC7', fontSize: 13, fontWeight: '600' }}>
            {exporting ? t.common.loading : t.timeEntries.exportCsv}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) =>
          row.type === 'header' ? `header-${row.weekKey}` : `entry-${row.entry.id}`
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        ListEmptyComponent={<EmptyState emoji="⏱" title={t.timeEntries.noEntries} />}
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const billablePct = row.totalMins > 0 ? Math.round((row.billableMins / row.totalMins) * 100) : 0;
            return (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#8A9099', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {row.label}
                </Text>
                <Text style={{ color: '#8A9099', fontSize: 12 }}>
                  {fmtDuration(row.totalMins)} · {billablePct}% {t.timeEntries.billablePercent}
                </Text>
              </View>
            );
          }

          const { entry, projectName } = row;
          return (
            <View
              style={{
                backgroundColor: '#111522',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#F5F1E8', fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 }}>
                  {projectName}
                </Text>
                <StatusPill
                  status={entry.billable ? 'active' : 'inactive'}
                  label={entry.billable ? t.timeEntries.billable : t.timeEntries.nonBillable}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8A9099', fontSize: 12 }} numberOfLines={1}>
                  {entry.description ?? '—'}
                </Text>
                <Text style={{ color: '#B8BDC7', fontSize: 12, fontWeight: '600' }}>
                  {fmtDuration(entry.duration)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
