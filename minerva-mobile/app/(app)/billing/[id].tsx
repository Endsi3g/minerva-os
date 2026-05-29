import { ScrollView, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { captureException } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type LineItem = { description: string; quantity: number; price: number };

type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date?: string;
  items?: LineItem[];
  date?: string;
  payment_link?: string;
};

type Client = { id: string; company: string };

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 }}>
      {label}
    </Text>
  );
}

export default function InvoiceDetail() {
  const { t } = useMobileLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { trackScreen('InvoiceDetail'); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
        setInvoice(inv ?? null);
        if (inv?.client_id) {
          const { data: cl } = await supabase.from('clients').select('id,company').eq('id', inv.client_id).maybeSingle();
          setClient(cl ?? null);
        }
      } catch (err) {
        captureException(err, { screen: 'InvoiceDetail' });
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
        <Header title={t.billing.title} showBack />
        <LoadingSpinner />
      </View>
    );
  }

  const items: LineItem[] = invoice.items ?? [];
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const tps = subtotal * TPS_RATE;
  const tvq = subtotal * TVQ_RATE;
  const total = subtotal + tps + tvq;

  async function handleOpenPaymentLink() {
    if (!invoice?.payment_link) {
      Alert.alert(t.billing.openPaymentLink, t.billing.noPaymentLink ?? 'No payment link configured.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(invoice.payment_link);
    } catch (err) {
      captureException(err, { screen: 'InvoiceDetail', action: 'openPaymentLink' });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={`${t.billing.invoiceNumber}${invoice.invoice_number}`} showBack />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}>
        {/* Invoice header */}
        <SectionLabel label={t.billing.invoices} />
        <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#F5F1E8', fontSize: 18, fontWeight: '700' }}>{t.billing.invoiceNumber}{invoice.invoice_number}</Text>
            <StatusPill status={invoice.status} size="md" />
          </View>
          {invoice.date && <Text style={{ color: '#8A9099', fontSize: 13, marginBottom: 4 }}>{fmtDate(invoice.date)}</Text>}
          <Text style={{ color: '#8A9099', fontSize: 13 }}>{t.billing.dueDate}: {fmtDate(invoice.due_date)}</Text>
        </View>

        {/* Client info */}
        {client && (
          <>
            <SectionLabel label={t.clients.title} />
            <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600' }}>{client.company}</Text>
            </View>
          </>
        )}

        {/* Line items */}
        <SectionLabel label={t.billing.lineItems} />
        {items.length === 0 ? (
          <Text style={{ color: '#8A9099', fontSize: 13 }}>—</Text>
        ) : (
          <View style={{ backgroundColor: '#111522', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <FlatList
              data={items}
              keyExtractor={(_, idx) => String(idx)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: '#F5F1E8', fontSize: 13 }}>{item.description}</Text>
                    <Text style={{ color: '#8A9099', fontSize: 11, marginTop: 2 }}>{item.quantity} x {fmt(item.price)}</Text>
                  </View>
                  <Text style={{ color: '#F5F1E8', fontSize: 13, fontWeight: '600' }}>{fmt(item.quantity * item.price)}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Totals */}
        <SectionLabel label={t.billing.total} />
        <View style={{ backgroundColor: '#111522', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 }}>
          {[
            { label: t.billing.subtotal, value: fmt(subtotal) },
            { label: 'TPS (5%)', value: fmt(tps) },
            { label: 'TVQ (9.975%)', value: fmt(tvq) },
          ].map(row => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#8A9099', fontSize: 13 }}>{row.label}</Text>
              <Text style={{ color: '#B8BDC7', fontSize: 13 }}>{row.value}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '700' }}>{t.billing.total}</Text>
            <Text style={{ color: '#F5F1E8', fontSize: 15, fontWeight: '700' }}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Actions */}
        {invoice.status !== 'paid' && (
          <TouchableOpacity
            onPress={handleOpenPaymentLink}
            style={{ backgroundColor: '#F5F1E8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ color: '#0A0D14', fontSize: 15, fontWeight: '700' }}>{t.billing.openPaymentLink}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
