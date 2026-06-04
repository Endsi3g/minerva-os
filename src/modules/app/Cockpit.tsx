'use client';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  TrendingUp, TrendingDown, Minus, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/i18n';
import { useWorkspaces, useClients, useProjects, useTasks, useApprovals, useInvoices, useRetainers } from '@/lib/hooks/useSupabase';
import { useTier } from '@/lib/hooks/useTier';
import { cn } from '@/lib/utils';
import { computePortfolioHealth } from '@/lib/health-scores';
import { HealthScoreRing } from '@/components/minerva/HealthScoreRing';
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TASKS, MOCK_APPROVALS, MOCK_INVOICES, MOCK_RETAINERS } from '@/lib/mock-data';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import type { PortfolioHealth, HealthAlert, Client, Project, Task, Approval, Invoice, Retainer } from '@/lib/types';

function scoreColor(score: number) {
  if (score >= 75) return '#7FA38A';
  if (score >= 50) return '#B89B6A';
  return '#A86A6A';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9099' }}>
      {children}
    </p>
  );
}

function KpiCard({ label, value, sub, color = '#F5F1E8' }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div
      className="rounded-[14px] border p-5 flex flex-col gap-1"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <p className="text-[11px]" style={{ color: '#8A9099' }}>{label}</p>
      <p className="text-2xl font-semibold leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>{sub}</p>}
    </div>
  );
}

