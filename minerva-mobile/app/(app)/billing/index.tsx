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

type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date?: string;
};

type Client = {
  id: string;
  company: string;
};

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';
const STATUS_VALUES: StatusFilter[] = ['all', 'pending', 'paid', 'overdue'];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Billing() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [statusIdx, setStatusIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => { trackScreen('Billing'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('workspace_id', wid).order('date', { ascending: false }),
      supabase.from('clients').select('id,company').eq('workspace_id', wid),
    ]);
    setAllInvoices(invoicesRes.data ?? []);
    setClients(clientsRes.data ?? []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const clientMap = new Map<string, string>(clients.map(c => [c.id, c.company]));
  const selectedStatus = STATUS_VALUES[statusIdx];
  const invoices = selectedStatus === 'all' ? allInvoices : allInvoices.filter(i => i.status === selectedStatus);

  const outstanding = allInvoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + Number(i.amount), 0);
  const overdue = allInvoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + Number(i.amount), 0);
  const collectedMtd = allInvoices
    .filter(i => i.status === 'paid' && i.paid_date && new Date(i.paid_date).getTime() > Date.now() - THIRTY_DAYS_MS)
    .reduce((acc, i) => acc + Number(i.amount), 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const segmentLabels = [t.billing.status.all, t.billing.status.pending, t.billing.status.paid, t.billing.status.overdue];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.billing.title} />

      {/* KPI row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
        {[
          { label: t.billing.outstanding, value: fmt(outstanding), color: '#B89B6A' },
          { label: t.billing.overdue, value: fmt(overdue), color: '#A86A6A' },
          { label: t.billing.collectedMtd, value: fmt(collectedMtd), color: '#7FA38A' },
        ].map(kpi => (
          <View key={kpi.label} style={{ flex: 1, backgroundColor: '#111522', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: kpi.color, fontSize: 15, fontWeight: '700' }}>{kpi.value}</Text>
            <Text style={{ color: '#8A9099', fontSize: 10, marginTop: 2 }}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      <NativeSegmentedControl values={segmentLabels} selectedIndex={statusIdx} onChange={setStatusIdx} />

      <FlatList
        data={invoices}
        keyExtractor={inv => inv.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
        ListEmptyComponent={<EmptyState emoji="🧾" title={t.billing.noInvoices} />}
        renderItem={({ item: invoice }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/billing/[id]', params: { id: invoice.id } })}
            style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>
                  {t.billing.invoiceNumber}{invoice.invoice_number}
                </Text>
                <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>
                  {clientMap.get(invoice.client_id) ?? '—'}
                </Text>
              </View>
              <StatusPill status={invoice.status} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '700' }}>{fmt(invoice.amount)}</Text>
              <Text style={{ color: '#8A9099', fontSize: 12 }}>{t.billing.dueDate}: {fmtDate(invoice.due_date)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
