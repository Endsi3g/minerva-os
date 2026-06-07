'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Bot,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useTasks } from '@/lib/hooks/useSupabase';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { TextAnimate } from '@/components/ui/text-animate';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse px-4 py-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-44 w-full rounded-xl bg-white/5" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-4 w-96 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
        <Skeleton className="h-80 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?._id ?? workspaces?.[0]?.id;

  useEffect(() => {
    if (workspaces !== null && workspaces.length === 0) {
      router.replace('/onboarding/discover');
    }
  }, [workspaces, router]);

  const projects = useProjects(workspaceId);
  const invoices = useInvoices(workspaceId);
  const approvals = useApprovals(workspaceId);
  const tasks = useTasks(workspaceId);

  const isLoading = workspaces === null || projects === null || invoices === null || approvals === null || tasks === null;

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [activeAgentType, setActiveAgentType] = useState<'proposal' | 'callprep' | 'audit' | null>(null);

  // Compute stats for margin and today's action item queue
  const projectMargin = 64; // mock margin percent
  const marginTarget = 70; // target margin percent

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Compile today queue items
  const todayItems: { id: string; type: string; label: string; badge: string; color: string; route: string }[] = [
    {
      id: 'inv-risk-1',
      type: 'invoice',
      label: 'Invoice INV-2026-004 is overdue by 5 days (Client Acme Corp · $4,500)',
      badge: 'Overdue Invoice',
      color: 'text-[#A86A6A] bg-[#A86A6A]/10 border-[#A86A6A]/20',
      route: '/app/finance'
    },
    {
      id: 'appr-req-1',
      type: 'approval',
      label: 'Bolt Tech requires wireframe guidelines v2 approval sign-off',
      badge: 'Pending Approval',
      color: 'text-[#7FA38A] bg-[#7FA38A]/10 border-[#7FA38A]/20',
      route: '/app/client-space'
    },
    {
      id: 'task-urg-1',
      type: 'task',
      label: 'Database performance schema migration is blocked by staging setup delay',
      badge: 'Blocked Work',
      color: 'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20',
      route: '/app/operations'
    }
  ];

  return (
    <div className="space-y-8 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">
      
      {/* Greetings Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-2xl font-serif text-ivory tracking-tight" />
          <p className="text-xs text-fog max-w-2xl leading-relaxed">
            Welcome to the Minerva Operating Center. Your command desk for today, June 7, 2026.
          </p>
        </div>

        {/* AI Action Quick Trigger */}
        <Button 
          onClick={() => { setActiveAgentType('proposal'); setAiSheetOpen(true); }}
          className="rounded-full bg-ivory text-obsidian hover:bg-ivory/90 text-xs font-semibold px-4 h-9 flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles size={13} className="text-[#7FA38A] animate-pulse" />
          Ask Minerva AI Agent
        </Button>
      </div>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Today Action Queue Checklist (Left & Center) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="bg-midnight border-white/5 shadow-card overflow-hidden relative">
            <TextureOverlay texture="dots" opacity={0.03} />
            <CardHeader className="pb-4 border-b border-white/5 relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#B89B6A] animate-pulse" />
                <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">
                  Today · Priority Operating Queue
                </CardTitle>
              </div>
              <span className="text-[10px] text-fog font-semibold px-2 py-0.5 rounded-full bg-dusk">
                {todayItems.length} issues require focus
              </span>
            </CardHeader>
            <CardContent className="pt-6 relative z-10 space-y-3">
              {todayItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => router.push(item.route)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/2 hover:bg-white/4 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase shrink-0 font-sans", item.color)}>
                      {item.badge}
                    </span>
                    <p className="text-xs text-silver group-hover:text-ivory transition-colors leading-relaxed">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-fog group-hover:text-silver transition-colors self-end sm:self-auto shrink-0 font-semibold">
                    <span>Resolve</span>
                    <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick AI Agent Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { type: 'proposal' as const, label: 'Proposal Copilot', desc: 'Create scopes & pricing', color: 'spotlight-amber' },
              { type: 'callprep' as const, label: 'Call Prepper', desc: 'Draft briefs for clients', color: 'spotlight-sage' },
              { type: 'audit' as const, label: 'SLA Risk Audit', desc: 'Verify contract health', color: 'spotlight-rose' },
            ].map(agent => (
              <button
                key={agent.type}
                onClick={() => { setActiveAgentType(agent.type); setAiSheetOpen(true); }}
                className={cn(
                  "bg-midnight border border-white/5 hover:border-white/12 rounded-xl p-4.5 text-left transition-all hover:scale-[1.01] flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden group shadow-sm",
                  agent.color
                )}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="p-1.5 rounded-lg bg-white/5 text-silver group-hover:text-ivory transition-colors">
                    <Bot size={14} />
                  </div>
                  <Zap size={10} className="text-fog group-hover:text-silver opacity-60 transition-opacity" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-ivory leading-tight mt-2">{agent.label}</h4>
                  <p className="text-[10px] text-fog mt-0.5">{agent.desc}</p>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Right Sidebar: Margin Gauge, Health Ring & AI Assist */}
        <div className="space-y-6">
          
          {/* Margin Gauge Thermometer */}
          <Card className="bg-midnight border-white/5 shadow-card spotlight-sage">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-fog">
                Agency Margin Thermometer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-fog">Current Avg Margin</span>
                  <p className="text-3xl font-bold font-mono text-[#7FA38A] leading-none mt-1">
                    {projectMargin}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-fog">Target Marge</p>
                  <p className="text-xs font-semibold text-silver">{marginTarget}% Target</p>
                </div>
              </div>

              {/* Visual Horizontal Thermometer Bar */}
              <div className="space-y-2">
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
                  {(() => {
                    const thermometerStyle = { width: `${projectMargin}%` };
                    return (
                      <div
                        className="h-full rounded-full transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-[#7FA38A]"
                        style={thermometerStyle}
                      />
                    );
                  })()}
                </div>
                <div className="flex justify-between text-[8px] text-fog font-semibold">
                  <span>0%</span>
                  <span>50%</span>
                  <span>{marginTarget}% (Min Target)</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/2 border border-white/5 p-3 flex gap-2 items-start">
                <AlertTriangle size={13} className="text-[#B89B6A] shrink-0 mt-0.5" />
                <p className="text-[10px] text-silver leading-relaxed">
                  Bolt Tech project budget burn is approaching threshold limits. Adjust freelance needs to protect profitability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Client Sentiment Tracker */}
          <Card className="bg-midnight border-white/5 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-fog">
                Portfolio Status
              </CardTitle>
              <button 
                onClick={() => router.push('/app/client-space')}
                className="text-[9px] text-[#7FA38A] hover:underline transition-all cursor-pointer font-semibold"
              >
                Open Hub
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { client: 'Acme Corp', health: 92, status: 'Active Retainer' },
                { client: 'Bolt Tech', health: 58, status: 'Milestone Delayed' },
              ].map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white/2 border border-white/5 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold text-ivory block">{c.client}</span>
                    <span className="text-[10px] text-fog">{c.status}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                    c.health >= 80 ? "text-[#7FA38A] bg-[#7FA38A]/10 border-[#7FA38A]/20" : "text-[#A86A6A] bg-[#A86A6A]/10 border-[#A86A6A]/20"
                  )}>
                    {c.health}% Score
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Onboarding getting started checklist */}
          <GettingStartedChecklist />

        </div>

      </div>

      {/* AI Agents Interactive Sheet */}
      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-midnight border-white/5 p-6 flex flex-col h-full gap-6">
          <SheetHeader className="border-b border-white/5 pb-4">
            <SheetTitle className="text-lg font-serif text-ivory flex items-center gap-2">
              <Sparkles size={16} className="text-[#7FA38A] animate-pulse" />
              <span>Minerva Operating Agent</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            
            {activeAgentType === 'proposal' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#B89B6A]/20 bg-[#B89B6A]/5">
                  <h4 className="text-xs font-semibold text-ivory">AI Proposal Agent</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">
                    Provide raw details for an agency proposal, and Minerva will compile services, estimated phases, timeline scopes, and payment terms in seconds.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-fog">Client Brand</label>
                    <input type="text" placeholder="e.g. Acme Corp" className="w-full text-xs bg-obsidian border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none mt-1 focus:border-[#7FA38A]" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-fog">Project Scope Brief</label>
                    <textarea rows={3} placeholder="Describe deliverables, phases, and key outcomes..." className="w-full text-xs bg-obsidian border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none mt-1 resize-none focus:border-[#7FA38A]" />
                  </div>
                  <Button onClick={() => { setAiSheetOpen(false); router.push('/app/growth?tab=proposals'); }} className="w-full bg-[#7FA38A] text-obsidian hover:bg-[#7FA38A]/90 mt-2 font-semibold">
                    Launch Proposal Generator
                  </Button>
                </div>
              </div>
            )}

            {activeAgentType === 'callprep' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#7FA38A]/20 bg-[#7FA38A]/5">
                  <h4 className="text-xs font-semibold text-ivory">AI Call Prepper</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">
                    Prepares a comprehensive briefing summary containing deliverables, last emails, pending approvals, and active risk alerts before a sync session.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-fog">Select Meeting Client</label>
                    <select title="Select Meeting Client" className="w-full text-xs bg-obsidian border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none mt-1 focus:border-[#7FA38A]">
                      <option>Acme Corp</option>
                      <option>Bolt Tech</option>
                      <option>Zenith Lab</option>
                    </select>
                  </div>
                  <Button onClick={() => { setAiSheetOpen(false); toast.success("AI briefing brief generated."); }} className="w-full bg-ivory text-obsidian hover:bg-ivory/90 mt-2 font-semibold">
                    Generate Briefing Digest
                  </Button>
                </div>
              </div>
            )}

            {activeAgentType === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#A86A6A]/20 bg-[#A86A6A]/5">
                  <h4 className="text-xs font-semibold text-ivory">SLA Risk Audit</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">
                    Audits active project progress speeds, average client approval response, and overdue billing invoices to flag operations bottlenecks.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/5 p-3.5 bg-obsidian space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-silver">Average SLA speed</span>
                      <span className="text-sage font-bold font-mono">1.8d (Healthy)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-silver">Payment Collections health</span>
                      <span className="text-amber font-bold font-mono">74% (Action needed)</span>
                    </div>
                  </div>
                  <Button onClick={() => { setAiSheetOpen(false); router.push('/app/client-space'); }} className="w-full bg-[#7FA38A] text-obsidian hover:bg-[#7FA38A]/90 font-semibold">
                    View Health Cockpit
                  </Button>
                </div>
              </div>
            )}

          </div>

          <div className="border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setAiSheetOpen(false)} className="w-full text-fog hover:text-silver">
              Close Panel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
