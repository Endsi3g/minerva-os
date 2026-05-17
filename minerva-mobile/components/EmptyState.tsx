import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon: Icon, emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      {emoji ? (
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      ) : Icon ? (
        <Icon size={48} color="#8A9099" />
      ) : null}
      <Text className="text-ivory text-base font-medium text-center">{title}</Text>
      {subtitle ? <Text className="text-fog text-sm text-center">{subtitle}</Text> : null}
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          className="mt-2 px-6 py-2.5 rounded-xl"
          style={{ backgroundColor: '#F5F1E8' }}
        >
          <Text className="text-obsidian text-sm font-semibold">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
