import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/Header';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

const INPUT_STYLE = {
  backgroundColor: '#111522',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#F5F1E8',
  fontSize: 14,
} as const;

export default function Profile() {
  const { t, lang, setLang } = useMobileLang();
  const { user, signOut, changePassword } = useAppAuth();

  const profile = useQuery(api.userProfiles.viewer) as UserProfile | null | undefined;
  const updateProfile = useMutation(api.userProfiles.update);

  const [name, setName] = useState(profile?.name ?? user?.name ?? '');
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    try {
      await updateProfile({
        id: profile._id as Parameters<typeof updateProfile>[0]['id'],
        name: name.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError('');
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t.errors.passwordMismatch);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordExpanded(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setPasswordError(t.errors.saveFailed);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSignOut() {
    Alert.alert(t.profile.signOut, t.profile.signOutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.signOut,
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={t.profile.title} showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Section */}
        <Text
          style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}
        >
          {t.profile.profileSection}
        </Text>

        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            padding: 16,
            marginBottom: 24,
            gap: 12,
          }}
        >
          <View>
            <Text style={{ color: '#8A9099', fontSize: 12, marginBottom: 6 }}>{t.profile.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholderTextColor="#8A9099"
              style={INPUT_STYLE}
            />
          </View>

          <View>
            <Text style={{ color: '#8A9099', fontSize: 12, marginBottom: 6 }}>{t.profile.role}</Text>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(184,157,106,0.15)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#B89B6A', fontSize: 13 }}>
                {profile?.role ?? user?.role ?? ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={savingProfile}
            style={{
              backgroundColor: '#F5F1E8',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: savingProfile ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#0A0D14', fontSize: 14, fontWeight: '600' }}>
              {t.profile.save}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <Text
          style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}
        >
          {t.profile.changePassword}
        </Text>

        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={() => setPasswordExpanded(v => !v)}
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '500' }}>
              {t.profile.changePassword}
            </Text>
            <Text style={{ color: '#8A9099', fontSize: 18 }}>{passwordExpanded ? '−' : '+'}</Text>
          </TouchableOpacity>

          {passwordExpanded && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t.profile.currentPassword}
                placeholderTextColor="#8A9099"
                secureTextEntry
                style={INPUT_STYLE}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t.profile.newPassword}
                placeholderTextColor="#8A9099"
                secureTextEntry
                style={INPUT_STYLE}
              />
              <TextInput
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder={t.profile.confirmNewPassword}
                placeholderTextColor="#8A9099"
                secureTextEntry
                style={INPUT_STYLE}
              />

              {passwordError !== '' && (
                <Text style={{ color: '#A86A6A', fontSize: 13 }}>{passwordError}</Text>
              )}

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={savingPassword}
                style={{
                  backgroundColor: '#F5F1E8',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: savingPassword ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#0A0D14', fontSize: 14, fontWeight: '600' }}>
                  {t.profile.changePassword}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* App Settings Section */}
        <Text
          style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}
        >
          {t.profile.appSection}
        </Text>

        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#8A9099', fontSize: 12, marginBottom: 10 }}>{t.profile.language}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['en', 'fr'] as const).map(code => {
              const isActive = lang === code;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setLang(code)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isActive ? '#7FA38A' : 'rgba(255,255,255,0.1)',
                    backgroundColor: isActive ? '#7FA38A20' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? '#7FA38A' : '#8A9099',
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {code === 'en' ? 'EN' : 'FR'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Section */}
        <Text
          style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}
        >
          {t.profile.accountSection}
        </Text>

        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            padding: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: 'rgba(168,106,106,0.15)',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(168,106,106,0.3)',
            }}
          >
            <Text style={{ color: '#A86A6A', fontSize: 14, fontWeight: '600' }}>
              {t.profile.signOut}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
