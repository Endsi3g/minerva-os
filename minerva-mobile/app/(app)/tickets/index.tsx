import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../convex/_generated/api';

type Ticket = {
  _id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  clientId?: string;
  _creationTime?: number;
};

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
const STATUS_VALUES: StatusFilter[] = ['all', 'open', 'in_progress', 'resolved'];

function fmtDate(timestamp: number | undefined): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TicketsIndex() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [statusIdx, setStatusIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { trackScreen('Tickets'); }, []);

  let workspaces: { _id: string }[] = [];
  try {
    workspaces = (useQuery(api.workspaces.list, {}) ?? []) as { _id: string }[];
  } catch (err) {
    captureException(err, { screen: 'Tickets' });
  }
  const workspaceId = workspaces[0]?._id;

  const allTickets = (useQuery(
    api.tickets.list,
    workspaceId ? { workspaceId } : 'skip',
  ) ?? []) as Ticket[];

  const selectedStatus = STATUS_VALUES[statusIdx];
  const tickets = selectedStatus === 'all'
    ? allTickets
    : allTickets.filter(ticket => ticket.status === selectedStatus);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const segmentLabels = [
    t.tickets.status.all,
    t.tickets.status.open,
    t.tickets.status.in_progress,
    t.tickets.status.resolved,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.tickets.title} showBack />

      <NativeSegmentedControl
        values={segmentLabels}
        selectedIndex={statusIdx}
        onChange={setStatusIdx}
      />

      <FlatList
        data={tickets}
        keyExtractor={ticket => ticket._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        ListEmptyComponent={
          <EmptyState emoji="🎫" title={t.tickets.noTickets} />
        }
        renderItem={({ item: ticket }) => (
          <View
            style={{
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 }} numberOfLines={2}>
                {ticket.subject}
              </Text>
              <StatusPill status={ticket.priority} label={ticket.priority} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusPill status={ticket.status} />
              <Text style={{ color: '#8A9099', fontSize: 12 }}>
                {fmtDate(ticket._creationTime)}
              </Text>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/tickets/new')}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#F5F1E8',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ color: '#0A0D14', fontSize: 28, lineHeight: 32, fontWeight: '400' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
