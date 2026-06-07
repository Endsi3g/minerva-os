'use client';
import { useState } from 'react';
import { KanbanSquare, ClipboardList, CalendarRange, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTier } from '@/lib/hooks/useTier';
import Projects from './Projects';
import Tasks from './Tasks';
import ResourcePlanning from './ResourcePlanning';

type OperationsTab = 'projects' | 'tasks' | 'capacity';

export default function Operations() {
  const [activeTab, setActiveTab] = useState<OperationsTab>('projects');
  const { tier } = useTier();

  const isStarter = tier === 'starter';

  // Mocked 30/60/90 days allocation percentages
  const mockHeatmapData = [
    { name: 'Alex Developer', role: 'Full Stack', d30: 85, d60: 95, d90: 40 },
    { name: 'Jane Studio', role: 'UX Designer', d30: 110, d60: 75, d90: 60 },
    { name: 'David Architect', role: 'Solutions Eng', d30: 60, d60: 45, d90: 30 },
  ];

  const getColorClass = (value: number) => {
    if (value > 100) return 'bg-[#A86A6A]/20 text-[#A86A6A] border-[#A86A6A]/30';
    if (value >= 80) return 'bg-[#B89B6A]/20 text-[#B89B6A] border-[#B89B6A]/30';
    return 'bg-[#7FA38A]/20 text-[#7FA38A] border-[#7FA38A]/30';
  };

  const getHeatmapLabel = (value: number) => {
    if (value > 100) return `${value}% (Over)`;
    if (value >= 80) return `${value}% (Opt)`;
    return `${value}% (Under)`;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sub navigation tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {[
          { id: 'projects', label: 'Projects Kanban', icon: KanbanSquare },
          { id: 'tasks', label: 'Tasks List', icon: ClipboardList },
          { id: 'capacity', label: 'Capacity Planner', icon: CalendarRange },
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
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'capacity' && (
          <div className="space-y-8">
            <ResourcePlanning />

            {/* 30/60/90 Heatmap Capacity Dashboard */}
            <div className="border border-white/5 bg-[#111522] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-ivory">Visual Capacity Heatmap (30/60/90 Days)</h3>
                  <p className="text-xs text-fog mt-0.5">Forecasted employee utilization based on pipeline projects and active milestones.</p>
                </div>
              </div>

              {isStarter ? (
                /* Starter Tier Locked Overlay */
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-obsidian/60 border border-white/5 space-y-4">
                  <div className="h-10 w-10 rounded-full bg-[#B89B6A]/10 border border-[#B89B6A]/30 flex items-center justify-center text-[#B89B6A]">
                    <Lock size={16} />
                  </div>
                  <div className="max-w-md">
                    <p className="text-xs font-semibold text-ivory">Gated Resource Heatmap</p>
                    <p className="text-[11px] text-fog mt-1 leading-relaxed">
                      The 30/60/90 days visual workload heatmap is an advanced capacity feature. Upgrade to the **Team** or **Platform** tier to unlock advanced resource allocation analytics.
                    </p>
                  </div>
                </div>
              ) : (
                /* Premium Heatmap Grid */
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 pb-2 border-b border-white/5 text-[10px] font-semibold text-fog uppercase tracking-wider">
                    <span>Resource / Role</span>
                    <span className="text-center">Next 30 Days</span>
                    <span className="text-center">Next 60 Days</span>
                    <span className="text-center">Next 90 Days</span>
                  </div>

                  <div className="divide-y divide-white/5 space-y-3">
                    {mockHeatmapData.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-4 pt-3 items-center">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-ivory">{row.name}</span>
                          <span className="text-[10px] text-fog mt-0.5">{row.role}</span>
                        </div>
                        <div className={cn("text-xs py-2 text-center rounded-lg border font-mono font-bold", getColorClass(row.d30))}>
                          {getHeatmapLabel(row.d30)}
                        </div>
                        <div className={cn("text-xs py-2 text-center rounded-lg border font-mono font-bold", getColorClass(row.d60))}>
                          {getHeatmapLabel(row.d60)}
                        </div>
                        <div className={cn("text-xs py-2 text-center rounded-lg border font-mono font-bold", getColorClass(row.d90))}>
                          {getHeatmapLabel(row.d90)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex gap-4 pt-4 border-t border-white/5 text-[10px] text-fog">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded bg-[#7FA38A]" />
                      <span>Underloaded (&lt;80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded bg-[#B89B6A]" />
                      <span>Optimal Load (80% - 100%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded bg-[#A86A6A]" />
                      <span>Overloaded (&gt;100%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
