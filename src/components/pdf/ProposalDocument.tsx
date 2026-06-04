import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 64,
    paddingRight: 64,
    color: '#111111',
  },
  header: {
    marginBottom: 36,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 20,
  },
  studioLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#888888',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#111111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#888888',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 4,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.75,
    color: '#333333',
  },
  totalRow: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#111111',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111111',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 64,
    right: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#AAAAAA',
  },
});

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const SECTION_LABELS: Record<string, string> = {
  intro: 'Overview',
  scope: 'Scope of Work',
  timeline: 'Timeline',
  pricing: 'Investment',
  terms: 'Terms',
};

interface ProposalDocProps {
  title: string;
  clientName: string;
  studioName: string;
  totalAmount: number;
  sections: Array<{ type: string; content: string }>;
  date: string;
}

export function ProposalDocument({ title, clientName, studioName, totalAmount, sections, date }: ProposalDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.studioLabel}>{studioName}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Prepared for {clientName} · {date}</Text>
        </View>

        {sections.map(s => (
          <View key={s.type} style={styles.section}>
            <Text style={styles.sectionLabel}>{SECTION_LABELS[s.type] ?? s.type}</Text>
            <Text style={styles.sectionContent}>{s.content}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Investment</Text>
          <Text style={styles.totalAmount}>{fmtCurrency(totalAmount)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{studioName} · Confidential</Text>
          <Text style={styles.footerText}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
