'use client';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import Tickets from './Tickets';
import KnowledgeBase from './KnowledgeBase';
import Support from './Support';

export default function SupportHub() {
  const { t } = useLang();
  const h = t.app.supportHub;

  const tabs = [
    { id: 0, label: h.tabs.tickets,   content: <Tickets /> },
    { id: 1, label: h.tabs.knowledge, content: <KnowledgeBase /> },
    { id: 2, label: h.tabs.help,      content: <Support /> },
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
