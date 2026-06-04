'use client';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import Billing from './Billing';
import Expenses from './Expenses';
import Profitability from './Profitability';
import Finance from './Finance';

export default function FinanceHub() {
  const { t } = useLang();
  const h = t.app.financeHub;

  const tabs = [
    { id: 0, label: h.tabs.billing,       content: <Billing /> },
    { id: 1, label: h.tabs.expenses,      content: <Expenses /> },
    { id: 2, label: h.tabs.profitability, content: <Profitability /> },
    { id: 3, label: h.tabs.ledger,        content: <Finance /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold text-ivory"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {h.title}
        </h1>
        <p className="text-sm text-fog mt-1">{h.subtitle}</p>
      </div>
      <DirectionAwareTabs tabs={tabs} className="w-full" />
    </div>
  );
}
