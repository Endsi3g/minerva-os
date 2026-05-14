'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
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

function ProgressBar({ value, max, color = '#7FA38A' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function PortalOverview() {
  const { t, lang } = useLang();
  const pc = t.portal.common;
  const po = t.portal.overview;

  const { token, isValid, clientName, projects, tasks, approvals, invoices, milestones } = usePortalData();

  if (!isValid) return null;

  const pendingApprovals = approvals.filter((a: any) => a.status === 'pending').length;
  const activeProjects   = projects.filter((p: any) => p.status === 'active').length;
  const outstandingTotal = invoices
    .filter((i: any) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum: any, i: any) => sum + i.amount, 0);

  const upcomingMilestones = milestones
    .filter((m: any) => m.status !== 'completed')
    .sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const stats = [
    { label: po.stats.activeProjects,    value: String(activeProjects),  sub: po.stats.activeProjectsSub, color: 'text-[#7FA38A]' },
    { label: po.stats.pendingApprovals,  value: String(pendingApprovals), sub: po.stats.pendingApprovalsSub, color: pendingApprovals > 0 ? 'text-[#B89B6A]' : 'text-[#7FA38A]' },
    { label: po.stats.outstanding,        value: outstandingTotal > 0 ? `$${outstandingTotal.toLocaleString()}` : '—', sub: po.stats.outstandingSub, color: outstandingTotal > 0 ? 'text-[#B89B6A]' : 'text-[#7FA38A]' },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: '#7FA38A', opacity: 0.7 }}>
          {pc.welcomeBack}
        </p>
        <h1
          className="text-3xl font-normal"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
        >
          {clientName}
        </h1>
        <p className="text-sm mt-2" style={{ color: '#8A9099' }}>
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
            className="rounded-[16px] p-5 border"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className={cn('text-3xl font-semibold tabular-nums mb-1', s.color)}>{s.value}</p>
            <p className="text-xs font-medium" style={{ color: '#F5F1E8' }}>{s.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Active projects */}
      <motion.div custom={4} variants={fadeInUp} initial="hidden" animate="visible">
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#F5F1E8' }}>{po.projects.title}</h2>
        <div className="space-y-3">
          {projects.filter((p: any) => p.status === 'active').map((project: any) => {
            const projectTasks = tasks.filter((t: any) => t.projectId === project._id);
            const totalTasks = projectTasks.length;
            const doneTasks = projectTasks.filter((t: any) => t.status === 'done').length;
            const pct = totalTasks > 0
              ? Math.round((doneTasks / totalTasks) * 100)
              : 0;
            return (
              <div
                key={project._id}
                className="rounded-[14px] border p-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>{project.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8A9099' }}>
                      {po.projects.due} {new Date(project.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(127,163,138,0.12)', color: '#7FA38A' }}
                  >
                    {pct}% {po.projects.done}
                  </span>
                </div>
                <ProgressBar value={doneTasks} max={totalTasks} />
                <p className="text-[11px] mt-2" style={{ color: '#8A9099' }}>
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
        <motion.div custom={5} variants={fadeInUp} initial="hidden" animate="visible">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F5F1E8' }}>{po.milestones.title}</h2>
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
                  className="flex items-center gap-4 px-4 py-3 rounded-[12px] border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  {isOverdue ? (
                    <AlertCircle size={14} style={{ color: '#A86A6A', flexShrink: 0 }} />
                  ) : isNear ? (
                    <Clock size={14} style={{ color: '#B89B6A', flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={14} style={{ color: '#7FA38A', opacity: 0.5, flexShrink: 0 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#F5F1E8' }}>{m.title}</p>
                    <p className="text-[11px]" style={{ color: '#8A9099' }}>{project?.name || '...'}</p>
                  </div>
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: isOverdue ? '#A86A6A' : isNear ? '#B89B6A' : '#8A9099' }}
                  >
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

      {/* Quick links */}
      {pendingApprovals > 0 && (
        <motion.div custom={6} variants={fadeInUp} initial="hidden" animate="visible">
          <Link
            href={`/portal/${token}/deliverables`}
            className="flex items-center justify-between px-5 py-4 rounded-[14px] border transition-all duration-200 hover:border-white/15"
            style={{
              backgroundColor: 'rgba(127,163,138,0.06)',
              borderColor: 'rgba(127,163,138,0.18)',
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>
                {po.approvals.alert.replace('{{count}}', String(pendingApprovals))}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#7FA38A' }}>{po.approvals.action}</p>
            </div>
            <ArrowRight size={16} style={{ color: '#7FA38A', flexShrink: 0 }} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
