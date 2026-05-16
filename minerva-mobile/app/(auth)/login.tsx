import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';

export default function Login() {
  const { t } = useMobileLang();
  const { signIn } = useAppAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)/dashboard');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t.errors.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-obsidian"
    >
      <View className="flex-1 justify-center px-6">
        {/* Brand */}
        <View className="items-center mb-10">
          <View className="h-14 w-14 rounded-2xl bg-ivory items-center justify-center mb-4">
            <Text className="text-obsidian font-bold text-2xl" style={{ fontFamily: 'serif' }}>M</Text>
          </View>
          <Text className="text-ivory text-2xl font-semibold">{t.auth.welcomeBack}</Text>
          <Text className="text-fog text-sm mt-1">{t.auth.tagline}</Text>
        </View>

        {/* Form */}
        <View style={{ gap: 12 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.email}
            placeholderTextColor="#8A9099"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={{
              backgroundColor: '#111522',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: '#F5F1E8',
              fontSize: 14,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.password}
            placeholderTextColor="#8A9099"
            secureTextEntry
            autoComplete="password"
            onSubmitEditing={handleSignIn}
            returnKeyType="go"
            style={{
              backgroundColor: '#111522',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: '#F5F1E8',
              fontSize: 14,
            }}
          />

          {error ? (
            <Text style={{ color: '#A86A6A', fontSize: 12, paddingHorizontal: 4 }}>{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            style={{
              backgroundColor: '#F5F1E8',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#0A0D14" />
            ) : (
              <Text style={{ color: '#0A0D14', fontWeight: '600', fontSize: 14 }}>
                {t.auth.signIn}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-5 items-center">
          <Text className="text-fog text-xs">{t.auth.forgotPassword}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
