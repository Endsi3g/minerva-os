import { useState } from 'react';
import { Check, RotateCcw, Palette, FileText, Video, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MOCK_APPROVALS } from '@/lib/mock-data';
import type { Approval, ApprovalStatus, DeliverableType } from '@/lib/types';

const TYPE_CONFIG: Record<DeliverableType, { label: string; icon: React.ElementType; class: string }> = {
  design:   { label: 'Design',   icon: Palette,  class: 'text-silver bg-silver/10' },
  copy:     { label: 'Copy',     icon: FileText, class: 'text-warm   bg-warm/10'   },
  video:    { label: 'Video',    icon: Video,    class: 'text-fog    bg-fog/10'     },
  document: { label: 'Document', icon: File,     class: 'text-mist   bg-mist/10'   },
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; class: string }> = {
  pending:  { label: 'Pending',           class: 'text-warm  bg-warm/10'  },
  approved: { label: 'Approved',          class: 'text-sage  bg-sage/10'  },
  revision: { label: 'Needs Revision',    class: 'text-ember bg-ember/10' },
};

const STATUS_ORDER: ApprovalStatus[] = ['pending', 'revision', 'approved'];

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);

  function updateStatus(id: string, status: ApprovalStatus) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const pending  = approvals.filter(a => a.status === 'pending').length;
  const approved = approvals.filter(a => a.status === 'approved').length;
  const revision = approvals.filter(a => a.status === 'revision').length;

  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: approvals.filter(a => a.status === status),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ivory">Approvals</h1>
        <p className="text-sm text-fog mt-0.5">{approvals.length} deliverables</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg">
        {[
          { label: 'Pending',        value: pending,  color: 'text-warm' },
          { label: 'Needs revision', value: revision, color: 'text-ember' },
          { label: 'Approved',       value: approved, color: 'text-sage' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn('text-2xl font-semibold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-fog mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grouped lists */}
      <div className="space-y-8">
        {grouped.map(({ status, items }) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full', cfg.class)}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-fog">{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map(approval => {
                  const type = TYPE_CONFIG[approval.type];
                  const TypeIcon = type.icon;
                  return (
                    <div
                      key={approval.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-card border border-border hover:border-white/12 transition-colors"
                    >
                      {/* Type icon */}
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', type.class.replace('text-', 'bg-').replace('/10', '/10'))}>
                        <TypeIcon size={14} className={type.class.split(' ')[0]} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ivory truncate">{approval.name}</p>
                        <p className="text-[11px] text-fog mt-0.5">
                          {approval.project} · {approval.client} · by {approval.submittedBy} on{' '}
                          {new Date(approval.submittedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span className={cn('hidden sm:block text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', type.class)}>
                        {type.label}
                      </span>

                      {/* Actions (only on pending) */}
                      {status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-sage hover:text-sage hover:bg-sage/10 border border-sage/20"
                            onClick={() => updateStatus(approval.id, 'approved')}
                          >
                            <Check size={12} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-ember hover:text-ember hover:bg-ember/10 border border-ember/20"
                            onClick={() => updateStatus(approval.id, 'revision')}
                          >
                            <RotateCcw size={12} />
                            Revise
                          </Button>
                        </div>
                      )}

                      {/* Re-open button on revision */}
                      {status === 'revision' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs text-fog hover:text-silver border border-border shrink-0"
                          onClick={() => updateStatus(approval.id, 'pending')}
                        >
                          Re-open
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
