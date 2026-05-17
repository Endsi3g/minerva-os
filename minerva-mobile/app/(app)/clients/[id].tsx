import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusPill } from '@/components/StatusPill';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../../../convex/_generated/api';

type Client = {
  _id: string;
  company: string;
  contact: string;
  email: string;
  status: string;
  monthlyValue?: number;
};

type Project = {
  _id: string;
  name: string;
  clientName: string;
  status: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: string;
  dueDate: string;
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

  useEffect(() => { trackScreen('ClientDetail'); }, []);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const allClients = (useQuery(api.clients.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Client[];
  const allProjects = (useQuery(api.projects.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Project[];
  const allInvoices = (useQuery(api.invoices.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Invoice[];

  const isLoading = workspaceId !== undefined && (allClients === undefined || allProjects === undefined || allInvoices === undefined);

  if (isLoading) {
    return <LoadingSpinner message={t.common.loading} />;
  }

  const client = allClients.find(c => c._id === id);

  // Filter projects by clientName match (no clientId on projects schema)
  const clientProjects = client
    ? allProjects.filter(p => p.clientName === client.company)
    : [];

  // Filter invoices by clientId
  const clientInvoices = allInvoices.filter(inv => inv.clientId === id);

  const showCall = client ? hasPhone(client.contact) : false;

  if (!client) {
    return (
      <View className="flex-1 bg-obsidian">
        <Header title="" showBack />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={client.company} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Header area: company name, StatusPill, contact info */}
        <View
          style={{
            backgroundColor: '#111522',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
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
          {client.monthlyValue !== undefined && client.monthlyValue > 0 ? (
            <Text style={{ color: '#8A9099', fontSize: 12, marginTop: 2 }}>
              {t.clients.monthlyValue}: <Text style={{ color: '#7FA38A', fontWeight: '600' }}>{fmt(client.monthlyValue)}</Text>
            </Text>
          ) : null}
        </View>

        {/* Quick actions row: Email + Call (if phone detected) */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => { void Linking.openURL(`mailto:${client.email}`); }}
            style={{
              flex: 1,
              backgroundColor: '#111522',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>{t.clients.email}</Text>
          </TouchableOpacity>
          {showCall ? (
            <TouchableOpacity
              onPress={() => { void Linking.openURL(`tel:${client.contact.replace(/[^\d+]/g, '')}`); }}
              style={{
                flex: 1,
                backgroundColor: '#111522',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>{t.clients.call}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Projects section */}
        <Text style={{ color: '#8A9099', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>
          {t.clients.projects.toUpperCase()}
        </Text>
        {clientProjects.length === 0 ? (
          <View
            style={{
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center' }}>{t.common.empty}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            {clientProjects.map(project => (
              <View
                key={project._id}
                style={{
                  backgroundColor: '#111522',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#F5F1E8', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={1}>
                  {project.name}
                </Text>
                <StatusPill status={project.status} />
              </View>
            ))}
          </View>
        )}

        {/* Recent invoices section */}
        <Text style={{ color: '#8A9099', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>
          {t.clients.invoices.toUpperCase()}
        </Text>
        {clientInvoices.length === 0 ? (
          <View
            style={{
              backgroundColor: '#111522',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center' }}>{t.common.empty}</Text>
          </View>
        ) : (
          <View>
            {clientInvoices.map(invoice => (
              <View
                key={invoice._id}
                style={{
                  backgroundColor: '#111522',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: '#F5F1E8', fontSize: 13, fontWeight: '600' }}>
                    {t.billing.invoiceNumber}{invoice.invoiceNumber}
                  </Text>
                  <Text style={{ color: '#8A9099', fontSize: 11, marginTop: 2 }}>
                    {t.billing.dueDate}: {fmtDate(invoice.dueDate)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '700' }}>
                    {fmt(invoice.amount)}
                  </Text>
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
