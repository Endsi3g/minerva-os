'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles, RefreshCw, CalendarClock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1 rounded-full overflow-hidden bg-muted">
      <div
        className="h-full rounded-full transition-all duration-700 bg-primary"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PortalOverview() {
  const { t, lang } = useLang();
  const pc = t.portal.common;
  const po = t.portal.overview;
  const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'overdue'>('all');

  const { token, isValid, clientName, projects, tasks, approvals, invoices, milestones, proposals, messages } = usePortalData();

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);

  if (!isValid) return null;

  const pendingApprovals = approvals.filter((a: any) => a.status === 'pending').length;
  const activeProjects   = projects.filter((p: any) => p.status === 'active').length;
  const outstandingInvoices = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue');
  const outstandingTotal = outstandingInvoices.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
  const unsignedProposals = (proposals || []).filter((p: any) => p.status === 'sent').length;

  const pendingDecisionsCount = pendingApprovals + outstandingInvoices.length + unsignedProposals;

  const upcomingMilestones = milestones
    .filter((m: any) => m.status !== 'completed')
    .sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const stats = [
    { label: po.stats.activeProjects,    value: String(activeProjects),  sub: po.stats.activeProjectsSub, color: 'text-emerald-600' },
    { label: po.stats.pendingApprovals,  value: String(pendingApprovals), sub: po.stats.pendingApprovalsSub, color: pendingApprovals > 0 ? 'text-amber-600' : 'text-emerald-600' },
    { label: po.stats.outstanding,        value: outstandingTotal > 0 ? `$${outstandingTotal.toLocaleString()}` : '—', sub: po.stats.outstandingSub, color: outstandingTotal > 0 ? 'text-amber-600' : 'text-emerald-600' },
  ];

  async function generateSummary(force = false) {
    if (!token || summaryGenerating) return;
    if (summary && !force) return;
    setSummaryGenerating(true);
    try {
      const res = await fetch('/api/portal/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.summary) {
        setSummary(d.summary);
        setSummaryDate(d.generatedAt);
      }
    } catch {}
    finally {
      setSummaryGenerating(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <p className="text-xs tracking-[0.18em] uppercase mb-2 text-emerald-600 opacity-70">
          {pc.welcomeBack}
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
        >
          {clientName}
        </h1>
        <p className="text-sm mt-2 text-muted-foreground">
          {pc.snapshot}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i + 1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="rounded-[16px] p-5 border border-border bg-card"
          >
            <p className={cn('text-3xl font-semibold tabular-nums mb-1', s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-foreground">{s.label}</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Task Timeline ─────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <motion.div custom={4} variants={fadeInUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarClock size={14} className="text-primary" />
                {po.taskTimeline.title}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{po.taskTimeline.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
              {(['all', 'in_progress', 'overdue'] as const).map(f => {
                const labels: Record<typeof f, string> = {
                  all: po.taskTimeline.filterAll,
                  in_progress: po.taskTimeline.filterInProgress,
                  overdue: po.taskTimeline.filterOverdue,
                };
                return (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer',
                      taskFilter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            const now = Date.now();
            const filtered = tasks.filter((task: any) => {
              if (taskFilter === 'in_progress') return task.status === 'in_progress' || task.status === 'review';
              if (taskFilter === 'overdue') return task.dueDate && new Date(task.dueDate).getTime() < now && task.status !== 'done';
              return task.status !== 'done';
            });

            if (filtered.length === 0) {
              return (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">{po.taskTimeline.noTasks}</p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {filtered.map((task: any) => {
                  const daysLeft = task.dueDate
                    ? Math.ceil((new Date(task.dueDate).getTime() - now) / 86400000)
                    : null;
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  const isNear = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
                  const project = projects.find((p: any) => p.id === task.projectId || p._id === task.projectId);

                  const statusColor = task.status === 'review' ? 'text-primary' :
                    task.status === 'in_progress' ? 'text-warning' :
                    task.status === 'done' ? 'text-success' : 'text-muted-foreground';

                  const statusDot = task.status === 'review' ? 'bg-primary' :
                    task.status === 'in_progress' ? 'bg-warning' :
                    task.status === 'done' ? 'bg-success' : 'bg-muted-foreground';

                  return (
                    <div
                      key={task.id || task._id}
                      className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-border bg-card"
                    >
                      <span className={cn('h-2 w-2 rounded-full shrink-0', statusDot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task.title}</p>
                        <p className="text-[11px] text-muted-foreground">{project?.name ?? '...'}</p>
                      </div>
                      {!task.assignee && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                          {po.taskTimeline.unassigned}
                        </span>
                      )}
                      {daysLeft !== null && (
                        <span className={cn('text-[11px] shrink-0 font-medium tabular-nums', isOverdue ? 'text-destructive' : isNear ? 'text-warning' : statusColor)}>
                          {isOverdue
                            ? `${Math.abs(daysLeft)}${po.taskTimeline.overdueSuffix}`
                            : daysLeft === 0
                            ? po.taskTimeline.today
                            : `${po.taskTimeline.etaLabel} ${new Date(task.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ── Awaiting from Client ──────────────────────────────────── */}
      {pendingDecisionsCount > 0 && (
        <motion.div custom={5} variants={fadeInUp} initial="hidden" animate="visible">
          <div className="rounded-[16px] border border-warning/30 p-5 space-y-3 bg-warning/5">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-warning" />
              <p className="text-sm font-semibold text-warning">{po.awaitingClient.title}</p>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">{po.awaitingClient.subtitle}</p>
            <div className="space-y-2">
              {approvals.filter((a: any) => a.status === 'pending').map((a: any) => (
                <Link
                  key={a.id || a._id}
                  href={`/portal/${token}/deliverables`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-200 hover:bg-accent bg-card border border-border"
                >
                  <span className="text-sm text-foreground">
                    {po.awaitingClient.approvalItem.replace('{{name}}', a.name || a.title || 'deliverable')}
                  </span>
                  <ArrowRight size={13} className="text-warning shrink-0" />
                </Link>
              ))}
              {outstandingInvoices.map((inv: any) => (
                <Link
                  key={inv.id || inv._id}
                  href={`/portal/${token}/invoices`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-200 hover:bg-accent bg-card border border-border"
                >
                  <span className="text-sm text-foreground">
                    {po.awaitingClient.invoiceItem.replace('{{number}}', inv.number || inv.invoiceNumber || inv.id)}
                  </span>
                  <ArrowRight size={13} className="text-warning shrink-0" />
                </Link>
              ))}
              {(proposals || []).filter((p: any) => p.status === 'sent').map((prop: any) => (
                <Link
                  key={prop.id || prop._id}
                  href={`/portal/${token}/proposals`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-200 hover:bg-accent bg-card border border-border"
                >
                  <span className="text-sm text-foreground">
                    {po.awaitingClient.proposalItem.replace('{{title}}', prop.title || 'proposal')}
                  </span>
                  <ArrowRight size={13} className="text-warning shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active projects */}
      <motion.div custom={5} variants={fadeInUp} initial="hidden" animate="visible">
        <h2 className="text-sm font-semibold mb-4 text-foreground">{po.projects.title}</h2>
        <div className="space-y-3">
          {projects.filter((p: any) => p.status === 'active').map((project: any) => {
            const projectTasks = tasks.filter((t: any) => t.projectId === project._id);
            const totalTasks = projectTasks.length;
            const doneTasks = projectTasks.filter((t: any) => t.status === 'done').length;
            const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            return (
              <div
                key={project._id}
                className="rounded-[14px] border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {po.projects.due} {new Date(project.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-emerald-600" style={{ backgroundColor: 'rgba(5,150,105,0.10)' }}>
                    {pct}% {po.projects.done}
                  </span>
                </div>
                <ProgressBar value={doneTasks} max={totalTasks} />
                <p className="text-[11px] mt-2 text-muted-foreground">
                  {po.projects.tasksComplete
                    .replace('{{done}}', String(doneTasks))
                    .replace('{{total}}', String(totalTasks))}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Upcoming milestones */}
      {upcomingMilestones.length > 0 && (
        <motion.div custom={6} variants={fadeInUp} initial="hidden" animate="visible">
          <h2 className="text-sm font-semibold mb-4 text-foreground">{po.milestones.title}</h2>
          <div className="space-y-2">
            {upcomingMilestones.map((m: any) => {
              const project = projects.find((p: any) => p._id === m.projectId);
              const daysLeft = Math.ceil(
                (new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isOverdue  = daysLeft < 0;
              const isNear     = daysLeft >= 0 && daysLeft <= 7;
              return (
                <div
                  key={m._id}
                  className="flex items-center gap-4 px-4 py-3 rounded-[12px] border border-border bg-card"
                >
                  {isOverdue ? (
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                  ) : isNear ? (
                    <Clock size={14} className="text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-600 opacity-50 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{project?.name || '...'}</p>
                  </div>
                  <span className={`text-[10px] shrink-0 ${isOverdue ? 'text-red-500' : isNear ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {isOverdue
                      ? `${Math.abs(daysLeft)}${po.milestones.overdueSuffix}`
                      : daysLeft === 0
                      ? po.milestones.today
                      : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Announcements ─────────────────────────────────────────── */}
      {(() => {
        const announcements = messages.filter((m: any) => m.fromWorkspace).slice(-3).reverse();
        if (announcements.length === 0) return null;
        return (
          <motion.div custom={8} variants={fadeInUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" />
                {po.announcements.title}
              </h2>
              <Link
                href={`/portal/${token}/messages`}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                {po.announcements.seeAll}
                <ArrowRight size={10} />
              </Link>
            </div>
            <div className="space-y-3">
              {announcements.map((msg: any) => {
                const isNew = !msg.readAt;
                const days = Math.floor((Date.now() - new Date(msg.sentAt).getTime()) / 86400000);
                const dateStr = days === 0
                  ? (lang === 'fr' ? "Aujourd'hui" : 'Today')
                  : days === 1
                  ? (lang === 'fr' ? 'Hier' : 'Yesterday')
                  : new Date(msg.sentAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
                return (
                  <div
                    key={msg.id}
                    className="rounded-[14px] border border-border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-foreground">{msg.authorName}</span>
                        {isNew && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {t.portal.messages.newBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{dateStr}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Monthly Summary */}
      <motion.div custom={10} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="rounded-[16px] border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-amber-600" />
              <p className="text-sm font-semibold text-foreground">{po.summary.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {summary && (
                <button
                  onClick={() => generateSummary(true)}
                  disabled={summaryGenerating}
                  className="text-[11px] flex items-center gap-1 transition-opacity duration-200 hover:opacity-70 disabled:opacity-40 cursor-pointer text-muted-foreground"
                >
                  <RefreshCw size={10} className={summaryGenerating ? 'animate-spin' : ''} />
                  {po.summary.regenerate}
                </button>
              )}
            </div>
          </div>

          {!summary && !summaryGenerating && (
            <div>
              <p className="text-xs mb-3 text-muted-foreground">{po.summary.subtitle}</p>
              <button
                onClick={() => generateSummary(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-amber-600 border border-amber-200 dark:border-amber-800"
                style={{ backgroundColor: 'rgba(184,155,106,0.08)' }}
              >
                <Sparkles size={11} />
                {po.summary.generate}
              </button>
            </div>
          )}

          {summaryGenerating && !summary && (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-3 rounded-full animate-pulse bg-muted" style={{ width: i === 1 ? '100%' : '70%' }} />
              ))}
              <p className="text-[11px] mt-1 text-muted-foreground">{po.summary.generating}</p>
            </div>
          )}

          {summary && (
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
              {summaryDate && (
                <p className="text-[10px] mt-3 text-muted-foreground">
                  {po.summary.generatedOn} {new Date(summaryDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