export default function Cockpit() {
  const { t } = useLang();
  const { tier } = useTier();
  const ck = t.app.cockpit;
  const hs = t.app.healthScores;

  const workspaces = useWorkspaces();
  const workspaceId = (workspaces as any[])?.[0]?._id ?? null;

  const rawClients  = useClients(workspaceId) as any;
  const rawProjects = useProjects(workspaceId) as any;
  const rawTasks    = useTasks(workspaceId, undefined) as any;
  const rawApprovals = useApprovals(workspaceId) as any;
  const rawInvoices  = useInvoices(workspaceId) as any;
  const rawRetainers = useRetainers(workspaceId) as any;

  const loading = !workspaceId;

  const clients   = (rawClients   ?? MOCK_CLIENTS)   as Client[];
  const projects  = (rawProjects  ?? MOCK_PROJECTS)  as Project[];
  const tasks     = (rawTasks     ?? MOCK_TASKS)     as Task[];
  const approvals = (rawApprovals ?? MOCK_APPROVALS) as Approval[];
  const invoices  = (rawInvoices  ?? MOCK_INVOICES)  as Invoice[];
  const retainers = (rawRetainers ?? MOCK_RETAINERS) as Retainer[];

  const portfolio = useMemo<PortfolioHealth | null>(() => {
    if (!clients.length) return null;
    return computePortfolioHealth(clients, projects, tasks, approvals, invoices, retainers);
  }, [clients, projects, tasks, approvals, invoices, retainers]);

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);

  const revenueThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paidDate?.startsWith(thisMonth))
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const onTimeRate = useMemo(() => {
    const doneTasks = tasks.filter(t => t.status === 'done');
    if (!doneTasks.length) return 100;
    const onTime = doneTasks.filter(t => new Date(t.dueDate) >= today).length;
    return Math.round((onTime / doneTasks.length) * 100);
  }, [tasks]);

  const avgApprovalDays = useMemo(() => {
    const pending = approvals.filter(a => a.status === 'pending');
    if (!pending.length) return 0;
    const totalDays = pending.reduce((s, a) => {
      return s + Math.floor((today.getTime() - new Date(a.submittedDate).getTime()) / 86400000);
    }, 0);
    return Math.round(totalDays / pending.length);
  }, [approvals]);

  const recentWins = useMemo(() => {
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const wins: Array<{ label: string; name: string; date: string }> = [];
    invoices
      .filter(i => i.status === 'paid' && i.paidDate && new Date(i.paidDate) >= thirtyDaysAgo)
      .slice(0, 3)
      .forEach(i => wins.push({ label: ck.winTypes.invoice_paid, name: `INV-${i.number}`, date: i.paidDate! }));
    projects
      .filter(p => p.status === 'completed')
      .slice(0, 2)
      .forEach(p => wins.push({ label: ck.winTypes.project_completed, name: p.name, date: p.dueDate }));
    return wins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [invoices, projects, ck]);

  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasks]);

  const alertIcons: Record<string, React.ElementType> = { critical: AlertTriangle, warning: AlertCircle, info: Info };
  const alertColors: Record<string, string> = { critical: '#A86A6A', warning: '#B89B6A', info: '#8A9099' };

  const trendIcon = (trend: PortfolioHealth['trend']) =>
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = (trend: PortfolioHealth['trend']) =>
    trend === 'up' ? '#7FA38A' : trend === 'down' ? '#A86A6A' : '#8A9099';

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-normal"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
        >
          {ck.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>{ck.subtitle}</p>
      </div>

      {/* KPI Strip */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-[14px] bg-white/5" />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {tier === 'starter' ? (
            <>
              <KpiCard
                label={t.portal.overview.stats.activeProjects}
                value={<AnimatedNumber value={projects.filter(p => p.status === 'active').length} />}
                sub={`${projects.length} total`}
              />
              <KpiCard
                label={t.portal.overview.stats.pendingApprovals}
                value={<AnimatedNumber value={approvals.filter(a => a.status === 'pending').length} />}
                sub={avgApprovalDays > 0 ? `${avgApprovalDays}d avg. age` : 'All resolved'}
              />
            </>
          ) : (
            <>
              <div
                className="rounded-[14px] border p-4 flex items-center gap-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <HealthScoreRing score={portfolio?.overall ?? 0} size={52} />
                <div>
                  <p className="text-[11px]" style={{ color: '#8A9099' }}>{ck.portfolioScore}</p>
                  <p className="text-xs mt-0.5" style={{ color: scoreColor(portfolio?.overall ?? 0) }}>
                    {hs.trend[portfolio?.trend ?? 'stable']}
                  </p>
                </div>
              </div>
              <KpiCard
                label={t.app.cockpit.sections.alerts}
                value={<AnimatedNumber value={portfolio?.summary.critical ?? 0} />}
                sub={portfolio?.summary.critical ? `${portfolio.summary.atRisk} at risk` : 'All healthy'}
                color={portfolio?.summary.critical ? '#A86A6A' : '#7FA38A'}
              />
            </>
          )}
          <KpiCard
            label="On-time delivery"
            value={`${onTimeRate}%`}
            sub={`${tasks.filter(t => t.status === 'done').length} tasks done`}
            color={onTimeRate >= 80 ? '#7FA38A' : onTimeRate >= 60 ? '#B89B6A' : '#A86A6A'}
          />
          <KpiCard
            label="Revenue (month)"
            value={`$${(revenueThisMonth / 1000).toFixed(0)}k`}
            sub={`${invoices.filter(i => i.status === 'paid' && i.paidDate?.startsWith(thisMonth)).length} invoices paid`}
          />
        </motion.div>
      )}

      {/* Critical Alerts */}
      {tier !== 'starter' && (
        <section>
          <SectionTitle>{ck.sections.alerts}</SectionTitle>
          {!portfolio?.alerts.length ? (
            <div
              className="rounded-[14px] border p-6 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(127,163,138,0.04)', borderColor: 'rgba(127,163,138,0.15)' }}
            >
              <CheckCircle2 size={16} style={{ color: '#7FA38A' }} />
              <p className="text-sm" style={{ color: '#8A9099' }}>{ck.noAlerts}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolio.alerts.slice(0, 6).map((alert: HealthAlert) => {
                const Icon = alertIcons[alert.severity] ?? Info;
                const color = alertColors[alert.severity] ?? '#8A9099';
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-[12px] border flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: `${color}30` }}
                  >
                    <Icon size={14} style={{ color, flexShrink: 0 }} />
                    <p className="text-sm flex-1" style={{ color: '#F5F1E8' }}>{alert.message}</p>
                    <Link href={alert.link}>
                      <ChevronRight size={14} style={{ color: '#8A9099' }} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Portfolio Health */}
      {tier !== 'starter' && (
        <section>
          <SectionTitle>{ck.sections.health}</SectionTitle>
          {!portfolio?.clients.length ? (
            <p className="text-sm" style={{ color: '#8A9099' }}>{ck.allHealthy}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.clients.map((c, i) => {
                const TrendIcon = trendIcon(c.trend);
                return (
                  <motion.div
                    key={c.clientId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-[14px] border p-4 space-y-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                        style={{ backgroundColor: `${scoreColor(c.overall)}20`, color: scoreColor(c.overall) }}
                      >
                        {c.clientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#F5F1E8' }}>{c.clientName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <TrendIcon size={10} style={{ color: trendColor(c.trend) }} />
                          <span className="text-[10px]" style={{ color: trendColor(c.trend) }}>{hs.trend[c.trend]}</span>
                        </div>
                      </div>
                      <HealthScoreRing score={c.overall} size={40} strokeWidth={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {(Object.keys(c.dimensions) as Array<keyof typeof c.dimensions>).map(dim => (
                        <div key={dim}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px]" style={{ color: '#8A9099' }}>{hs.dimensions[dim]}</span>
                            <span className="text-[9px]" style={{ color: scoreColor(c.dimensions[dim]) }}>{c.dimensions[dim]}</span>
                          </div>
                          <div className="h-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.dimensions[dim]}%`, backgroundColor: scoreColor(c.dimensions[dim]) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Delivery + Wins */}
      <div className={cn("grid grid-cols-1 gap-6", tier === 'starter' ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {/* Urgent Tasks (Starter only) */}
        {tier === 'starter' && (
          <section>
            <SectionTitle>{ck.sections.urgentTasks}</SectionTitle>
            {!urgentTasks.length ? (
              <div
                className="rounded-[14px] border p-5 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(127,163,138,0.04)', borderColor: 'rgba(127,163,138,0.15)' }}
              >
                <CheckCircle2 size={16} style={{ color: '#7FA38A' }} />
                <p className="text-sm" style={{ color: '#8A9099' }}>All tasks completed</p>
              </div>
            ) : (
              <div
                className="rounded-[14px] border divide-y"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', '--tw-divide-opacity': '1' } as React.CSSProperties}
              >
                {urgentTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: task.priority === 'urgent' ? '#A86A6A' : task.priority === 'high' ? '#B89B6A' : '#8A9099'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F5F1E8' }}>{task.title}</p>
                      <p className="text-[10px]" style={{ color: '#8A9099' }}>{task.project}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Delivery Health */}
        <section>
          <SectionTitle>{ck.sections.delivery}</SectionTitle>
          <div
            className="rounded-[14px] border p-5 space-y-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#8A9099' }}>Tasks on-time</span>
                <span className="text-xs font-medium" style={{ color: scoreColor(onTimeRate) }}>{onTimeRate}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${onTimeRate}%`, backgroundColor: scoreColor(onTimeRate) }} />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#8A9099' }}>Avg. approval age</span>
              <span className="text-xs font-medium" style={{ color: avgApprovalDays > 7 ? '#A86A6A' : '#7FA38A' }}>
                {avgApprovalDays}d
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#8A9099' }}>Pending approvals</span>
              <span className="text-xs font-medium" style={{ color: '#F5F1E8' }}>
                {approvals.filter(a => a.status === 'pending').length}
              </span>
            </div>
          </div>
        </section>

        {/* Recent Wins */}
        <section>
          <SectionTitle>{ck.sections.wins}</SectionTitle>
          {!recentWins.length ? (
            <p className="text-sm" style={{ color: '#8A9099' }}>{ck.noWins}</p>
          ) : (
            <div
              className="rounded-[14px] border divide-y"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', '--tw-divide-opacity': '1' } as React.CSSProperties}
            >
              {recentWins.map((win, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: '#7FA38A' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: '#F5F1E8' }}>{win.name}</p>
                    <p className="text-[10px]" style={{ color: '#8A9099' }}>{win.label}</p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: '#8A9099' }}>
                    {new Date(win.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
