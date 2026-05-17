import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from 'convex/react';
import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type TimeEntry = {
  _id: string;
  projectId?: string;
  description?: string;
  durationMs: number;
  billable: boolean;
  startTime: number;
};

type Project = {
  _id: string;
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
  // get Monday of that week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${t.timeEntries.weekOf} ${label}`;
}

function fmtDuration(ms: number): string {
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type ListRow =
  | { type: 'header'; weekKey: string; label: string; totalMs: number; billableMs: number }
  | { type: 'entry'; entry: TimeEntry; projectName: string };

export default function TimeEntries() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { trackScreen('TimeEntries'); }, []);

  let workspaces: { _id: string }[] = [];
  try {
    workspaces = (useQuery(api.workspaces.list, {}) ?? []) as { _id: string }[];
  } catch (err) {
    captureException(err, { screen: 'TimeEntries' });
  }
  const workspaceId = workspaces[0]?._id;

  const allEntries = (useQuery(
    api.timeEntries.listByUser,
    workspaceId && user ? { userId: user._id, workspaceId } : 'skip',
  ) ?? []) as TimeEntry[];

  const projects = (useQuery(
    api.projects.list,
    workspaceId ? { workspaceId } : 'skip',
  ) ?? []) as Project[];

  const projectMap = new Map<string, string>(projects.map(p => [p._id, p.name]));

  // Group by week
  const weekMap = new Map<string, TimeEntry[]>();
  for (const entry of allEntries) {
    const key = getWeekKey(entry.startTime);
    const existing = weekMap.get(key) ?? [];
    existing.push(entry);
    weekMap.set(key, existing);
  }

  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => b.localeCompare(a));

  const rows: ListRow[] = [];
  for (const weekKey of sortedWeeks) {
    const entries = weekMap.get(weekKey) ?? [];
    const totalMs = entries.reduce((acc, e) => acc + e.durationMs, 0);
    const billableMs = entries.filter(e => e.billable).reduce((acc, e) => acc + e.durationMs, 0);
    rows.push({
      type: 'header',
      weekKey,
      label: getWeekLabel(entries[0].startTime, t),
      totalMs,
      billableMs,
    });
    for (const entry of entries.sort((a, b) => b.startTime - a.startTime)) {
      rows.push({
        type: 'entry',
        entry,
        projectName: entry.projectId ? (projectMap.get(entry.projectId) ?? '—') : '—',
      });
    }
  }

  // This week summary
  const now = Date.now();
  const thisWeekKey = getWeekKey(now);
  const thisWeekEntries = weekMap.get(thisWeekKey) ?? [];
  const thisWeekTotal = thisWeekEntries.reduce((acc, e) => acc + e.durationMs, 0);
  const thisWeekBillable = thisWeekEntries.filter(e => e.billable).reduce((acc, e) => acc + e.durationMs, 0);
  const thisWeekBillablePct = thisWeekTotal > 0 ? Math.round((thisWeekBillable / thisWeekTotal) * 100) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  async function handleExportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const header = 'Date,Project,Description,Duration (min),Billable\n';
      const lines = allEntries.map(e => {
        const date = new Date(e.startTime).toISOString().split('T')[0];
        const project = e.projectId ? (projectMap.get(e.projectId) ?? '') : '';
        const description = (e.description ?? '').replace(/,/g, ';');
        const mins = Math.floor(e.durationMs / 60000);
        return `${date},"${project}","${description}",${mins},${e.billable ? 'Yes' : 'No'}`;
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
          row.type === 'header' ? `header-${row.weekKey}` : `entry-${row.entry._id}`
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        ListEmptyComponent={<EmptyState emoji="⏱" title={t.timeEntries.noEntries} />}
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const billablePct = row.totalMs > 0 ? Math.round((row.billableMs / row.totalMs) * 100) : 0;
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
                  {fmtDuration(row.totalMs)} · {billablePct}% {t.timeEntries.billablePercent}
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
                  {fmtDuration(entry.durationMs)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
