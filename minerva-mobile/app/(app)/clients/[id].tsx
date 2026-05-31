import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusPill } from '@/components/StatusPill';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Client = {
  id: string;
  company: string;
  contact: string;
  email: string;
  status: string;
  monthly_value?: number;
};

type Project = {
  id: string;
  name: string;
  client_name: string;
  status: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function hasPhone(contact: string): boolean {
  return /[\d\s\-\+\(\)]{7,}/.test(contact);
}

export default function ClientDetail() {
  const { t } = useMobileLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { trackScreen('ClientDetail'); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clientRes, projectsRes, invoicesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).maybeSingle(),
        supabase.from('projects').select('id,name,client_name,status'),
        supabase.from('invoices').select('*').eq('client_id', id).order('due_date', { ascending: false }),
      ]);
      setClient(clientRes.data ?? null);
      setProjects((projectsRes.data ?? []).filter((p: Project) => p.client_name === clientRes.data?.company));
      setInvoices(invoicesRes.data ?? []);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) return <LoadingSpinner message={t.common.loading} />;

  if (!client) {
    return (
      <View className="flex-1 bg-obsidian">
        <Header title="" showBack />
      </View>
    );
  }

  const showCall = hasPhone(client.contact);

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={client.company} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Header area */}
        <View style={{ backgroundColor: '#111522', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#F5F1E8', fontSize: 20, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={2}>
              {client.company}
            </Text>
            <StatusPill status={client.status} size="md" />
          </View>
          <Text style={{ color: '#8A9099', fontSize: 12, marginBottom: 2 }}>
            {t.clients.contact}: <Text style={{ color: '#B8BDC7' }}>{client.contact}</Text>
          </Text>
          <Text style={{ color: '#8A9099', fontSize: 12 }}>
            {t.clients.email}: <Text style={{ color: '#B8BDC7' }}>{client.email}</Text>
          </Text>
          {client.monthly_value !== undefined && client.monthly_value > 0 ? (
            <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>
              {t.clients.monthlyValue}: <Text style={{ color: '#7FA38A', fontWeight: '600' }}>{fmt(client.monthly_value)}</Text>
            </Text>
          ) : null}
        </View>

        {/* Quick actions row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => { void Linking.openURL(`mailto:${client.email}`); }} style={{ flex: 1, backgroundColor: '#111522', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>{t.clients.email}</Text>
          </TouchableOpacity>
          {showCall ? (
            <TouchableOpacity onPress={() => { void Linking.openURL(`tel:${client.contact.replace(/[^\d+]/g, '')}`); }} style={{ flex: 1, backgroundColor: '#111522', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>{t.clients.call}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Projects */}
        <Text style={{ color: '#8A9099', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>{t.clients.projects.toUpperCase()}</Text>
        {projects.length === 0 ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
            <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center' }}>{t.common.empty}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            {projects.map(project => (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push(`/(app)/projects/${project.id}`)}
                style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ color: '#F5F1E8', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={1}>{project.name}</Text>
                <StatusPill status={project.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Invoices */}
        <Text style={{ color: '#8A9099', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>{t.clients.invoices.toUpperCase()}</Text>
        {invoices.length === 0 ? (
          <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
            <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center' }}>{t.common.empty}</Text>
          </View>
        ) : (
          <View>
            {invoices.map(invoice => (
              <View key={invoice.id} style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: '#F5F1E8', fontSize: 13, fontWeight: '600' }}>{t.billing.invoiceNumber}{invoice.invoice_number}</Text>
                  <Text style={{ color: '#8A9099', fontSize: 11, marginTop: 2 }}>{t.billing.dueDate}: {fmtDate(invoice.due_date)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '700' }}>{fmt(invoice.amount)}</Text>
                  <StatusPill status={invoice.status} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
