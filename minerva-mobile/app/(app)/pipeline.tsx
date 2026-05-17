import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery } from 'convex/react';
import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { NativeSegmentedControl } from '@/components/NativeSegmentedControl';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type Deal = {
  _id: string;
  name: string;
  stage: string;
  value?: number;
  company?: string;
  contact?: string;
};

const STAGE_VALUES = ['new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
type Stage = (typeof STAGE_VALUES)[number];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Pipeline() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [stageIdx, setStageIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { trackScreen('Pipeline'); }, []);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const allDeals = (useQuery(api.deals.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Deal[];

  const selectedStage: Stage = STAGE_VALUES[stageIdx];
  const deals = allDeals.filter(d => d.stage === selectedStage);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const stageLabels: string[] = [
    t.pipeline.stages.new_lead,
    t.pipeline.stages.qualified,
    t.pipeline.stages.proposal,
    t.pipeline.stages.negotiation,
    t.pipeline.stages.won,
    t.pipeline.stages.lost,
  ];

  function DealCard({ deal }: { deal: Deal }) {
    return (
      <View
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
              {deal.company ?? deal.name}
            </Text>
            {deal.contact ? (
              <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>{deal.contact}</Text>
            ) : null}
          </View>
          <StatusPill status={deal.stage} />
        </View>
        {deal.value !== undefined && deal.value > 0 ? (
          <Text style={{ color: '#7FA38A', fontSize: 14, fontWeight: '700' }}>
            {fmt(deal.value)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={t.pipeline.title} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: insets.top > 0 ? 0 : 4 }}>
        <NativeSegmentedControl
          values={stageLabels}
          selectedIndex={stageIdx}
          onChange={setStageIdx}
        />
      </View>
      <FlatList
        data={deals}
        keyExtractor={d => d._id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
        }
        renderItem={({ item }) => <DealCard deal={item} />}
        ListEmptyComponent={<EmptyState emoji="📈" title={t.pipeline.noDealsinStage} />}
      />
    </View>
  );
}
