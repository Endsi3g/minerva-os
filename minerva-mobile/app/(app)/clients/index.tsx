import { FlatList, View, Text, TextInput, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Client = {
  id: string;
  company: string;
  contact: string;
  email: string;
  status: string;
  monthly_value?: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Clients() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [allClients, setAllClients] = useState<Client[]>([]);
  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => { trackScreen('Clients'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    const { data } = await supabase.from('clients').select('*').eq('workspace_id', wid).order('company');
    setAllClients(data ?? []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const clients = useMemo(() => {
    if (!debouncedSearch.trim()) return allClients;
    const q = debouncedSearch.toLowerCase();
    return allClients.filter(
      c =>
        c.company.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q),
    );
  }, [allClients, debouncedSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  function ClientCard({ client }: { client: Client }) {
    return (
      <SwipeableRow
        rightActions={[
          {
            label: t.clients.email,
            color: '#B89B6A',
            onPress: () => { void Linking.openURL(`mailto:${client.email}`); },
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(app)/clients/[id]', params: { id: client.id } })}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                {client.company}
              </Text>
              <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>{client.contact}</Text>
            </View>
            <StatusPill status={client.status} />
          </View>
          {client.monthly_value !== undefined && client.monthly_value > 0 ? (
            <Text style={{ color: '#B8BDC7', fontSize: 12, marginTop: 8 }}>
              {t.clients.monthlyValue}: {fmt(client.monthly_value)}
            </Text>
          ) : null}
        </TouchableOpacity>
      </SwipeableRow>
    );
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={t.clients.title} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: insets.top > 0 ? 0 : 4 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t.clients.searchPlaceholder}
          placeholderTextColor="#8A9099"
          style={{
            backgroundColor: '#111522',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: '#F5F1E8',
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
      </View>
      <FlatList
        data={clients}
        keyExtractor={c => c.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        renderItem={({ item }) => <ClientCard client={item} />}
        ListEmptyComponent={
          <EmptyState emoji="👥" title={debouncedSearch ? t.common.noResults : t.clients.noClients} />
        }
      />
    </View>
  );
}
