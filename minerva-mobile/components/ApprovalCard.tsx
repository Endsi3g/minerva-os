import { View, Text, TouchableOpacity } from 'react-native';

type ApprovalStatus = 'pending' | 'approved' | 'revision';

interface ApprovalCardProps {
  title: string;
  type: string;
  submittedBy: string;
  status: ApprovalStatus;
  onApprove: () => void;
  onRevise: () => void;
}

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: '#B89B6A',
  approved: '#7FA38A',
  revision: '#A86A6A',
};

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  revision: 'Revision',
};

export function ApprovalCard({ title, type, submittedBy, status, onApprove, onRevise }: ApprovalCardProps) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <View
      className="rounded-2xl p-4 mb-3 border border-white/8"
      style={{ backgroundColor: '#111522' }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{label}</Text>
        </View>
        <Text className="text-fog text-xs">{type}</Text>
      </View>

      <Text className="text-ivory text-sm font-medium mb-1" numberOfLines={2}>{title}</Text>
      <Text className="text-fog text-xs">by {submittedBy}</Text>

      {status === 'pending' && (
        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity
            onPress={onApprove}
            className="flex-1 py-2 rounded-xl items-center"
            style={{ backgroundColor: '#7FA38A20', borderWidth: 1, borderColor: '#7FA38A40' }}
          >
            <Text className="text-sage text-xs font-semibold">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRevise}
            className="flex-1 py-2 rounded-xl items-center"
            style={{ backgroundColor: '#B89B6A20', borderWidth: 1, borderColor: '#B89B6A40' }}
          >
            <Text className="text-warm text-xs font-semibold">Request changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
