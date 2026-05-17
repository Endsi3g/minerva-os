import { View, Text } from 'react-native';

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  color?: string;
}

export function KPICard({ label, value, delta, color = '#F5F1E8' }: KPICardProps) {
  return (
    <View
      className="flex-1 rounded-2xl p-4 border border-white/8"
      style={{ backgroundColor: '#111522' }}
    >
      <Text className="text-fog text-xs mb-1 uppercase tracking-wider">{label}</Text>
      <Text className="text-2xl font-semibold tabular-nums" style={{ color }}>{value}</Text>
      {delta ? (
        <Text className="text-fog text-xs mt-1">{delta}</Text>
      ) : null}
    </View>
  );
}
