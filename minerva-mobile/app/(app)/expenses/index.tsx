import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type Expense = {
  id: string;
  submitted_by: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  status: string;
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
const STATUS_VALUES: StatusFilter[] = ['all', 'pending', 'approved', 'rejected'];

const CATEGORY_EMOJI: Record<string, string> = {
  travel: '✈️', meals: '🍽️', software: '💻', hardware: '🖥️', marketing: '📣', office: '🏢', other: '📋',
};

function fmt(n: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(n);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpensesIndex() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [statusIdx, setStatusIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  useEffect(() => { trackScreen('Expenses'); }, []);

  const loadData = useCallback(async () => {
    try {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      const { data } = await supabase.from('expenses').select('*').eq('workspace_id', wid).order('date', { ascending: false });
      setAllExpenses(data ?? []);
    } catch (err) {
      captureException(err, { screen: 'Expenses' });
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedStatus = STATUS_VALUES[statusIdx];
  const expenses = selectedStatus === 'all' ? allExpenses : allExpenses.filter(e => e.status === selectedStatus);

  const totalAmount = allExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const pendingCount = allExpenses.filter(e => e.status === 'pending').length;
  const approvedCount = allExpenses.filter(e => e.status === 'approved').length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const segmentLabels = [t.expenses.status.all, t.expenses.status.pending, t.expenses.status.approved, t.expenses.status.rejected];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.expenses.title} showBack />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
      >
        {[
          { label: t.expenses.total, value: fmt(totalAmount, 'USD'), color: '#B8BDC7' },
          { label: t.expenses.pending, value: String(pendingCount), color: '#B89B6A' },
          { label: t.expenses.approved, value: String(approvedCount), color: '#7FA38A' },
        ].map(chip => (
          <View key={chip.label} style={{ backgroundColor: '#111522', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: chip.color, fontSize: 14, fontWeight: '700' }}>{chip.value}</Text>
            <Text style={{ color: '#8A9099', fontSize: 11 }}>{chip.label}</Text>
          </View>
        ))}
      </ScrollView>

      <NativeSegmentedControl values={segmentLabels} selectedIndex={statusIdx} onChange={setStatusIdx} />

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
        ListEmptyComponent={<EmptyState emoji="💳" title={t.expenses.noExpenses} />}
        renderItem={({ item: expense }) => (
          <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{CATEGORY_EMOJI[expense.category] ?? '📋'}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 }} numberOfLines={1}>{expense.description}</Text>
                <StatusPill status={expense.status} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#7FA38A', fontSize: 14, fontWeight: '700' }}>{fmt(expense.amount, expense.currency)}</Text>
                <Text style={{ color: '#8A9099', fontSize: 12 }}>{fmtDate(expense.date)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/(app)/expenses/new')}
        style={{ position: 'absolute', bottom: insets.bottom + 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5F1E8', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
      >
        <Text style={{ color: '#0A0D14', fontSize: 28, lineHeight: 32, fontWeight: '400' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
