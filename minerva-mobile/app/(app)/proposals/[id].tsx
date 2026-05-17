import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../convex/_generated/api';

type ProposalSection = {
  type: string;
  content: string;
};

type Proposal = {
  _id: string;
  title: string;
  clientId: string;
  totalAmount: number;
  status: string;
  sentAt?: string;
  validUntil?: string;
  token?: string;
  sections?: ProposalSection[];
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function capitalizeType(type: string): string {
  const map: Record<string, string> = {
    intro: 'Intro',
    scope: 'Scope',
    timeline: 'Timeline',
    pricing: 'Pricing',
    terms: 'Terms',
  };
  return map[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

export default function ProposalDetail() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  useEffect(() => { trackScreen('ProposalDetail'); }, []);

  let workspaces: { _id: string }[] = [];
  try {
    workspaces = (useQuery(api.workspaces.list, {}) ?? []) as { _id: string }[];
  } catch (err) {
    captureException(err, { screen: 'ProposalDetail' });
  }
  const workspaceId = workspaces[0]?._id;

  const allProposals = (useQuery(
    api.proposals.list,
    workspaceId ? { workspaceId } : 'skip',
  ) ?? []) as Proposal[];

  const signProposal = useMutation(api.proposals.sign);
  const declineProposal = useMutation(api.proposals.decline);

  const proposal = allProposals.find(p => p._id === id);

  if (!proposal && workspaceId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
        <Header title={t.proposals.sections} showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
        <Header title={t.proposals.sections} showBack />
        <LoadingSpinner />
      </View>
    );
  }

  const sections: ProposalSection[] = proposal.sections ?? [];

  async function handleSign() {
    if (!proposal?.token) return;
    Alert.alert(
      t.proposals.signConfirm,
      t.proposals.signConfirmBody,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.proposals.sign,
          onPress: async () => {
            try {
              await signProposal({ token: proposal.token!, signedBy: user?.name ?? 'Unknown' });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              captureException(err, { screen: 'ProposalDetail', action: 'sign' });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ],
    );
  }

  async function handleDecline() {
    if (!proposal?.token) return;
    Alert.alert(
      t.proposals.declineConfirm,
      undefined,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.proposals.decline,
          style: 'destructive',
          onPress: async () => {
            try {
              await declineProposal({ token: proposal.token! });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              captureException(err, { screen: 'ProposalDetail', action: 'decline' });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.proposals.sections} showBack />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Proposal header */}
        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 14,
            padding: 16,
            marginTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Text style={{ color: '#F5F1E8', fontSize: 17, fontWeight: '700', flex: 1, marginRight: 10 }}>
              {proposal.title}
            </Text>
            <StatusPill status={proposal.status} size="md" />
          </View>
          <Text style={{ color: '#7FA38A', fontSize: 20, fontWeight: '700' }}>
            {fmt(proposal.totalAmount)}
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View
            key={idx}
            style={{
              marginTop: 12,
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              {capitalizeType(section.type)}
            </Text>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <Text style={{ color: '#B8BDC7', fontSize: 14, lineHeight: 20 }}>
                {section.content}
              </Text>
            </ScrollView>
          </View>
        ))}

        {/* Actions for sent proposals */}
        {proposal.status === 'sent' && (
          <View style={{ marginTop: 24, gap: 10 }}>
            <TouchableOpacity
              onPress={handleSign}
              style={{
                backgroundColor: '#7FA38A',
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#0A0D14', fontSize: 15, fontWeight: '700' }}>
                {t.proposals.sign}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecline}
              style={{
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(168,106,106,0.4)',
                backgroundColor: 'rgba(168,106,106,0.08)',
              }}
            >
              <Text style={{ color: '#A86A6A', fontSize: 15, fontWeight: '600' }}>
                {t.proposals.decline}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
