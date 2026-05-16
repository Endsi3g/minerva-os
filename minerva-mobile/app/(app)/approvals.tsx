import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import { ApprovalCard } from '@/components/ApprovalCard';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type Approval = {
  _id: string;
  title: string;
  type: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'revision';
};

export default function Approvals() {
  const [refreshing, setRefreshing] = useState(false);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const approvals = (useQuery(api.approvals.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Approval[];
  const updateApproval = useMutation(api.approvals.update);

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  async function handleApprove(id: string) {
    await updateApproval({ id: id as Parameters<typeof updateApproval>[0]['id'], status: 'approved' });
  }

  async function handleRevise(id: string) {
    await updateApproval({ id: id as Parameters<typeof updateApproval>[0]['id'], status: 'revision' });
  }

  const sections = [
    ...(pending.length > 0 ? [{ type: 'header', label: `Pending (${pending.length})`, id: 'h-pending' }] : []),
    ...pending.map(a => ({ type: 'item', ...a })),
    ...(resolved.length > 0 ? [{ type: 'header', label: 'Resolved', id: 'h-resolved' }] : []),
    ...resolved.map(a => ({ type: 'item', ...a })),
  ];

  return (
    <View className="flex-1 bg-obsidian">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-ivory text-2xl font-semibold">Approvals</Text>
        <Text className="text-fog text-sm mt-0.5">{approvals.length} deliverables · {pending.length} pending</Text>
      </View>

      {approvals.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-fog/50 text-sm">No deliverables yet.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => item.id ?? item._id ?? item.label ?? ''}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text className="text-fog text-xs uppercase tracking-widest mb-2 mt-2">{item.label}</Text>
              );
            }
            return (
              <ApprovalCard
                title={item.title ?? ''}
                type={item.type === 'item' ? (item as Approval).type : ''}
                submittedBy={(item as Approval).submittedBy ?? ''}
                status={(item as Approval).status}
                onApprove={() => handleApprove((item as Approval)._id)}
                onRevise={() => handleRevise((item as Approval)._id)}
              />
            );
          }}
        />
      )}
    </View>
  );
}
