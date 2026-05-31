import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, RotateCcw, Palette, FileText, Video, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ApprovalStatus, DeliverableType } from '@/lib/types';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommentSection } from '@/components/minerva/CommentSection';
import { ChoicePoll, VoteTally } from '@/components/ui/choice-poll';

export default function Approvals() {
  const { t, lang } = useLang();
  const a = t.app.approvals;
  const common = t.app.common;

  const [approvalsRaw, setApprovalsRaw] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      const [apprRes, projRes, clientRes] = await Promise.all([
        supabase.from('approvals').select('*').eq('workspace_id', wid),
        supabase.from('projects').select('id,name').eq('workspace_id', wid),
        supabase.from('clients').select('id,company').eq('workspace_id', wid),
      ]);
      setApprovalsRaw(apprRes.data ?? []);
      setProjects(projRes.data ?? []);
      setClients(clientRes.data ?? []);
    }
    load();
  }, []);

  async function handleStatusChange(id: string, status: ApprovalStatus) {
    setActingId(id);
    try {
      const { error } = await supabase.from('approvals').update({ status }).eq('id', id);
      if (error) throw error;
      setApprovalsRaw(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActingId(null);
    }
  }

  const approvals = approvalsRaw.map((app: any) => {
    const project = projects.find((p: any) => p.id === app.project_id);
    const client = clients.find((c: any) => c.id === app.client_id);
    return {
      id: app.id,
      name: app.name,
      project: project?.name || '...',
      client: client?.company || '...',
      status: app.status as ApprovalStatus,
      type: app.type as DeliverableType,
      submittedBy: 'Studio',
      submittedDate: app.submitted_date ?? app.created_at,
    };
  });

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

  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: approvals.filter((app: any) => app.status === status),
  })).filter(g => g.items.length > 0);




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
                            disabled={actingId === approval.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(approval.id, 'approved');
                            }}
                          >
                            {actingId === approval.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            {a.actions.approve}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-ember hover:text-ember hover:bg-ember/10 border border-ember/20"
                            disabled={actingId === approval.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(approval.id, 'revision');
                            }}
                          >
                            {actingId === approval.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
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
                          disabled={actingId === approval.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(approval.id, 'pending');
                          }}
                        >
                          {actingId === approval.id ? <Loader2 size={12} className="animate-spin" /> : null}
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

      {/* Threaded Comments & Tally Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px] bg-midnight border-white/5 flex flex-col p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b border-white/5 shrink-0">
            <SheetTitle className="text-xl font-playfair text-ivory">Review & Discussion</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 p-6 space-y-6">
            {selectedId && (
              <>
                {/* Client Committee Votes & Design Option Poll */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7FA38A]">
                    {t.app.approvals.poll.committeeTally}
                  </h4>
                  <VoteTally approvalId={selectedId} isAdmin={true} />
                  
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7FA38A] mb-3">
                      Design Option Poll
                    </h4>
                    <ChoicePoll approvalId={selectedId} isAdmin={true} />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-fog mb-3">
                    Discussion Thread
                  </h4>
                  <div className="overflow-hidden">
                    <CommentSection targetId={selectedId} targetType="approval" />
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
