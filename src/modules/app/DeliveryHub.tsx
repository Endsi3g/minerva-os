'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { TextAnimate } from '@/components/ui/text-animate';
import { useLang } from '@/i18n';
import Projects from './Projects';
import Tasks from './Tasks';
import Approvals from './Approvals';
import Files from './Files';

const TAB_KEYS = ['projects', 'tasks', 'approvals', 'files'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function tabIndexFromParam(param: string | null): number {
  const idx = TAB_KEYS.indexOf((param ?? '') as TabKey);
  return idx >= 0 ? idx : 0;
}

export default function DeliveryHub() {
  const { t } = useLang();
  const s = t.app.sidebar;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(() =>
    tabIndexFromParam(searchParams?.get('tab'))
  );

  useEffect(() => {
    setActiveTab(tabIndexFromParam(searchParams?.get('tab')));
  }, [searchParams]);

  function handleTabChange(id: number) {
    setActiveTab(id);
    router.replace(`/app/delivery?tab=${TAB_KEYS[id]}`, { scroll: false });
  }

  const tabs = [
    { id: 0, label: s.projects ?? 'Projects',   content: <Projects /> },
    { id: 1, label: s.tasks ?? 'Tasks',         content: <Tasks /> },
    { id: 2, label: s.approvals ?? 'Approvals', content: <Approvals /> },
    { id: 3, label: s.files ?? 'Files',         content: <Files /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <TextAnimate
          text={s.delivery ?? 'Delivery'}
          type="calmInUp"
          className="text-2xl font-semibold text-ivory"
        />
        <p className="text-sm mt-0.5" style={{ color: '#8A9099' }}>
          {activeTab === 0 && 'Projects, milestones and timelines'}
          {activeTab === 1 && 'Tasks, kanban and assignments'}
          {activeTab === 2 && 'Approvals and client sign-offs'}
          {activeTab === 3 && 'Files, assets and shared documents'}
        </p>
      </div>
      <DirectionAwareTabs
        tabs={tabs}
        className="w-full"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
