'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, FileText, Video, File, Check, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { ApprovalStatus, DeliverableType } from '@/lib/types';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { CommentSection } from '@/components/minerva/CommentSection';
import { ChoicePoll } from '@/components/ui/choice-poll';

function DeliverableRow({
  approval,
  onAction,
  t,
  lang,
}: {
  approval: any;
  onAction: (id: string, status: ApprovalStatus) => void;
  t: any;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const pd = t.portal.deliverables;
  const common = t.app.common;

  const TYPE_CONFIG: Record<DeliverableType, { label: string; icon: React.ElementType; class: string }> = {
    design:   { label: common.types.design,   icon: Palette,  class: 'text-[#B8BDC7] bg-[#B8BDC7]/10' },
    copy:     { label: common.types.copy,     icon: FileText, class: 'text-[#B89B6A] bg-[#B89B6A]/10' },
    video:    { label: common.types.video,    icon: Video,    class: 'text-[#8A9099] bg-[#8A9099]/10'  },
    document: { label: common.types.document, icon: File,     class: 'text-[#D8DDE6] bg-[#D8DDE6]/10' },
  };

  const STATUS_LABEL: Record<ApprovalStatus, string> = {
    pending:  pd.status.pending,
    approved: pd.status.approved,
    revision: pd.status.revision,
  };

  const STATUS_COLOR: Record<ApprovalStatus, string> = {
    pending:  'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20',
    approved: 'text-[#7FA38A] bg-[#7FA38A]/10 border-[#7FA38A]/20',
    revision: 'text-[#A86A6A] bg-[#A86A6A]/10 border-[#A86A6A]/20',
  };

  const type = TYPE_CONFIG[approval.type as DeliverableType] || TYPE_CONFIG.document;
  const TypeIcon = type.icon;

  return (
    <motion.div
      layout
      className="rounded-[14px] border overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Type icon */}
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', type.class)}>
          <TypeIcon size={15} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#F5F1E8' }}>{approval.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>
            {approval.project} · {pd.submitted} {new Date(approval.submittedDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn('hidden sm:block text-[10px] font-medium px-2 py-1 rounded-full border shrink-0', STATUS_COLOR[approval.status as ApprovalStatus])}>
          {STATUS_LABEL[approval.status as ApprovalStatus]}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {approval.status === 'pending' && (
            <button
              onClick={() => onAction(approval._id, 'approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'rgba(127,163,138,0.12)',
                border: '1px solid rgba(127,163,138,0.25)',
                color: '#7FA38A',
              }}
            >
              <Check size={12} />
              {pd.actions.approve}
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#B8BDC7',
            }}
          >
            <MessageSquare size={12} />
            {pd.actions.discuss || 'Discussion'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Comment & Poll panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 500, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="h-full p-5 flex flex-col overflow-y-auto md:overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
                {/* Poll Section */}
                <div className="flex flex-col justify-start">
                  <ChoicePoll approvalId={approval._id} isAdmin={false} />
                </div>
                {/* Discussion Section */}
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium uppercase tracking-widest text-fog">Feedback & Discussion</p>
                    {approval.status === 'pending' && (
                      <button
                        onClick={() => { onAction(approval._id, 'revision'); }}
                        className="text-[10px] font-semibold text-ember hover:underline"
                      >
                        {pd.form.submitRequest}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CommentSection targetId={approval._id} targetType="approval" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PortalDeliverables() {
  const { t, lang } = useLang();
  const pd = t.portal.deliverables;

  const { isValid, approvals, projects } = usePortalData();
  const [localApprovals, setLocalApprovals] = useState<any[]>([]);

  useEffect(() => {
    if (approvals) {
      setLocalApprovals(approvals);
    }
  }, [approvals]);

  if (!isValid) return null;

  // Join project names
  const deliverables = localApprovals.map((app: any) => {
    const project = projects.find((p: any) => p._id === app.projectId);
    return { ...app, project: project?.name || '...' };
  });

  async function handleAction(id: string, status: ApprovalStatus) {
    const { error } = await supabase
      .from('approvals')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setLocalApprovals(prev =>
        prev.map(a => a._id === id ? { ...a, status } : a)
      );
    }
  }

  const pending  = deliverables.filter((a: any) => a.status === 'pending');
  const resolved = deliverables.filter((a: any) => a.status !== 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-normal"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
        >
          {pd.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>
          {pd.subtitle}
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#B89B6A' }}>
            {pd.pendingTitle} · {pending.length}
          </p>
          <div className="space-y-2">
            {pending.map((a: any) => (
              <DeliverableRow key={a._id} approval={a} onAction={handleAction} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <div
          className="rounded-[16px] border p-10 text-center"
          style={{ backgroundColor: 'rgba(127,163,138,0.04)', borderColor: 'rgba(127,163,138,0.15)' }}
        >
          <Check size={24} className="mx-auto mb-3" style={{ color: '#7FA38A', opacity: 0.6 }} />
          <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>{pd.empty.title}</p>
          <p className="text-xs mt-1" style={{ color: '#8A9099' }}>{pd.empty.desc}</p>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9099' }}>
            {pd.resolvedTitle} · {resolved.length}
          </p>
          <div className="space-y-2">
            {resolved.map((a: any) => (
              <DeliverableRow key={a._id} approval={a} onAction={handleAction} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
