'use client';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#141413',
  },
  header: {
    marginBottom: 32,
    borderBottom: '1px solid #e8e6da',
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#141413',
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#141413',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '0.5px solid #e8e6da',
  },
  cell: {
    fontSize: 10,
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#c96442',
  },
  badge: {
    fontSize: 9,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: '#9ca3af',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 10,
    color: '#141413',
    fontFamily: 'Helvetica-Bold',
  },
});

type InvoiceItem = { description: string; quantity: number; price: number };
type Invoice = {
  invoiceNumber: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
  tps: number;
  tvq: number;
  items: InvoiceItem[];
};

export function InvoicePdf({ invoice, workspaceName, clientName }: {
  invoice: Invoice;
  workspaceName: string;
  clientName: string;
}) {
  const subtotal = invoice.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{workspaceName}</Text>
          <Text style={styles.subtitle}>Invoice {invoice.invoiceNumber}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Client</Text>
            <Text style={styles.metaValue}>{clientName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue date</Text>
            <Text style={styles.metaValue}>{invoice.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due date</Text>
            <Text style={styles.metaValue}>{invoice.dueDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={{ ...styles.metaValue, textTransform: 'capitalize' }}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={[styles.row, { borderBottom: '1px solid #e8e6da' }]}>
            <Text style={[styles.cell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>Description</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Qty</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Unit</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, { flex: 3 }]}>{item.description}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{item.quantity}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{fmt(item.price)}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{fmt(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ width: 200 }}>
            <View style={styles.row}>
              <Text style={styles.cell}>Subtotal</Text>
              <Text style={styles.cell}>{fmt(subtotal)}</Text>
            </View>
            {invoice.tps > 0 && (
              <View style={styles.row}>
                <Text style={styles.cell}>TPS ({invoice.tps}%)</Text>
                <Text style={styles.cell}>{fmt(subtotal * invoice.tps / 100)}</Text>
              </View>
            )}
            {invoice.tvq > 0 && (
              <View style={styles.row}>
                <Text style={styles.cell}>TVQ ({invoice.tvq}%)</Text>
                <Text style={styles.cell}>{fmt(subtotal * invoice.tvq / 100)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmt(invoice.amount)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

type ProposalSection = { type: string; content: string };
type Proposal = {
  title: string;
  totalAmount: number;
  status: string;
  sections: ProposalSection[];
  validUntil?: number;
};

export function ProposalPdf({ proposal, workspaceName, clientName }: {
  proposal: Proposal;
  workspaceName: string;
  clientName: string;
}) {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{proposal.title}</Text>
          <Text style={styles.subtitle}>Prepared by {workspaceName} for {clientName}</Text>
          {proposal.validUntil && (
            <Text style={[styles.subtitle, { marginTop: 4 }]}>
              Valid until {new Date(proposal.validUntil).toLocaleDateString()}
            </Text>
          )}
        </View>

        {proposal.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.type}</Text>
            <Text style={styles.cell}>{section.content}</Text>
          </View>
        ))}

        <View style={[styles.section, { borderTop: '1px solid #e8e6da', paddingTop: 16 }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Investment</Text>
            <Text style={styles.totalValue}>{fmt(proposal.totalAmount)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadPdf(doc: React.ReactElement, filename: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
