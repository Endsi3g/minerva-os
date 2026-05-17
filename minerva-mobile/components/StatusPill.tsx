import { View, Text } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  active: '#7FA38A',
  approved: '#7FA38A',
  paid: '#7FA38A',
  signed: '#7FA38A',
  won: '#7FA38A',
  resolved: '#7FA38A',
  completed: '#7FA38A',
  pending: '#B89B6A',
  in_progress: '#B89B6A',
  sent: '#B89B6A',
  onboarding: '#B89B6A',
  open: '#B89B6A',
  revision: '#A86A6A',
  overdue: '#A86A6A',
  declined: '#A86A6A',
  rejected: '#A86A6A',
  lost: '#A86A6A',
  on_hold: '#8A9099',
  draft: '#8A9099',
  inactive: '#8A9099',
  closed: '#8A9099',
  cancelled: '#8A9099',
};

interface StatusPillProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, label, size = 'sm' }: StatusPillProps) {
  const color = STATUS_COLORS[status.toLowerCase()] ?? '#8A9099';
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  const fontSize = size === 'md' ? 12 : 10;
  const paddingH = size === 'md' ? 8 : 6;
  const paddingV = size === 'md' ? 4 : 2;

  return (
    <View style={{
      backgroundColor: `${color}20`,
      paddingHorizontal: paddingH,
      paddingVertical: paddingV,
      borderRadius: 99,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ color, fontSize, fontWeight: '600' }}>{displayLabel}</Text>
    </View>
  );
}
