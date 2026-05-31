import { ScrollView, View, Text, TouchableOpacity, TextInput, Platform, ActionSheetIOS, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusPill } from '@/components/StatusPill';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Ticket = {
  id: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  client_id?: string;
  created_at?: string;
  notes?: string[];
};

type Client = { id: string; company: string };

const PRIORITY_COLORS: Record<string, string> = {
  low: '#8A9099', medium: '#B89B6A', high: '#A86A6A', urgent: '#A86A6A',
};

const TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  open:        [{ label: 'Start', next: 'in_progress' }],
  in_progress: [{ label: 'Resolve', next: 'resolved' }],
  resolved:    [{ label: 'Reopen', next: 'open' }, { label: 'Close', next: 'closed' }],
  closed:      [{ label: 'Reopen', next: 'open' }],
};

function fmtDate(dateStr: string | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TicketDetail() {
  const { t } = useMobileLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [actingStatus, setActingStatus] = useState<string | null>(null);

  useEffect(() => { trackScreen('TicketDetail'); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
      setTicket(data ?? null);
      if (data?.client_id) {
        const { data: clientData } = await supabase.from('clients').select('id,company').eq('id', data.client_id).maybeSingle();
        setClient(clientData ?? null);
      }
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!ticket) return;
    setActingStatus(newStatus);
    try {
      await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
      setTicket(prev => prev ? { ...prev, status: newStatus } : prev);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t.errors.generic);
    } finally {
      setActingStatus(null);
    }
  }

  function confirmStatusChange(label: string, next: string) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [label, t.common.cancel], cancelButtonIndex: 1 },
        (idx) => { if (idx === 0) handleStatusChange(next); },
      );
    } else {
      Alert.alert(label + '?', undefined, [
        { text: label, onPress: () => handleStatusChange(next) },
        { text: t.common.cancel, style: 'cancel' },
      ]);
    }
  }

  async function handleSendReply() {
    if (!reply.trim() || !ticket) return;
    setSending(true);
    try {
      const notes = [...(ticket.notes ?? []), reply.trim()];
      await supabase.from('tickets').update({ notes }).eq('id', id);
      setTicket(prev => prev ? { ...prev, notes } : prev);
      setReply('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert(t.errors.saveFailed);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingSpinner message={t.common.loading} />;

  if (!ticket) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
        <Header title="" showBack />
      </View>
    );
  }

  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? '#8A9099';
  const actions = TRANSITIONS[ticket.status] ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={ticket.subject} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Status & priority row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <StatusPill status={ticket.status} size="md" />
          <View style={{ backgroundColor: `${priorityColor}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
            <Text style={{ color: priorityColor, fontSize: 11, fontWeight: '600' }}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </Text>
          </View>
          {ticket.category ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
              <Text style={{ color: '#8A9099', fontSize: 11 }}>{ticket.category}</Text>
            </View>
          ) : null}
        </View>

        {/* Metadata card */}
        <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          {client ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#8A9099', fontSize: 12 }}>{t.tickets.client}</Text>
              <Text style={{ color: '#F5F1E8', fontSize: 12, fontWeight: '600' }}>{client.company}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#8A9099', fontSize: 12 }}>Created</Text>
            <Text style={{ color: '#B8BDC7', fontSize: 12 }}>{fmtDate(ticket.created_at)}</Text>
          </View>
        </View>

        {/* Description */}
        {ticket.description ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#8A9099', fontSize: 11, marginBottom: 8 }}>{t.tickets.description.toUpperCase()}</Text>
            <Text style={{ color: '#B8BDC7', fontSize: 13, lineHeight: 20 }}>{ticket.description}</Text>
          </View>
        ) : null}

        {/* Status actions */}
        {actions.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {actions.map(({ label, next }) => (
              <TouchableOpacity
                key={next}
                onPress={() => confirmStatusChange(label, next)}
                disabled={actingStatus === next}
                style={{ flex: 1, backgroundColor: '#7FA38A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: actingStatus === next ? 0.6 : 1 }}
              >
                <Text style={{ color: '#0A0D14', fontSize: 14, fontWeight: '700' }}>
                  {actingStatus === next ? t.common.saving : label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Activity / notes */}
        <Text style={{ color: '#8A9099', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>ACTIVITY</Text>
        {(ticket.notes ?? []).length === 0 ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
            <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center' }}>No activity yet.</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 12 }}>
            {(ticket.notes ?? []).map((note, i) => (
              <View
                key={i}
                style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Text style={{ color: '#B8BDC7', fontSize: 13, lineHeight: 19 }}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reply box */}
        {ticket.status !== 'closed' ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply..."
              placeholderTextColor="#8A9099"
              multiline
              style={{ color: '#F5F1E8', fontSize: 13, minHeight: 64, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={!reply.trim() || sending}
              style={{ marginTop: 8, backgroundColor: '#F5F1E8', borderRadius: 10, paddingVertical: 10, alignItems: 'center', opacity: !reply.trim() || sending ? 0.5 : 1 }}
            >
              <Text style={{ color: '#0A0D14', fontSize: 13, fontWeight: '700' }}>
                {sending ? t.common.saving : 'Send reply'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
