'use client';
import { useState } from 'react';
import { TrendingUp, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pipeline from './Pipeline';
import Clients from './Clients';
import Proposals from './Proposals';

export default function Growth() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'clients' | 'proposals'>('pipeline');

  return (
    <div className="space-y-6 w-full">
      {/* Sub navigation tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {[
          { id: 'pipeline', label: 'Sales Pipeline', icon: TrendingUp },
          { id: 'clients', label: 'Clients & Leads', icon: Users },
          { id: 'proposals', label: 'Proposals & Templates', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer',
                isActive ? 'border-[#7FA38A] text-ivory' : 'border-transparent text-fog hover:text-silver'
              )}
            >
              <Icon size={14} className={isActive ? 'text-[#7FA38A]' : 'text-fog'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'pipeline' && <Pipeline />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'proposals' && <Proposals />}
      </div>
    </div>
  );
}
