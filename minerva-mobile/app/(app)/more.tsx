import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp, Users, Receipt, Clock, Wallet,
  FileText, BookOpen, MessageSquare, UserCircle, Gauge, Bot,
} from 'lucide-react-native';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { useEffect } from 'react';

const MODULES = [
  { key: 'cockpit', icon: Gauge, route: '/(app)/cockpit' },
  { key: 'pipeline', icon: TrendingUp, route: '/(app)/pipeline' },
  { key: 'clients', icon: Users, route: '/(app)/clients/index' },
  { key: 'billing', icon: Receipt, route: '/(app)/billing/index' },
  { key: 'timeEntries', icon: Clock, route: '/(app)/time-entries' },
  { key: 'expenses', icon: Wallet, route: '/(app)/expenses/index' },
  { key: 'proposals', icon: FileText, route: '/(app)/proposals/index' },
  { key: 'knowledge', icon: BookOpen, route: '/(app)/knowledge/index' },
  { key: 'tickets', icon: MessageSquare, route: '/(app)/tickets/index' },
  { key: 'agentOps', icon: Bot, route: '/(app)/agent-ops' },
  { key: 'profile', icon: UserCircle, route: '/(app)/profile' },
] as const;

export default function More() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();

  useEffect(() => { trackScreen('More'); }, []);

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}
    >
      <Text className="text-ivory text-2xl font-semibold mb-6">{t.more.title}</Text>

      <View className="flex-row flex-wrap gap-3">
        {MODULES.map(({ key, icon: Icon, route }) => (
          <TouchableOpacity
            key={key}
            onPress={() => router.push(route as Parameters<typeof router.push>[0])}
            style={{
              width: '30%',
              aspectRatio: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Icon size={26} color="#4F46E5" />
            <Text style={{ color: '#475569', fontSize: 10, fontWeight: '500', textAlign: 'center', paddingHorizontal: 4 }}>
              {t.more[key as keyof typeof t.more]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
