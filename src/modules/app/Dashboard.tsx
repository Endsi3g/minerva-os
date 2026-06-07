'use client';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ExternalLink,
  Bot,
  ArrowRight,
  ChevronDown,
  Crown,
  ClipboardList,
  Coins,
  User,
  Palette,
  Code,
  AlertTriangle,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useTasks } from '@/lib/hooks/useSupabase';
import { motion, AnimatePresence } from 'motion/react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { TextAnimate } from '@/components/ui/text-animate';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';






/* ── Skeletons ────────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse px-4 py-6 max-w-[1400px] mx-auto">
      {/* Banner */}
      <Skeleton className="h-44 w-full rounded-xl bg-white/5" />
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-4 w-96 bg-white/5" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
        ))}
      </div>
      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-60 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
        <Skeleton className="h-full min-h-[500px] rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

/* ── Dashboard Restructure ────────────────────────────────────────────────── */
export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?._id;

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

  /* ── State for local tasks completion ── */
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks.filter((tsk: any) => tsk.status !== 'done'));
    }
  }, [tasks]);

  const handleToggleTask = async (taskId: string, title: string) => {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId && t._id !== taskId));
    toast.success(`Task "${title}" completed!`);
    try {
      await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const [selectedRole, setSelectedRole] = useState<string>('owner');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">
      
      {/* Role Switcher and Greeting Flex Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-2xl font-semibold text-ivory tracking-tight" />
          <p className="text-xs text-fog max-w-2xl leading-relaxed">
            Welcome to Minerva OS. Here is your personalized focus dashboard for today.
          </p>
        </div>
        
        {/* Sleek dropdown role switcher */}
        <div className="relative z-50">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-[#111522] hover:bg-[#171C2A] text-xs font-semibold text-silver hover:text-ivory cursor-pointer transition-all shadow-sm"
          >
            {(() => {
              const activeRoleObj = ROLES.find(r => r.id === selectedRole) || ROLES[0];
              const Icon = activeRoleObj.icon;
              return (
                <>
                  <Icon size={14} className="text-[#7FA38A]" />
                  <span>Role: {activeRoleObj.label}</span>
                </>
              );
            })()}
            <ChevronDown size={12} className="text-fog" />
          </button>

          {dropdownOpen && (
            <>
              {/* Global Click Shield */}
              <div className="fixed inset-0 z-45 bg-transparent" onClick={() => setDropdownOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#111522] p-1.5 shadow-xl z-50"
              >
                <div className="px-2 py-1.5 text-[9px] font-bold text-fog uppercase tracking-wider">
                  Select Active Workspace Role
                </div>
                <div className="h-px bg-white/5 my-1" />
                {ROLES.map(roleItem => {
                  const Icon = roleItem.icon;
                  const isSelected = selectedRole === roleItem.id;
                  return (
                    <button
                      key={roleItem.id}
                      onClick={() => {
                        setSelectedRole(roleItem.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer group",
                        isSelected ? "bg-white/5 text-[#7FA38A]" : "text-silver hover:text-ivory hover:bg-white/2"
                      )}
                    >
                      <Icon size={14} className={cn("mt-0.5", isSelected ? "text-[#7FA38A]" : "text-fog group-hover:text-silver")} />
                      <div>
                        <p className="text-xs font-semibold">{roleItem.label}</p>
                        <p className="text-[9px] text-fog mt-0.5 leading-tight">{roleItem.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Unified Today Action Queue */}
      <TodayActionQueue approvals={approvals} invoices={invoices} tasks={localTasks} router={router} />

      {/* Role-Specific View Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {selectedRole === 'owner' && <OwnerDashboardView invoices={invoices} projects={projects} formatCurrency={formatCurrency} router={router} />}
          {selectedRole === 'pm' && <PMDashboardView projects={projects} tasks={tasks} router={router} />}
          {selectedRole === 'finance' && <FinanceDashboardView invoices={invoices} formatCurrency={formatCurrency} router={router} />}
          {selectedRole === 'client' && <ClientDashboardView approvals={approvals} router={router} />}
          {selectedRole === 'designer' && <DesignerDeveloperDashboardView tasks={localTasks} handleToggleTask={handleToggleTask} role="designer" router={router} />}
          {selectedRole === 'developer' && <DesignerDeveloperDashboardView tasks={localTasks} handleToggleTask={handleToggleTask} role="developer" router={router} />}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

/* ── Role Layout definitions ── */
const ROLES = [
  { id: 'owner', label: 'Owner', icon: Crown, desc: 'MRR, Forecasts & Client Risk' },
  { id: 'pm', label: 'Project Manager', icon: ClipboardList, desc: 'Project Health & Workload' },
  { id: 'finance', label: 'Finance Manager', icon: Coins, desc: 'Outstanding Invoices & Burn Rate' },
  { id: 'client', label: 'Client Portal', icon: User, desc: 'Deliverables Reviews & Support' },
  { id: 'designer', label: 'Designer Workspace', icon: Palette, desc: 'Active Tasks & Figma Files' },
  { id: 'developer', label: 'Developer Workspace', icon: Code, desc: 'Priority Tasks & PR Status' },
];

function TodayActionQueue({ approvals, invoices, tasks, router }: { approvals: any[] | null, invoices: any[] | null, tasks: any[] | null, router: any }) {
  const { lang } = useLang();
  const items: { id: string; type: string; label: string; badgeText: string; color: string; route: string }[] = [];

  items.push(
    {
      id: 'mock-blockage-1',
      type: 'blockage',
      label: 'E-Commerce Database Schema is BLOCKED by Stripe API response delay',
      badgeText: 'Blocked',
      color: 'text-ember bg-[#A86A6A]/10 border-[#A86A6A]/20',
      route: '/app/projects'
    },
    {
      id: 'mock-approval-1',
      type: 'approval',
      label: 'Review and sign-off on Bolt Tech Brand Guidelines v2',
      badgeText: 'Pending Approval',
      color: 'text-sage bg-[#7FA38A]/10 border-[#7FA38A]/20',
      route: '/app/approvals'
    }
  );

  if (approvals) {
    approvals.filter(a => a.status === 'pending').forEach(a => {
      items.push({
        id: `real-app-${a.id || a._id}`,
        type: 'approval',
        label: `Client review requested: ${a.title || 'Deliverable approval'}`,
        badgeText: 'Approval Request',
        color: 'text-sage bg-[#7FA38A]/10 border-[#7FA38A]/20',
        route: '/app/approvals'
      });
    });
  }

  if (invoices) {
    invoices.filter(i => i.status === 'overdue').forEach(i => {
      items.push({
        id: `real-inv-${i.id || i._id}`,
        type: 'invoice',
        label: `Invoice ${i.invoiceNumber} to ${i.clientName || 'Client'} is OVERDUE · $${i.amount}`,
        badgeText: 'Overdue Invoice',
        color: 'text-ember bg-[#A86A6A]/10 border-[#A86A6A]/20',
        route: '/app/billing'
      });
    });
  }

  if (tasks) {
    tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').forEach(t => {
      items.push({
        id: `real-task-${t.id || t._id}`,
        type: 'task',
        label: `Urgent Task: ${t.title} (${t.project || 'Project'})`,
        badgeText: 'Urgent Task',
        color: 'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20',
        route: '/app/tasks'
      });
    });
  }

  return (
    <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none overflow-hidden relative">
      <TextureOverlay texture="dots" opacity={0.05} />
      <CardHeader className="pb-3 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#B89B6A] animate-pulse" />
          <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">
            {lang === 'fr' ? 'Aujourd\'hui · File d\'actions prioritaires' : 'Today · Unified Priority Action Queue'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 relative z-10">
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => router.push(item.route)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/2 hover:bg-white/4 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase font-sans shrink-0", item.color)}>
                  {item.badgeText}
                </span>
                <p className="text-xs text-silver group-hover:text-ivory transition-colors leading-relaxed">
                  {item.label}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-fog group-hover:text-silver transition-colors self-end sm:self-auto">
                <span>{lang === 'fr' ? 'Agir' : 'Take Action'}</span>
                <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OwnerDashboardView({ invoices, formatCurrency, router }: { invoices: any[] | null; projects: any[] | null; formatCurrency: any; router: any }) {
  const collected = invoices
    ? invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0)
    : 14500;
  const outstanding = invoices
    ? invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + (i.amount || 0), 0)
    : 8400;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Revenue', value: formatCurrency(collected), color: 'text-ivory', sub: 'Target: $50,000' },
            { label: 'Outstanding AR', value: formatCurrency(outstanding), color: 'text-[#B89B6A]', sub: 'Invoice collections' },
            { label: 'Client NPS Average', value: '8.6 · Excellent', color: 'text-[#7FA38A]', sub: 'Based on 14 responses' },
            { label: 'Pipeline Deals', value: '$124,000', color: 'text-silver', sub: '8 active negotiations' }
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
              <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </span>
              <span className="text-[9px] text-fog/60">{kpi.sub}</span>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Cash-Flow Projections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { period: 'Next 30 Days', expected: 18400, type: 'positive' },
                { period: 'Next 60 Days', expected: 34200, type: 'positive' },
                { period: 'Next 90 Days', expected: -4500, type: 'negative' }
              ].map((proj, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/2">
                  <span className="text-xs text-silver font-medium">{proj.period}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold font-mono", proj.type === 'positive' ? 'text-[#7FA38A]' : 'text-ember')}>
                      {proj.type === 'positive' ? '+' : ''}{formatCurrency(proj.expected)}
                    </span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", proj.type === 'positive' ? 'bg-sage' : 'bg-ember')} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-fog leading-relaxed italic">
              AI forecasting model based on contract renewal dates, billing milestones, and client payment cycles.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Client Health & Risk Tracker</CardTitle>
            <button onClick={() => router.push('/app/clients')} className="text-[10px] text-fog hover:text-silver transition-colors flex items-center gap-0.5">
              Manage accounts <ArrowRight size={10} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { client: 'Acme Corp', status: 'At Risk', score: 'NPS: 5.4 · 2 late invoices', color: 'text-ember bg-[#A86A6A]/10 border-[#A86A6A]/20' },
                { client: 'Bolt Tech', status: 'Fair', score: 'NPS: 7.2 · 1 open support ticket', color: 'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20' },
                { client: 'Zenith Lab', status: 'Good', score: 'NPS: 9.0 · Healthy retainer', color: 'text-sage bg-[#7FA38A]/10 border-[#7FA38A]/20' }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-ivory">{row.client}</p>
                    <p className="text-[10px] text-fog mt-0.5">{row.score}</p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", row.color)}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <GettingStartedChecklist />
      </div>
    </div>
  );
}

function PMDashboardView({ projects, router }: { projects: any[] | null; tasks: any[] | null; router: any }) {
  const activeProjects = projects ? projects.filter(p => p.status === 'active') : [];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Projects', value: String(activeProjects.length || 8), color: 'text-ivory', sub: '6 on track, 2 delayed' },
            { label: 'Task Completion', value: '87%', color: 'text-[#7FA38A]', sub: '+3% this week' },
            { label: 'Project Velocity', value: '1.4 tasks / day', color: 'text-silver', sub: 'Optimal workflow speed' },
            { label: 'Capacity Utility', value: '84%', color: 'text-[#B89B6A]', sub: 'Team workload balance' }
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
              <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </span>
              <span className="text-[9px] text-fog/60">{kpi.sub}</span>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Project Health Index</CardTitle>
            <button onClick={() => router.push('/app/projects')} className="text-[10px] text-fog hover:text-silver transition-colors flex items-center gap-0.5">
              All projects <ArrowRight size={10} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Brand Refresh (Acme)', pm: 'Jane Studio', progress: 64, status: 'On Track', color: 'bg-sage' },
                { name: 'E-Commerce Launch (Bolt)', pm: 'Alex Developer', progress: 40, status: 'Delayed', color: 'bg-ember' },
                { name: 'Mobile App Design', pm: 'Jane Studio', progress: 90, status: 'On Track', color: 'bg-sage' }
              ].map((p, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-ivory">{p.name}</p>
                      <p className="text-[9px] text-fog">PM: {p.pm}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", p.status === 'On Track' ? 'text-sage bg-[#7FA38A]/10 border-[#7FA38A]/20' : 'text-ember bg-[#A86A6A]/10 border-[#A86A6A]/20')}>
                      {p.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-dusk">
                    <div className={cn("h-full rounded-full transition-all duration-500", p.color)} style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot size={13} className="text-[#B89B6A]" />
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">PM Agent Intelligence Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                'Developer workload is close to capacity limit (84%). Recommend shifting task #204 to Designer Studio to avoid bottleneck.',
                'The wireframe approval milestone for E-Commerce Launch is delayed by 4 days due to outstanding client feedback.',
                'Weekly project velocity has increased by 12% following integration of Relevance AI workflows.'
              ].map((insight, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs text-silver leading-relaxed p-2.5 rounded-lg border border-white/5 bg-white/1">
                  <span className="text-fog">·</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <GettingStartedChecklist />
      </div>
    </div>
  );
}

function FinanceDashboardView({ invoices, formatCurrency, router }: { invoices: any[] | null; formatCurrency: any; router: any }) {
  const outstanding = invoices ? invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + (i.amount || 0), 0) : 12800;
  const overdue = invoices ? invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0) : 3200;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Outstanding AR', value: formatCurrency(outstanding), color: 'text-silver', sub: 'Pending payments' },
            { label: 'Overdue Invoices', value: formatCurrency(overdue), color: 'text-ember', sub: 'Immediate follow-up' },
            { label: 'Retainer Monthly Value', value: '$28,500', color: 'text-[#7FA38A]', sub: '7 active contracts' },
            { label: 'Monthly Burn Rate', value: '$18,400', color: 'text-[#B89B6A]', sub: 'Runway: 11 months' }
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
              <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </span>
              <span className="text-[9px] text-fog/60">{kpi.sub}</span>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Active Retainers & Contracts</CardTitle>
            <button onClick={() => router.push('/app/billing')} className="text-[10px] text-fog hover:text-silver transition-colors flex items-center gap-0.5">
              Billing hub <ArrowRight size={10} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { client: 'Acme Corp Design Retainer', amount: 5000, hrsUsed: 8, hrsMax: 20, cycle: 'Monthly' },
                { client: 'Bolt Tech Dev Retainer', amount: 8000, hrsUsed: 14, hrsMax: 40, cycle: 'Monthly' },
                { client: 'Zenith Lab Consulting', amount: 3500, hrsUsed: 19, hrsMax: 20, cycle: 'Monthly' }
              ].map((r, idx) => {
                const pct = Math.round((r.hrsUsed / r.hrsMax) * 100);
                const barColor = pct >= 95 ? 'bg-ember' : pct >= 75 ? 'bg-warm' : 'bg-sage';
                return (
                  <div key={idx} className="p-3 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-ivory">{r.client}</p>
                        <p className="text-[9px] text-fog">{r.cycle} · {r.hrsUsed} / {r.hrsMax} hrs billed</p>
                      </div>
                      <span className="text-xs font-bold text-silver">{formatCurrency(r.amount)}</span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden bg-dusk">
                      <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Invoice Aging & Cash-In Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current (0-15d)', value: '$12,600', desc: '94% collection probability' },
                { label: 'Overdue (16-30d)', value: '$2,000', desc: '80% collection probability' },
                { label: 'Late (30d+)', value: '$1,200', desc: 'Requires collection calls' }
              ].map((age, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-white/5 bg-white/2 text-center">
                  <p className="text-[9px] uppercase font-semibold text-fog tracking-wider">{age.label}</p>
                  <p className="text-sm font-bold text-ivory mt-1 font-mono">{age.value}</p>
                  <p className="text-[9px] text-fog/60 mt-1 leading-tight">{age.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg border border-[#B89B6A]/10 bg-[#B89B6A]/5 flex items-center gap-3">
              <AlertTriangle size={14} className="text-[#B89B6A] shrink-0" />
              <p className="text-xs text-silver leading-relaxed">
                <span className="font-semibold text-ivory">Billing Anomaly Alert:</span> Bolt Tech design sprint hours tracked exceed the estimate by 18%. Verify task list before invoice generation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <GettingStartedChecklist />
      </div>
    </div>
  );
}

function ClientDashboardView({ router }: { approvals: any[] | null; router: any }) {
  const [items, setItems] = useState<any[]>([
    { id: 'app-1', title: 'Logo guidelines wireframe design v2', type: 'Design', status: 'pending' },
    { id: 'app-2', title: 'Content marketing plan strategy sign-off', type: 'Document', status: 'pending' },
    { id: 'app-3', title: 'Sprint milestone project roadmap timeline', type: 'Milestone', status: 'pending' }
  ]);

  const handleApprove = (id: string, name: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'approved' } : item));
    toast.success(`Approved deliverable: "${name}"`);
  };

  const pendingItems = items.filter(i => i.status === 'pending');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Projects', value: '2 Projects', color: 'text-ivory', sub: 'Brand & Web Identity' },
            { label: 'Pending Reviews', value: String(pendingItems.length), color: 'text-[#B89B6A]', sub: 'Requires sign-off' },
            { label: 'Open Support Tickets', value: '1 Active', color: 'text-silver', sub: 'Login issues' },
            { label: 'Next Sync Session', value: 'June 10 · 10am', color: 'text-[#7FA38A]', sub: 'Status call calendar' }
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
              <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </span>
              <span className="text-[9px] text-fog/60">{kpi.sub}</span>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Pending reviews & approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingItems.length === 0 ? (
              <p className="text-xs text-fog py-4 text-center">No outstanding approvals needed. You are all caught up!</p>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-white/5 bg-white/2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-semibold text-fog uppercase border border-white/15 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                      <p className="text-xs font-semibold text-ivory mt-1">{item.title}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id, item.title)}
                      className="bg-ivory hover:bg-white text-midnight font-semibold rounded-full shrink-0 text-xs py-1 h-8"
                    >
                      Approve deliverable
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Support ticket status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ivory">Ticket #2844: Client portal link expired</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20">
                  Investigating
                </span>
              </div>
              <p className="text-[11px] text-fog mt-2 leading-relaxed">
                "Our team is looking into the token expiration logic and will reissue a permanent workspace link by this afternoon." (Last response 2 hrs ago)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Quick resource links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              { label: 'View Shared Files', href: '/app/files' },
              { label: 'Figma Canvas Mockup', href: 'https://figma.com' },
              { label: 'Past Billing Invoices', href: '/app/billing' }
            ].map((link, idx) => (
              <button
                key={idx}
                onClick={() => link.href.startsWith('http') ? window.open(link.href, '_blank') : router.push(link.href)}
                className="w-full p-2.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 text-xs text-silver hover:text-ivory text-left transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ExternalLink size={11} className="text-fog" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DesignerDeveloperDashboardView({ tasks, handleToggleTask, role, router }: { tasks: any[]; handleToggleTask: any; role: 'designer' | 'developer'; router: any }) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(6128);
  
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const focusTask = role === 'developer'
    ? 'Refactor database migrations for Supabase tables'
    : 'Design onboarding UI flows in Figma';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tasks Due Today', value: String(tasks.length || 5), color: 'text-silver' },
            { label: 'Time Tracked', value: '5.8 hours', color: 'text-ivory' },
            { label: 'Focus Score', value: '94% · Optimal', color: 'text-[#7FA38A]' },
            { label: role === 'developer' ? 'PRs Merged' : 'Designs Completed', value: '4 completed', color: 'text-[#B89B6A]' }
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
              <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </span>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none overflow-hidden relative">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Active focus spotlight</CardTitle>
              <div className="flex items-center gap-1.5 text-[10px] text-fog">
                <Clock size={10} />
                <span>Deep work session</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <p className="text-[10px] text-fog uppercase tracking-wider font-semibold">Priority #1 Focus Task</p>
              <p className="text-sm font-semibold text-ivory mt-1">{focusTask}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-[#0A0D14] border border-white/5 rounded-xl p-4 justify-between">
              <div>
                <span className="text-[9px] text-fog uppercase tracking-wider font-semibold">Tracked Session Time</span>
                <p className="text-xl font-bold font-mono text-ivory tracking-tight">{formatTime(elapsedSeconds)}</p>
              </div>
              <Button
                onClick={() => setTimerRunning(!timerRunning)}
                className={cn("h-10 w-10 rounded-full flex items-center justify-center transition-colors shadow-md", timerRunning ? 'bg-[#A86A6A] hover:bg-[#A86A6A]/80 text-white' : 'bg-ivory hover:bg-white text-midnight')}
              >
                {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Focus Priority Queue</CardTitle>
            <button onClick={() => router.push('/app/tasks')} className="text-[10px] text-fog hover:text-silver transition-colors flex items-center gap-0.5">
              Task board <ArrowRight size={10} />
            </button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-xs text-fog py-3 text-center">All caught up! No tasks left in your queue.</p>
            ) : (
              <div className="divide-y divide-white/5 space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id || task._id} className="flex items-center justify-between py-2 pt-2.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleTask(task.id || task._id, task.title)}
                        className="h-3.5 w-3.5 rounded border-white/10 bg-transparent text-[#7FA38A] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ivory truncate">{task.title}</p>
                        <p className="text-[10px] text-fog mt-0.5">{task.project}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-fog shrink-0">
                      {new Date(task.dueDate || task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Quick Links & Resources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              { label: role === 'developer' ? 'GitHub Repositories' : 'Figma Design Workspace', href: 'https://github.com' },
              { label: 'Workspace Assets & Files', href: '/app/files' },
              { label: 'Time Tracking Dashboard', href: '/app/time-tracking' }
            ].map((link, idx) => (
              <button
                key={idx}
                onClick={() => link.href.startsWith('http') ? window.open(link.href, '_blank') : router.push(link.href)}
                className="w-full p-2.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 text-xs text-silver hover:text-ivory text-left transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ExternalLink size={11} className="text-fog" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
