'use client';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  ExternalLink,
  Phone,
  Network,
  Bot,
  Wrench,
  Database,
  Globe,
  Search,
  MessageSquare,
  Users,
  HelpCircle,
  ArrowRight,
  Activity,
  Key,
  Hammer,
} from 'lucide-react';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useDeals, useTasks, useActivity } from '@/lib/hooks/useSupabase';
import { AgentSuggestions } from '@/components/agents/AgentSuggestions';
import { motion, AnimatePresence } from 'motion/react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { TextAnimate } from '@/components/ui/text-animate';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface RecentPageItem {
  title: string;
  path: string;
  timestamp: number;
}

const MOCK_RECENT_AGENTS = [
  { id: 'ux-research-insights', name: 'UX Research Insights Agent', edited: 'Edited 7m ago', color: 'bg-indigo-600', initials: 'UX', icons: [Globe, Search, MessageSquare] },
  { id: 'ux-competitor-benchmark', name: 'UX Competitor Benchmark Analyst', edited: 'Edited 1h ago', color: 'bg-emerald-600', initials: 'CB', icons: [Activity, Wrench, Key] },
  { id: 'rellie-recruiter', name: 'Rellie, The Relevance Recruiter', edited: 'Edited 8h ago', color: 'bg-purple-600', initials: 'RL', icons: [Users, Bot, Database] },
  { id: 'recruitmer', name: 'Recruitmer', edited: 'Edited 1d ago', color: 'bg-pink-600', initials: 'RM', icons: [Hammer, HelpCircle, Activity] },
];

function AgentOrbit({ avatarColor = 'bg-blue-500', name = 'A', icons = [] }: { avatarColor?: string, name?: string, icons?: any[] }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center select-none mx-auto mb-3">
      {/* Outer orbit circle */}
      <div className="absolute w-20 h-20 rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
      
      {/* Inner dashed orbit circle */}
      <div className="absolute w-14 h-14 rounded-full border border-dashed border-[#7FA38A]/10 animate-[spin_20s_linear_infinite]" />

      {/* Floating mini icons on outer orbit */}
      {icons.map((Icon: any, idx: number) => {
        const angle = (idx * 360) / icons.length;
        const radius = 40; // perimeter placement
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        
        return (
          <div
            key={idx}
            className="absolute h-4 w-4 rounded-full bg-[#171C2A] border border-white/10 flex items-center justify-center shadow-md"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <Icon size={8} className="text-[#7FA38A]" />
          </div>
        );
      })}

      {/* Central avatar bubble */}
      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md z-10 border border-white/10", avatarColor)}>
        {name}
      </div>
    </div>
  );
}

const TOP_PERFORMERS = [
  { name: 'Kael', role: 'Owner', capacity: 85, onTimeRate: 98, openTasks: 3, avatar: 'K' },
  { name: 'Jane Studio', role: 'Designer', capacity: 92, onTimeRate: 100, openTasks: 2, avatar: 'JS' },
  { name: 'Alex', role: 'Developer', capacity: 70, onTimeRate: 90, openTasks: 5, avatar: 'A' },
];

const TIME_TRACKED_DATA = [
  { date: 'Jan 25', unbilled: 0.5, billed: 4 },
  { date: 'Jan 27', unbilled: 1.2, billed: 6 },
  { date: 'Jan 29', unbilled: 0, billed: 3.5 },
  { date: 'Jan 31', unbilled: 2, billed: 5 },
  { date: 'Feb 02', unbilled: 1.5, billed: 6.2 },
  { date: 'Feb 04', unbilled: 0.8, billed: 4.8 },
  { date: 'Feb 06', unbilled: 3.2, billed: 1.5 },
  { date: 'Feb 08', unbilled: 2.1, billed: 5.5 },
];


