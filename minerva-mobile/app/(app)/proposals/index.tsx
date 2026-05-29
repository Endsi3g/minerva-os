import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Proposal = {
  id: string;
  title: string;
  client_id: string;
  total_amount: number;
  status: string;
  sent_at?: string;
  valid_until?: string;
  token?: string;
};

type StatusFilter = 'all' | 'draft' | 'sent' | 'signed' | 'declined';
const STATUS_VALUES: StatusFilter[] = ['all', 'draft', 'sent', 'signed', 'declined'];

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProposalsIndex() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [statusIdx, setStatusIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);

  useEffect(() => { trackScreen('Proposals'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    const { data } = await supabase.from('proposals').select('*').eq('workspace_id', wid).order('created_at', { ascending: false });
    setAllProposals(data ?? []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedStatus = STATUS_VALUES[statusIdx];
  const proposals = selectedStatus === 'all' ? allProposals : allProposals.filter(p => p.status === selectedStatus);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const segmentLabels = [t.proposals.status.all, t.proposals.status.draft, t.proposals.status.sent, t.proposals.status.signed, t.proposals.status.declined];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.proposals.title} showBack />

      <NativeSegmentedControl values={segmentLabels} selectedIndex={statusIdx} onChange={setStatusIdx} />

      <FlatList
        data={proposals}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
        ListEmptyComponent={<EmptyState emoji="📄" title={t.proposals.noProposals} />}
        renderItem={({ item: proposal }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/proposals/[id]', params: { id: proposal.id, token: proposal.token ?? '' } })}
            style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 }} numberOfLines={1}>{proposal.title}</Text>
              <StatusPill status={proposal.status} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#7FA38A', fontSize: 15, fontWeight: '700' }}>{fmt(proposal.total_amount)}</Text>
              {proposal.valid_until && (
                <Text style={{ color: '#8A9099', fontSize: 12 }}>{t.proposals.validUntil} {fmtDate(proposal.valid_until)}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
