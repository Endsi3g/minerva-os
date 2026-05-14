import { useState, useMemo } from 'react';
import { Check, RotateCcw, Palette, FileText, Video, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ApprovalStatus, DeliverableType } from '@/lib/types';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommentSection } from '@/components/minerva/CommentSection';
import { Id } from '../../../convex/_generated/dataModel';

export default function Approvals() {
  const { t, lang } = useLang();
  const a = t.app.approvals;
  const common = t.app.common;

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  // Real data from Convex
  const approvalsRaw = useQuery(api.approvals.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const projects = useQuery(api.projects.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const clients = useQuery(api.clients.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  
  const [selectedId, setSelectedId] = useState<any | null>(null);

  // Cast Convex documents to local types with joins
  const approvals = useMemo(() => approvalsRaw.map((app: any) => {
    const project = projects.find((p: any) => p._id === app.projectId);
    const client = clients.find((c: any) => c._id === app.clientId);
    return {
      id: app._id,
      name: app.name,
      project: project?.name || '...',
      client: client?.company || '...',
      status: app.status as ApprovalStatus,
      type: app.type as DeliverableType,
      submittedBy: 'Studio',
      submittedDate: app.submittedDate,
    };
  }), [approvalsRaw, projects, clients]);

  // Comments are handled inside CommentSection component now, but we'll clean up the legacy ones here
  const updateApproval = useMutation(api.approvals.update);

  const TYPE_CONFIG: Record<DeliverableType, { label: string; icon: React.ElementType; class: string }> = {
    design:   { label: common.types.design,   icon: Palette,  class: 'text-silver bg-silver/10' },
    copy:     { label: common.types.copy,     icon: FileText, class: 'text-warm   bg-warm/10'   },
    video:    { label: common.types.video,    icon: Video,    class: 'text-fog    bg-fog/10'     },
    document: { label: common.types.document, icon: File,     class: 'text-mist   bg-mist/10'   },
  };

  const STATUS_CONFIG: Record<ApprovalStatus, { label: string; class: string }> = {
    pending:  { label: a.summary.pending,  class: 'text-warm  bg-warm/10'  },
    approved: { label: a.summary.approved, class: 'text-sage  bg-sage/10'  },
    revision: { label: a.summary.revision, class: 'text-ember bg-ember/10' },
  };

  const STATUS_ORDER: ApprovalStatus[] = ['pending', 'revision', 'approved'];

  const pending  = approvals.filter((app: any) => app.status === 'pending').length;
  const approved = approvals.filter((app: any) => app.status === 'approved').length;
  const revision = approvals.filter((app: any) => app.status === 'revision').length;

  const grouped = useMemo(() => STATUS_ORDER.map(status => ({
    status,
    items: approvals.filter((app: any) => app.status === status),
  })).filter(g => g.items.length > 0), [approvals]);

  async function handleStatusChange(id: Id<"approvals">, status: ApprovalStatus) {
    await updateApproval({ id, status });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ivory">{a.title}</h1>
        <p className="text-sm text-fog mt-0.5">{approvals.length} {a.stats}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg">
        {[
          { label: a.summary.pending,  value: pending,  color: 'text-warm' },
          { label: a.summary.revision, value: revision, color: 'text-ember' },
          { label: a.summary.approved, value: approved, color: 'text-sage' },
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
                {items.map((approval: any) => {
                  const type = TYPE_CONFIG[approval.type as DeliverableType];
                  const TypeIcon = type.icon;
                  return (
                    <div
                      key={approval.id}
                      onClick={() => setSelectedId(approval.id)}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-card border border-border hover:border-white/12 transition-colors cursor-pointer"
                    >
                      {/* Type icon */}
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', type.class.replace('text-', 'bg-').replace('/10', '/10'))}>
                        <TypeIcon size={14} className={type.class.split(' ')[0]} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ivory truncate">{approval.name}</p>
                        <p className="text-[11px] text-fog mt-0.5">
                          {approval.project} · {approval.client} · {a.meta.by} {approval.submittedBy} {a.meta.on}{' '}
                          {new Date(approval.submittedDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
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
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleStatusChange(approval.id, 'approved');
                            }}
                          >
                            <Check size={12} />
                            {a.actions.approve}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-ember hover:text-ember hover:bg-ember/10 border border-ember/20"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleStatusChange(approval.id, 'revision');
                            }}
                          >
                            <RotateCcw size={12} />
                            {a.actions.revise}
                          </Button>
                        </div>
                      )}

                      {/* Re-open button on revision */}
                      {status === 'revision' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs text-fog hover:text-silver border border-border shrink-0"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleStatusChange(approval.id, 'pending');
                          }}
                        >
                          {a.actions.reopen}
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

      {/* Threaded Comments Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-[400px] bg-midnight border-white/5 flex flex-col p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-xl font-playfair text-ivory">Discussion Thread</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden p-6">
            {selectedId && <CommentSection targetId={selectedId} targetType="approval" />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
