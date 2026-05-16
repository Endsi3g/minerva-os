import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // TODO: wire up Convex Auth signIn action
      // await signIn('password', { email, password });
      router.replace('/(app)/dashboard');
    } catch {
      setError('Sign in failed. Please try again.');
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
          <View className="h-12 w-12 rounded-2xl bg-ivory items-center justify-center mb-4">
            <Text className="text-obsidian font-bold text-xl">M</Text>
          </View>
          <Text className="text-ivory text-2xl font-semibold">Sign in to Minerva</Text>
          <Text className="text-fog text-sm mt-1">Enter your credentials to access your workspace.</Text>
        </View>

        {/* Form */}
        <View className="space-y-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@youragency.com"
            placeholderTextColor="#8A9099"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-midnight border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-sm"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#8A9099"
            secureTextEntry
            autoComplete="password"
            className="bg-midnight border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-sm"
          />

          {error ? (
            <Text className="text-ember text-xs px-1">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className="bg-ivory rounded-xl py-3.5 items-center mt-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#0A0D14" />
            ) : (
              <Text className="text-obsidian font-semibold text-sm">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dev shortcut — remove before production */}
        <TouchableOpacity
          onPress={() => router.replace('/(app)/dashboard')}
          className="mt-6 items-center"
        >
          <Text className="text-fog/50 text-xs">Skip (dev only)</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
