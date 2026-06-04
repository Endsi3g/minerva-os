'use client';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import Reports from './Reports';
import Cockpit from './Cockpit';
import NPS from './NPS';
import AgentOps from './AgentOps';

export default function IntelligenceHub() {
  const { t } = useLang();
  const h = t.app.intelligence;

  const tabs = [
    { id: 0, label: h.tabs.reports,   content: <Reports /> },
    { id: 1, label: h.tabs.health,    content: <Cockpit /> },
    { id: 2, label: h.tabs.nps,       content: <NPS /> },
    { id: 3, label: h.tabs.agentOps,  content: <AgentOps /> },
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