/* ── Activity Feed ────────────────────────────────────────────────────────── */
function ActivityFeed({ emptyLabel, workspaceId }: { emptyLabel: string, workspaceId: any }) {
  const activity = useActivity(workspaceId);

  if (activity === null) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-center text-xs text-fog pt-4">{emptyLabel}</p>
    );
  }

  return (
    <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-5">
      {activity.slice(0, 10).map((a: any) => (
        <div key={a._id} className="relative">
          {/* Dot */}
          <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-white/10 bg-[#7FA38A]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-silver leading-relaxed">
              <span className="font-semibold text-ivory">{a.user}</span> {a.action} <span className="text-ivory font-medium">{a.targetName}</span>
            </p>
            <p className="text-[10px] text-fog mt-0.5">
              {new Date(a.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── AI Daily Briefing ────────────────────────────────────────────────────── */
function DailyBriefing({ context, labels }: {
  context: string;
  labels: { title: string; loading: string; error: string; refresh: string };
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(false);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a dense, bulleted strategic advice list based on this context. Prefix each point with a middot (·). Make it extremely actionable.' }],
          context,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContent(data.content);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (context) load();
  }, [context, load]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#111522] p-5 relative overflow-hidden">
      <TextureOverlay texture="dots" opacity={0.08} />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#B89B6A] animate-pulse" />
          <span className="text-xs font-semibold text-ivory uppercase tracking-wider">{labels.title}</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-fog hover:text-silver transition-colors cursor-pointer"
        >
          <RefreshCwIcon className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="relative z-10 min-h-[60px]">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-white/5" />
            <Skeleton className="h-3 w-5/6 bg-white/5" />
            <Skeleton className="h-3 w-2/3 bg-white/5" />
          </div>
        )}
        {err && !loading && (
          <p className="text-xs text-ember">{labels.error}</p>
        )}
        {content && !loading && (
          <div className="text-xs text-silver leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

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
  const { workspace } = useWorkspace();

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
  const deals = useDeals(workspaceId);
  const tasks = useTasks(workspaceId);

  const isLoading = workspaces === null || projects === null || invoices === null || approvals === null || deals === null || tasks === null;

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  /* ── State for local tasks completion ── */
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  useEffect(() => {
    if (tasks) {
      // Filter to keep only active, non-completed tasks
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

  /* ── Recent pages state & hook ── */
  const [recentPages, setRecentPages] = useState<RecentPageItem[]>([]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = 'minerva_recent_pages';
      let pages = JSON.parse(localStorage.getItem(key) || '[]');
      if (pages.length === 0) {
        pages = [
          { title: 'Brand Identity', path: '/app/projects', timestamp: Date.now() - 3600000 },
          { title: 'Active CRM Pipeline', path: '/app/pipeline', timestamp: Date.now() - 7200000 },
          { title: 'Workspace Settings', path: '/app/settings', timestamp: Date.now() - 86400000 },
        ];
        localStorage.setItem(key, JSON.stringify(pages));
      }
      setRecentPages(pages);

      // Track current page visit
      const currentItem = {
        title: 'Dashboard',
        path: '/app/dashboard',
        timestamp: Date.now()
      };
      const updated = [currentItem, ...pages.filter((p: any) => p.path !== '/app/dashboard')].slice(0, 4);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }, []);

  /* ── Financial calculations for Bonsai KPI strip ── */
  const financialMetrics = useMemo(() => {
    if (!invoices) return { outstanding: 0, overdue: 0, paidPending: 0, otherIncome: 460 };
    const outstanding = invoices.filter((i: any) => i.status === 'sent').reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const overdue = invoices.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const paidPending = invoices.filter((i: any) => ['paid', 'sent'].includes(i.status)).reduce((s: number, i: any) => s + (i.amount || 0), 0);
    return { outstanding, overdue, paidPending, otherIncome: 460 };
  }, [invoices]);

  const activeProjectsCount = projects ? projects.filter((p: any) => p.status === 'active').length : 0;
  const pendingApprovalsCount = approvals ? approvals.filter((a: any) => a.status === 'pending').length : 0;

  const briefingContext = workspaceId
    ? `Active projects: ${activeProjectsCount}. Open tasks: ${localTasks.length}. Pending approvals: ${pendingApprovalsCount}. Outstanding invoices: $${financialMetrics.outstanding}. Overdue invoices: $${financialMetrics.overdue}.`
    : '';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">
      
      {/* Relevance AI Style Welcome Banner */}
      <motion.div
        className="relative h-48 w-full rounded-xl overflow-hidden border border-white/5 shadow-lg bg-gradient-to-r from-[#0C1222] via-[#0A0D14] to-[#121A30] flex flex-col items-center justify-center p-6 select-none"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Banner Star Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          src="/dashboard-banner.mp4"
        />
        
        {/* Banner Title */}
        <div className="relative z-20 text-center mb-5 mt-2">
          <h2 className="text-2xl font-bold tracking-tight text-ivory font-sans">
            Welcome to Relevance AI {workspace ? `· ${workspace.name}` : ''}
          </h2>
        </div>

        {/* Floating rounded bar container */}
        <div className="relative z-20 bg-[#F5F1E8] text-[#0A0D14] rounded-full px-8 py-2.5 flex items-center justify-between gap-6 shadow-xl max-w-md w-full border border-black/10">
          <button
            onClick={() => router.push('/app/copilot')}
            className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <Phone size={13} className="text-[#0A0D14]" />
            <span className="text-[9px] font-bold">Phone</span>
          </button>
          
          <button
            onClick={() => router.push('/app/resources')}
            className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <Network size={13} className="text-[#0A0D14]" />
            <span className="text-[9px] font-bold">Workforce</span>
          </button>

          {/* Centered highlighted Agent button */}
          <div className="relative -mt-6 flex flex-col items-center group">
            <button
              onClick={() => router.push('/app/agents')}
              className="h-11 w-11 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer relative"
            >
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-[#A855F7] animate-pulse">
                <Bot size={16} />
              </div>
            </button>
            <span className="text-[9px] font-extrabold text-[#0A0D14] mt-0.5">Agent</span>
          </div>

          <button
            onClick={() => router.push('/app/agent-ops')}
            className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <Wrench size={13} className="text-[#0A0D14]" />
            <span className="text-[9px] font-bold">Tool</span>
          </button>

          <button
            onClick={() => router.push('/app/knowledge')}
            className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <Database size={13} className="text-[#0A0D14]" />
            <span className="text-[9px] font-bold">Knowledge</span>
          </button>
        </div>
      </motion.div>

      {/* Greeting Messages */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-2xl font-semibold text-ivory tracking-tight" />
        <p className="text-xs text-fog max-w-2xl leading-relaxed">
          Welcome {displayName}, your statistics for today are here. Here's what you can do to be better today...
        </p>
      </motion.div>

      {/* Bonsai-Style Top KPI Analytics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Outstanding', value: financialMetrics.outstanding, color: 'text-silver' },
          { label: 'Overdue', value: financialMetrics.overdue, color: 'text-ember' },
          { label: 'Paid & Pending', value: financialMetrics.paidPending, color: 'text-[#B89B6A]' },
          { label: 'Other Income', value: financialMetrics.otherIncome, color: 'text-[#7FA38A]', isSuccess: true }
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            className="bg-[#111522] border border-white/5 rounded-xl p-4.5 flex flex-col gap-1 shadow-sm"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider text-fog">{kpi.label}</span>
            <span className={cn("text-xl font-bold tracking-tight", kpi.isSuccess ? 'text-[#7FA38A]' : 'text-ivory')}>
              {formatCurrency(kpi.value)}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming & Overdue Tasks */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Upcoming & Overdue Tasks</CardTitle>
              <button
                onClick={() => router.push('/app/tasks')}
                className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center text-fog hover:text-silver hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Plus size={12} />
              </button>
            </CardHeader>
            <CardContent>
              {localTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-fog">All tasks completed</div>
              ) : (
                <div className="divide-y divide-white/5 space-y-2">
                  <AnimatePresence initial={false}>
                    {localTasks.slice(0, 5).map(task => (
                      <motion.div
                        key={task.id || task._id}
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between py-2 pt-2.5"
                      >
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
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-fog">
                            {new Date(task.dueDate || task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            task.priority === 'urgent' ? 'bg-ember' : task.priority === 'high' ? 'bg-warm' : 'bg-fog'
                          )} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Tracked Chart */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Time Tracked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TIME_TRACKED_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      stroke="#8A9099"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#8A9099"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171C2A', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}
                      labelStyle={{ fontSize: '10px', color: '#F5F1E8', fontWeight: 600 }}
                      itemStyle={{ fontSize: '10px', color: '#B8BDC7' }}
                    />
                    <Bar dataKey="billed" stackId="a" fill="#7FA38A" radius={[2, 2, 0, 0]} barSize={12} />
                    <Bar dataKey="unbilled" stackId="a" fill="#B89B6A" radius={[2, 2, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/5">
                {[
                  { label: 'Unbilled Hours', value: '08:01:16' },
                  { label: 'Unbilled Amount', value: '$160.42', isAmount: true },
                  { label: 'Billed Hours', value: '01:00:07' },
                  { label: 'Billed Amount', value: '$20.04', isAmount: true }
                ].map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-fog block">{item.label}</span>
                    <span className="text-sm font-bold text-ivory">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recently Visited Pages */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Recently Visited Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentPages.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(item.path)}
                    className="p-3 bg-white/2 border border-white/5 rounded-xl hover:bg-white/4 text-left transition-colors cursor-pointer group flex flex-col justify-between h-20"
                  >
                    <span className="text-xs font-semibold text-ivory group-hover:text-white transition-colors">{item.title}</span>
                    <span className="text-[10px] text-fog flex items-center gap-1 justify-between w-full mt-2">
                      <span>{item.path}</span>
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Relevance AI style Recent Agents strip */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Recent</CardTitle>
              <button
                onClick={() => router.push('/app/agents')}
                className="text-[10px] font-bold text-[#7FA38A] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight size={10} />
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {MOCK_RECENT_AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => router.push(`/app/agents/${agent.id}`)}
                    className="p-4 bg-white/2 border border-white/5 rounded-xl hover:bg-white/4 text-center transition-all cursor-pointer group flex flex-col justify-between h-44 shadow-sm"
                  >
                    <AgentOrbit avatarColor={agent.color} name={agent.initials} icons={agent.icons} />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-ivory block truncate group-hover:text-[#7FA38A] transition-colors">{agent.name}</span>
                      <span className="text-[9px] text-fog block">{agent.edited}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers / Top Board */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Top Board / Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TOP_PERFORMERS.map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-dusk border border-white/5 flex items-center justify-center text-[10px] font-bold text-[#7FA38A]">
                        {perf.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ivory">{perf.name}</p>
                        <p className="text-[10px] text-fog">{perf.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold tracking-wider text-fog block">On-Time</span>
                        <span className="text-xs font-bold text-[#7FA38A]">{perf.onTimeRate}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold tracking-wider text-fog block">Capacity</span>
                        <span className="text-xs font-bold text-[#B89B6A]">{perf.capacity}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold tracking-wider text-fog block">Open Tasks</span>
                        <span className="text-xs font-bold text-silver">{perf.openTasks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* AI Reviews & Suggestions */}
          {workspaceId && (
            <DailyBriefing
              context={briefingContext}
              labels={{
                title: 'AI Reviews & Suggestions',
                loading: d.briefingLoading,
                error: d.briefingError,
                refresh: d.briefingRefresh,
              }}
            />
          )}

          {workspaceId && <AgentSuggestions workspaceId={workspaceId} />}

          {/* Activity Feed */}
          <Card className="bg-[#111522] border border-white/5 rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed emptyLabel={d.activityEmpty} workspaceId={workspaceId} />
            </CardContent>
          </Card>

          {/* Getting Started Checklist */}
          <GettingStartedChecklist />

        </div>

      </div>

    </div>
  );
}
