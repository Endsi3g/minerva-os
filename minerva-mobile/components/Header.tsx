import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightLabel?: string;
  onRightPress?: () => void;
}

export function Header({ title, subtitle, showBack, rightLabel, onRightPress }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0A0D14' }}
      className="flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1" hitSlop={8}>
            <ChevronLeft size={22} color="#8A9099" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-ivory text-2xl font-semibold">{title}</Text>
          {subtitle ? <Text className="text-fog text-sm mt-0.5">{subtitle}</Text> : null}
        </View>
      </View>
      {rightLabel && onRightPress && (
        <TouchableOpacity
          onPress={onRightPress}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#F5F1E8' }}
        >
          <Text className="text-obsidian text-sm font-semibold">{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
