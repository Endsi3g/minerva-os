'use client';
import { useState } from 'react';
import { CheckSquare, FolderOpen, Heart, Activity, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Approvals from './Approvals';
import Files from './Files';

type ClientSpaceTab = 'approvals' | 'files' | 'health';

export default function ClientSpace() {
  const [activeTab, setActiveTab] = useState<ClientSpaceTab>('approvals');

  const healthStats = {
    avgApprovalDays: 1.8,
    silenceIndex: 4, // days since last activity
    npsScore: 8.6,
    openTickets: 1,
    clientSentiment: 'Positive',
  };

  // Health metric cards
  const metrics = [
    { label: 'Avg Approval Speed', value: `${healthStats.avgApprovalDays} Days`, desc: 'Target: < 2 days', status: 'optimal', color: 'text-[#7FA38A]' },
    { label: 'Silence Index', value: `${healthStats.silenceIndex} Days`, desc: 'Last portal access', status: 'good', color: 'text-[#B89B6A]' },
    { label: 'NPS Satisfaction', value: `${healthStats.npsScore} / 10`, desc: '14 client responses', status: 'excellent', color: 'text-[#7FA38A]' },
    { label: 'Active Issues', value: String(healthStats.openTickets), desc: 'Pending resolution', status: 'warning', color: 'text-[#A86A6A]' },
  ];

  const getStatusBg = (status: string) => {
    if (status === 'warning') return 'border-[#A86A6A]/20 bg-[#A86A6A]/5';
    if (status === 'good') return 'border-[#B89B6A]/20 bg-[#B89B6A]/5';
    return 'border-[#7FA38A]/20 bg-[#7FA38A]/5';
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sub navigation tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {[
          { id: 'approvals', label: 'Client Approvals', icon: CheckSquare },
          { id: 'files', label: 'Documents Vault', icon: FolderOpen },
          { id: 'health', label: 'Client Health & SLA', icon: Heart },
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
        {activeTab === 'approvals' && <Approvals />}
        {activeTab === 'files' && <Files />}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-ivory">Internal Client Health SLA Tracker</h3>
              <p className="text-xs text-fog mt-0.5">Real-time indicators of client collaboration, responsive times, and retention risk.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((m, idx) => (
                <div key={idx} className={cn("rounded-xl border p-4.5 flex flex-col gap-1", getStatusBg(m.status))}>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-fog">{m.label}</span>
                  <span className={cn("text-xl font-bold tracking-tight", m.color)}>{m.value}</span>
                  <span className="text-[9px] text-fog/60">{m.desc}</span>
                </div>
              ))}
            </div>

            {/* Detailed Health Ledger */}
            <div className="border border-white/5 bg-[#111522] rounded-2xl p-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ivory mb-4 flex items-center gap-2">
                <Activity size={13} className="text-[#7FA38A]" />
                Client Engagement Sentiment & SLA Analysis
              </h4>

              <div className="space-y-3">
                {[
                  { client: 'Acme Corp', silence: '2d ago', approvals: '1.2d avg', sentiment: 'Positive', nps: '9.2', status: 'healthy', color: 'text-[#7FA38A]' },
                  { client: 'Bolt Tech', silence: '8d ago', approvals: '3.4d avg', sentiment: 'At Risk', nps: '5.8', status: 'at-risk', color: 'text-[#A86A6A]' },
                  { client: 'Zenith Lab', silence: '1d ago', approvals: '0.9d avg', sentiment: 'Highly Satisfied', nps: '10.0', status: 'healthy', color: 'text-[#7FA38A]' }
                ].map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/2 hover:bg-white/4 border border-white/5 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-dusk border border-white/10 flex items-center justify-center text-xs font-bold text-silver">
                        {row.client.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ivory">{row.client}</p>
                        <p className="text-[10px] text-fog mt-0.5">SLA Speed: {row.approvals} · Last Access: {row.silence}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-fog">Sentiment</p>
                        <p className={cn("text-xs font-semibold", row.color)}>{row.sentiment}</p>
                      </div>
                      <div className="bg-[#171C2A] border border-white/5 rounded-lg px-2.5 py-1 text-center shrink-0">
                        <p className="text-[9px] text-fog">NPS Score</p>
                        <p className={cn("text-xs font-mono font-bold", row.color)}>{row.nps}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Policy Warning */}
            <div className="p-4 rounded-xl border border-[#B89B6A]/20 bg-[#B89B6A]/5 flex items-start gap-3">
              <AlertCircle size={15} className="text-[#B89B6A] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-ivory">SLA Threshold Alert</p>
                <p className="text-[11px] text-silver mt-0.5 leading-relaxed">
                  Bolt Tech has exceeded the 48-hour response milestone target for Bolt Tech Brand Guidelines v2 approval. An automated reminders alert has been sent to their primary contact.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
