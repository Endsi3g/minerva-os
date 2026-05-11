import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, FileText, Video, File, Check, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { Approval, ApprovalStatus, DeliverableType } from '@/lib/types';

const TYPE_CONFIG: Record<DeliverableType, { label: string; icon: React.ElementType; class: string }> = {
  design:   { label: 'Design',   icon: Palette,  class: 'text-[#B8BDC7] bg-[#B8BDC7]/10' },
  copy:     { label: 'Copy',     icon: FileText, class: 'text-[#B89B6A] bg-[#B89B6A]/10' },
  video:    { label: 'Video',    icon: Video,    class: 'text-[#8A9099] bg-[#8A9099]/10'  },
  document: { label: 'Document', icon: File,     class: 'text-[#D8DDE6] bg-[#D8DDE6]/10' },
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending:  'Awaiting Review',
  approved: 'Approved',
  revision: 'Changes Requested',
};

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending:  'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20',
  approved: 'text-[#7FA38A] bg-[#7FA38A]/10 border-[#7FA38A]/20',
  revision: 'text-[#A86A6A] bg-[#A86A6A]/10 border-[#A86A6A]/20',
};

function DeliverableRow({
  approval,
  onAction,
}: {
  approval: Approval;
  onAction: (id: string, status: ApprovalStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment]   = useState('');
  const type = TYPE_CONFIG[approval.type];
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
            {approval.project} · submitted {new Date(approval.submittedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn('hidden sm:block text-[10px] font-medium px-2 py-1 rounded-full border shrink-0', STATUS_COLOR[approval.status])}>
          {STATUS_LABEL[approval.status]}
        </span>

        {/* Actions */}
        {approval.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAction(approval.id, 'approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'rgba(127,163,138,0.12)',
                border: '1px solid rgba(127,163,138,0.25)',
                color: '#7FA38A',
              }}
            >
              <Check size={12} />
              Approve
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'rgba(168,106,106,0.10)',
                border: '1px solid rgba(168,106,106,0.22)',
                color: '#A86A6A',
              }}
            >
              <MessageSquare size={12} />
              Request changes
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        )}

        {approval.status === 'approved' && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Check size={13} style={{ color: '#7FA38A' }} />
            <span className="text-xs" style={{ color: '#7FA38A' }}>Approved</span>
          </div>
        )}
      </div>

      {/* Comment panel */}
      <AnimatePresence>
        {expanded && approval.status === 'pending' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-4 pt-1"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-xs mb-2" style={{ color: '#8A9099' }}>
                Leave a note for the team (optional):
              </p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe what needs to change..."
                rows={3}
                className="w-full resize-none text-sm outline-none rounded-xl px-4 py-3 transition-colors duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F5F1E8',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => { onAction(approval.id, 'revision'); setExpanded(false); setComment(''); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'rgba(168,106,106,0.15)',
                    border: '1px solid rgba(168,106,106,0.25)',
                    color: '#A86A6A',
                  }}
                >
                  Submit changes request
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PortalDeliverables() {
  const { isValid, approvals: initialApprovals } = usePortalData();
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);

  if (!isValid) return <Navigate to="/" replace />;

  function handleAction(id: string, status: ApprovalStatus) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const pending  = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-normal"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
        >
          Deliverables
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>
          Review and approve work submitted by Uprising Studio.
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#B89B6A' }}>
            Awaiting review · {pending.length}
          </p>
          <div className="space-y-2">
            {pending.map(a => (
              <DeliverableRow key={a.id} approval={a} onAction={handleAction} />
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
          <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>All caught up</p>
          <p className="text-xs mt-1" style={{ color: '#8A9099' }}>No deliverables pending review at this time.</p>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9099' }}>
            Previously resolved · {resolved.length}
          </p>
          <div className="space-y-2">
            {resolved.map(a => (
              <DeliverableRow key={a.id} approval={a} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
