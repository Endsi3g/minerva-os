'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Play, Pause, Trash2, Edit2,
  CheckCircle2, AlertTriangle, ChevronRight,
  ChevronDown, ChevronUp, X, Check, XCircle, Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextAnimate } from '@/components/ui/text-animate';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWorkspaces,
  useWorkflows,
  useWorkflowRuns,
  useHandoffs,
  useSLAPolicies,
  useAddWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useUpdateHandoff,
  useAddSLAPolicy,
  useDeleteSLAPolicy,
} from '@/lib/hooks/useSupabase';
import { useLang } from '@/i18n';
import type { Workflow, WorkflowStep, WorkflowTriggerEvent, WorkflowStepType, Handoff, SLAPolicy } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type BuilderStep = {
  id: string;
  stepType: WorkflowStepType;
  config: Record<string, unknown>;
};

type BuilderState = {
  name: string;
  triggerEvent: WorkflowTriggerEvent;
  conditions: Array<{ id: string; field: string; operator: string; value: string }>;
  steps: BuilderStep[];
};

const DEFAULT_BUILDER: BuilderState = {
  name: '',
  triggerEvent: 'manual',
  conditions: [],
  steps: [],
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WorkflowSkeleton() {
  return (
    <div className="space-y-8 w-full animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-9 w-36 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );
}

// ─── Workflow Builder Sheet ────────────────────────────────────────────────────

function WorkflowBuilderSheet({
  open,
  onClose,
  initial,
  onSave,
  wf,
}: {
  open: boolean;
  onClose: () => void;
  initial?: BuilderState;
  onSave: (state: BuilderState, workflowId?: string) => Promise<void>;
  wf?: Workflow;
}) {
  const { t } = useLang();
  const b = t.app.workflows.builder;
  const [state, setState] = useState<BuilderState>(initial ?? DEFAULT_BUILDER);
  const [saving, setSaving] = useState(false);

  const [triggerOpen, setTriggerOpen] = useState(true);
  const [condOpen, setCondOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(true);

  function addCondition() {
    setState(s => ({
      ...s,
      conditions: [...s.conditions, { id: crypto.randomUUID(), field: 'project.budget', operator: 'greater_than', value: '' }],
    }));
  }

  function removeCondition(id: string) {
    setState(s => ({ ...s, conditions: s.conditions.filter(c => c.id !== id) }));
  }

  function addStep() {
    setState(s => ({
      ...s,
      steps: [...s.steps, { id: crypto.randomUUID(), stepType: 'send_notification', config: {} }],
    }));
  }

  function removeStep(id: string) {
    setState(s => ({ ...s, steps: s.steps.filter(st => st.id !== id) }));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setState(s => {
      const idx = s.steps.findIndex(st => st.id === id);
      if (idx < 0) return s;
      const next = idx + dir;
      if (next < 0 || next >= s.steps.length) return s;
      const steps = [...s.steps];
      [steps[idx], steps[next]] = [steps[next], steps[idx]];
      return { ...s, steps };
    });
  }

  async function handleSave() {
    if (!state.name.trim()) return;
    setSaving(true);
    try {
      await onSave(state, wf?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const triggerEvents: WorkflowTriggerEvent[] = [
    'proposal_signed', 'project_created', 'project_status_changed',
    'task_overdue', 'approval_overdue', 'invoice_overdue',
    'scope_change_detected', 'ticket_sla_breached', 'manual',
  ];

  const stepTypes: WorkflowStepType[] = [
    'create_task', 'send_notification', 'assign_to', 'escalate',
    'delay', 'create_handoff', 'set_sla', 'validate_required_fields',
    'update_status', 'condition',
  ];

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] bg-midnight border-white/10 overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-white/5">
          <SheetTitle className="text-ivory font-serif text-xl">{wf ? 'Edit workflow' : b.save}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-fog text-xs uppercase tracking-wider">Workflow name</Label>
            <Input
              value={state.name}
              onChange={e => setState(s => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Proposal Signed Kickoff"
              className="bg-obsidian border-white/8 text-ivory"
            />
          </div>

          {/* Trigger */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ivory bg-dusk/40 hover:bg-dusk/60 transition-colors"
              onClick={() => setTriggerOpen(v => !v)}
            >
              <span>{b.triggerSection}</span>
              {triggerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {triggerOpen && (
                <motion.div
                  initial={{ translateY: -8, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  exit={{ translateY: -8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 pt-3 space-y-3"
                >
                  <Select
                    value={state.triggerEvent}
                    onValueChange={v => setState(s => ({ ...s, triggerEvent: v as WorkflowTriggerEvent }))}
                  >
                    <SelectTrigger className="bg-obsidian border-white/8 text-ivory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-midnight border-white/10">
                      {triggerEvents.map(ev => (
                        <SelectItem key={ev} value={ev} className="text-silver hover:text-ivory">
                          {(b.triggerEvents as Record<string, string>)[ev] ?? ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.triggerEvent === 'project_status_changed' && (
                    <Select onValueChange={v => setState(s => ({ ...s, triggerFilters: { status: v } } as any))}>
                      <SelectTrigger className="bg-obsidian border-white/8 text-ivory">
                        <SelectValue placeholder="Target status" />
                      </SelectTrigger>
                      <SelectContent className="bg-midnight border-white/10">
                        {['active', 'on_hold', 'completed'].map(st => (
                          <SelectItem key={st} value={st} className="text-silver">{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {state.triggerEvent === 'task_overdue' && (
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="24" className="bg-obsidian border-white/8 text-ivory w-24" />
                      <span className="text-fog text-sm">hours threshold</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Conditions */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ivory bg-dusk/40 hover:bg-dusk/60 transition-colors"
              onClick={() => setCondOpen(v => !v)}
            >
              <span>{b.conditionSection}</span>
              {condOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {condOpen && (
                <motion.div
                  initial={{ translateY: -8, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  exit={{ translateY: -8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 pt-3 space-y-3"
                >
                  {state.conditions.map(cond => (
                    <div key={cond.id} className="flex items-center gap-2">
                      <Select value={cond.field} onValueChange={v => setState(s => ({ ...s, conditions: s.conditions.map(c => c.id === cond.id ? { ...c, field: v } : c) }))}>
                        <SelectTrigger className="bg-obsidian border-white/8 text-ivory flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-midnight border-white/10">
                          {['project.budget', 'project.type', 'deal.stage', 'client.status', 'task.priority'].map(f => (
                            <SelectItem key={f} value={f} className="text-silver">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={cond.operator} onValueChange={v => setState(s => ({ ...s, conditions: s.conditions.map(c => c.id === cond.id ? { ...c, operator: v } : c) }))}>
                        <SelectTrigger className="bg-obsidian border-white/8 text-ivory w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-midnight border-white/10">
                          {['equals', 'not_equals', 'greater_than', 'less_than', 'contains'].map(op => (
                            <SelectItem key={op} value={op} className="text-silver">{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input value={cond.value} onChange={e => setState(s => ({ ...s, conditions: s.conditions.map(c => c.id === cond.id ? { ...c, value: e.target.value } : c) }))} placeholder="value" className="bg-obsidian border-white/8 text-ivory w-24" />
                      <button onClick={() => removeCondition(cond.id)} className="text-fog hover:text-ember transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addCondition} className="border-white/10 text-fog hover:text-ivory rounded-lg">
                    <Plus size={12} className="mr-1" /> {b.addCondition}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ivory bg-dusk/40 hover:bg-dusk/60 transition-colors"
              onClick={() => setStepsOpen(v => !v)}
            >
              <span>{b.actionSection}</span>
              {stepsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {stepsOpen && (
                <motion.div
                  initial={{ translateY: -8, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  exit={{ translateY: -8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 pt-3 space-y-3"
                >
                  {state.steps.map((step, idx) => (
                    <div key={step.id} className="bg-obsidian/60 rounded-lg p-3 space-y-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-fog w-4">{idx + 1}</span>
                        <Select value={step.stepType} onValueChange={v => setState(s => ({ ...s, steps: s.steps.map(st => st.id === step.id ? { ...st, stepType: v as WorkflowStepType, config: {} } : st) }))}>
                          <SelectTrigger className="bg-midnight border-white/8 text-ivory flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-midnight border-white/10">
                            {stepTypes.map(type => (
                              <SelectItem key={type} value={type} className="text-silver">{(b.stepTypes as Record<string, string>)[type] ?? type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button onClick={() => moveStep(step.id, -1)} disabled={idx === 0} className="text-fog hover:text-ivory disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => moveStep(step.id, 1)} disabled={idx === state.steps.length - 1} className="text-fog hover:text-ivory disabled:opacity-30"><ChevronDown size={14} /></button>
                        <button onClick={() => removeStep(step.id)} className="text-fog hover:text-ember"><X size={14} /></button>
                      </div>
                      <StepConfigFields step={step} onChange={cfg => setState(s => ({ ...s, steps: s.steps.map(st => st.id === step.id ? { ...st, config: cfg } : st) }))} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addStep} className="border-white/10 text-fog hover:text-ivory rounded-lg">
                    <Plus size={12} className="mr-1" /> {b.addStep}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-fog">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !state.name.trim()} className="bg-ivory text-obsidian hover:bg-ivory/90 rounded-lg">
            {saving ? 'Saving...' : b.save}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepConfigFields({ step, onChange }: { step: BuilderStep; onChange: (cfg: Record<string, unknown>) => void }) {
  const cfg = step.config;
  function set(key: string, val: unknown) { onChange({ ...cfg, [key]: val }); }

  const roleOptions = ['owner', 'project_manager', 'strategist', 'designer', 'developer', 'finance'];

  switch (step.stepType) {
    case 'create_task':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input value={String(cfg.title ?? '')} onChange={e => set('title', e.target.value)} placeholder="Title ({{project.name}})" className="bg-midnight border-white/8 text-ivory col-span-2 text-xs" />
          <Select value={String(cfg.assigneeRole ?? '')} onValueChange={v => set('assigneeRole', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="Assignee role" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{roleOptions.map(r => <SelectItem key={r} value={r} className="text-silver text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={String(cfg.dueDays ?? '')} onChange={e => set('dueDays', e.target.value)} placeholder="Due in X days" className="bg-midnight border-white/8 text-ivory text-xs" />
          <Select value={String(cfg.priority ?? '')} onValueChange={v => set('priority', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="text-silver text-xs">{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    case 'send_notification':
      return (
        <div className="space-y-2">
          <Select value={String(cfg.role ?? '')} onValueChange={v => set('role', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="Recipient role" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{roleOptions.map(r => <SelectItem key={r} value={r} className="text-silver text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={String(cfg.message ?? '')} onChange={e => set('message', e.target.value)} placeholder="Message ({{project.name}})" className="bg-midnight border-white/8 text-ivory text-xs min-h-[60px]" />
          <Select value={String(cfg.severity ?? 'info')} onValueChange={v => set('severity', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['info', 'warning', 'high', 'escalation'].map(s => <SelectItem key={s} value={s} className="text-silver text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-[10px] text-fog">Email sent automatically for high / escalation severity</p>
        </div>
      );
    case 'escalate':
      return (
        <div className="space-y-2">
          <Select value={String(cfg.role ?? 'owner')} onValueChange={v => set('role', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{roleOptions.map(r => <SelectItem key={r} value={r} className="text-silver text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={String(cfg.reason ?? '')} onChange={e => set('reason', e.target.value)} placeholder="Reason" className="bg-midnight border-white/8 text-ivory text-xs min-h-[60px]" />
        </div>
      );
    case 'delay':
      return (
        <div className="flex items-center gap-2">
          <Input type="number" value={String(cfg.minutes ?? '')} onChange={e => set('minutes', e.target.value)} placeholder="Minutes" className="bg-midnight border-white/8 text-ivory text-xs w-28" />
          <span className="text-fog text-xs">minutes</span>
        </div>
      );
    case 'create_handoff':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(cfg.fromStage ?? '')} onValueChange={v => set('fromStage', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="From stage" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['sales', 'pm', 'production', 'finance'].map(s => <SelectItem key={s} value={s} className="text-silver text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(cfg.toStage ?? '')} onValueChange={v => set('toStage', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="To stage" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['sales', 'pm', 'production', 'finance'].map(s => <SelectItem key={s} value={s} className="text-silver text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={String(cfg.requiredFields ?? '')} onChange={e => set('requiredFields', e.target.value.split(',').map(f => f.trim()))} placeholder="Required fields (comma-separated)" className="bg-midnight border-white/8 text-ivory text-xs col-span-2" />
        </div>
      );
    case 'set_sla':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(cfg.entity ?? 'approval')} onValueChange={v => set('entity', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['approval', 'ticket'].map(e => <SelectItem key={e} value={e} className="text-silver text-xs">{e}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={String(cfg.responseHours ?? '')} onChange={e => set('responseHours', e.target.value)} placeholder="Response hours" className="bg-midnight border-white/8 text-ivory text-xs" />
        </div>
      );
    case 'update_status':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(cfg.entity ?? 'project')} onValueChange={v => set('entity', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['project', 'task', 'approval', 'invoice'].map(e => <SelectItem key={e} value={e} className="text-silver text-xs">{e}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={String(cfg.status ?? '')} onChange={e => set('status', e.target.value)} placeholder="New status" className="bg-midnight border-white/8 text-ivory text-xs" />
        </div>
      );
    case 'assign_to':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(cfg.role ?? '')} onValueChange={v => set('role', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{roleOptions.map(r => <SelectItem key={r} value={r} className="text-silver text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(cfg.entity ?? 'task')} onValueChange={v => set('entity', v)}>
            <SelectTrigger className="bg-midnight border-white/8 text-ivory text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-midnight border-white/10">{['task', 'approval', 'ticket'].map(e => <SelectItem key={e} value={e} className="text-silver text-xs">{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    case 'validate_required_fields':
      return (
        <Input value={String(cfg.fields ?? '')} onChange={e => set('fields', e.target.value.split(',').map(f => f.trim()))} placeholder="Fields to validate (comma-separated)" className="bg-midnight border-white/8 text-ivory text-xs" />
      );
    default:
      return null;
  }
}

// ─── Workflow List ─────────────────────────────────────────────────────────────

function WorkflowList({ workspaceId }: { workspaceId: string }) {
  const { t } = useLang();
  const wf = t.app.workflows;
  const workflows = useWorkflows(workspaceId);
  const runs = useWorkflowRuns(workspaceId, 20);
  const addWorkflow = useAddWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const todayRuns = (runs ?? []).filter(r => r.startedAt?.startsWith(new Date().toISOString().split('T')[0]));

  const handleSave = useCallback(async (state: BuilderState, workflowId?: string) => {
    const steps: Omit<WorkflowStep, 'id' | 'workflowId'>[] = state.steps.map((s, i) => ({
      stepOrder: i + 1,
      stepType: s.stepType,
      config: s.config,
    }));

    if (workflowId) {
      await updateWorkflow({ id: workflowId, name: state.name, isActive: true, steps });
    } else {
      await addWorkflow({
        workspaceId,
        name: state.name,
        triggerEvent: state.triggerEvent,
        triggerFilters: {},
        steps,
      });
    }
  }, [workspaceId, addWorkflow, updateWorkflow]);

  const statusColors: Record<string, string> = {
    running: 'bg-sage/20 text-sage border-sage/30',
    completed: 'bg-white/5 text-fog border-white/10',
    failed: 'bg-ember/20 text-ember border-ember/30',
    paused: 'bg-amber/20 text-amber border-amber/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fog">
          {(wf.subtitle as string)
            .replace('{{count}}', String(workflows?.length ?? 0))
            .replace('{{runs}}', String(todayRuns.length))}
        </p>
        <Button onClick={() => { setEditing(null); setBuilderOpen(true); }} className="rounded-full bg-ivory text-obsidian hover:bg-ivory/90 text-sm">
          <Plus size={14} className="mr-2" /> {wf.newWorkflow}
        </Button>
      </div>

      {workflows === null ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />)}</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16 text-fog text-sm">No workflows yet. Create your first one.</div>
      ) : (
        <div className="space-y-3">
          {workflows.map(workflow => {
            const wfRuns = (runs ?? []).filter(r => r.workflowId === workflow.id);
            const lastRun = wfRuns[0];
            return (
              <div key={workflow.id} className="bg-midnight rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-ivory truncate">{workflow.name}</span>
                      {workflow.isTemplate && <Badge className="text-[10px] bg-amber/15 text-amber border-amber/20">Built-in</Badge>}
                      <Badge className={cn('text-[10px] border', workflow.isActive ? 'bg-sage/15 text-sage border-sage/20' : 'bg-white/5 text-fog border-white/10')}>
                        {workflow.isActive ? wf.status.active : wf.status.inactive}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-fog">
                      <span>{workflow.triggerEvent.replace(/_/g, ' ')}</span>
                      {lastRun && (
                        <>
                          <span>·</span>
                          <span className={cn('inline-flex items-center gap-1', statusColors[lastRun.status])}>
                            {lastRun.status === 'completed' && <CheckCircle2 size={10} />}
                            {lastRun.status === 'running' && <Play size={10} />}
                            {lastRun.status === 'paused' && <Pause size={10} />}
                            {lastRun.status === 'failed' && <AlertTriangle size={10} />}
                            {lastRun.status}
                          </span>
                          <span>·</span>
                          <span>{wf.runs} {wfRuns.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateWorkflow({ id: workflow.id, isActive: !workflow.isActive })}
                      className={cn('p-2 rounded-lg transition-colors', workflow.isActive ? 'text-sage hover:bg-sage/10' : 'text-fog hover:bg-white/5')}
                      title={workflow.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {workflow.isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => { setEditing(workflow); setBuilderOpen(true); }}
                      className="p-2 rounded-lg text-fog hover:text-ivory hover:bg-white/5 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    {deleteConfirm === workflow.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { deleteWorkflow(workflow.id); setDeleteConfirm(null); }} className="p-1.5 rounded text-ember hover:bg-ember/10"><Check size={13} /></button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded text-fog hover:bg-white/5"><X size={13} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(workflow.id)}
                        className="p-2 rounded-lg text-fog hover:text-ember hover:bg-ember/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WorkflowBuilderSheet
        open={builderOpen}
        onClose={() => { setBuilderOpen(false); setEditing(null); }}
        wf={editing ?? undefined}
        initial={editing ? {
          name: editing.name,
          triggerEvent: editing.triggerEvent as WorkflowTriggerEvent,
          conditions: [],
          steps: (editing.steps ?? []).map(s => ({ id: s.id, stepType: s.stepType, config: s.config as Record<string, unknown> })),
        } : undefined}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Template Gallery ──────────────────────────────────────────────────────────

function TemplateGallery({ workspaceId }: { workspaceId: string }) {
  const { t } = useLang();
  const tmpl = t.app.workflows.templates;
  const workflows = useWorkflows(workspaceId);
  const addWorkflow = useAddWorkflow();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [templateState, setTemplateState] = useState<BuilderState | null>(null);

  const templates = (workflows ?? []).filter(w => w.isTemplate);
  const custom = (workflows ?? []).filter(w => !w.isTemplate);

  function useTemplate(wf: Workflow) {
    setTemplateState({
      name: `${wf.name} (copy)`,
      triggerEvent: wf.triggerEvent as WorkflowTriggerEvent,
      conditions: [],
      steps: (wf.steps ?? []).map(s => ({ id: crypto.randomUUID(), stepType: s.stepType, config: s.config as Record<string, unknown> })),
    });
    setBuilderOpen(true);
  }

  const handleSave = useCallback(async (state: BuilderState) => {
    await addWorkflow({
      workspaceId,
      name: state.name,
      triggerEvent: state.triggerEvent,
      triggerFilters: {},
      steps: state.steps.map((s, i) => ({ stepOrder: i + 1, stepType: s.stepType, config: s.config })),
    });
  }, [workspaceId, addWorkflow]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-fog mb-4">{tmpl.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(wf => (
            <div key={wf.id} className="bg-midnight rounded-xl border border-white/5 p-5 flex flex-col gap-3 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-ivory leading-snug">{wf.name}</span>
                <Badge className="text-[10px] bg-amber/15 text-amber border border-amber/20 shrink-0">{tmpl.builtIn}</Badge>
              </div>
              <p className="text-[11px] text-fog flex-1">{wf.triggerEvent.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-fog">{(wf.steps ?? []).length} steps</p>
              <Button size="sm" variant="outline" onClick={() => useTemplate(wf)} className="border-white/10 text-fog hover:text-ivory hover:border-white/20 rounded-lg w-full text-xs">
                {tmpl.useTemplate}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {custom.length > 0 && (
        <div>
          <p className="text-xs text-fog uppercase tracking-wider mb-3">{tmpl.custom}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {custom.map(wf => (
              <div key={wf.id} className="bg-midnight rounded-xl border border-white/5 p-5 flex flex-col gap-3 hover:border-white/10 transition-colors">
                <span className="text-sm font-medium text-ivory">{wf.name}</span>
                <p className="text-[11px] text-fog">{wf.triggerEvent.replace(/_/g, ' ')}</p>
                <Button size="sm" variant="outline" onClick={() => useTemplate(wf)} className="border-white/10 text-fog hover:text-ivory rounded-lg w-full text-xs">
                  {tmpl.useTemplate}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <WorkflowBuilderSheet
        open={builderOpen}
        onClose={() => { setBuilderOpen(false); setTemplateState(null); }}
        initial={templateState ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Handoff Board ────────────────────────────────────────────────────────────

function HandoffBoard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLang();
  const hf = t.app.workflows.handoffs;
  const handoffs = useHandoffs(workspaceId);
  const updateHandoff = useUpdateHandoff();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const stageColor: Record<string, string> = {
    sales: 'text-amber',
    pm: 'text-sage',
    production: 'text-ivory',
    finance: 'text-warm',
  };

  const statusBadge: Record<string, string> = {
    pending: 'bg-amber/15 text-amber border-amber/20',
    validated: 'bg-sage/15 text-sage border-sage/20',
    rejected: 'bg-ember/15 text-ember border-ember/20',
  };

  if (!handoffs) {
    return <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {handoffs.length === 0 ? (
        <div className="text-center py-16 text-fog text-sm">{hf.title} — no pending handoffs.</div>
      ) : (
        handoffs.map((h: Handoff) => {
          const satisfied = h.requiredFields.filter(f => f.satisfied).length;
          const total = h.requiredFields.length;
          return (
            <div key={h.id} className="bg-midnight rounded-xl border border-white/5 p-5 space-y-4 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn('font-medium', stageColor[h.fromStage])}>{(hf.stage as Record<string,string>)[h.fromStage]}</span>
                  <ChevronRight size={14} className="text-fog" />
                  <span className={cn('font-medium', stageColor[h.toStage])}>{(hf.stage as Record<string,string>)[h.toStage]}</span>
                </div>
                <Badge className={cn('text-[10px] border', statusBadge[h.status])}>
                  {(hf.status as Record<string,string>)[h.status]}
                </Badge>
              </div>

              {h.requiredFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-fog">
                    {(hf.fieldsSatisfied as string).replace('{{count}}', String(satisfied)).replace('{{total}}', String(total))}
                  </p>
                  <div className="space-y-1.5">
                    {h.requiredFields.map(f => (
                      <div key={f.field} className="flex items-center gap-2 text-xs">
                        {f.satisfied ? (
                          <CheckCircle2 size={12} className="text-sage shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-sm border border-white/20 shrink-0" />
                        )}
                        <span className={f.satisfied ? 'text-fog line-through' : 'text-silver'}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {h.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => updateHandoff({ id: h.id, status: 'validated' })} className="bg-sage text-obsidian hover:bg-sage/90 rounded-lg text-xs">
                    <Check size={12} className="mr-1" /> {hf.signOff}
                  </Button>
                  {rejectingId === h.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Reason for rejection" className="bg-obsidian border-white/8 text-ivory text-xs h-8 flex-1" />
                      <button onClick={() => { updateHandoff({ id: h.id, status: 'rejected', notes: rejectNotes }); setRejectingId(null); setRejectNotes(''); }} className="p-1.5 rounded text-ember hover:bg-ember/10"><Check size={12} /></button>
                      <button onClick={() => setRejectingId(null)} className="p-1.5 rounded text-fog hover:bg-white/5"><X size={12} /></button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(h.id)} className="border-white/10 text-fog hover:text-ember hover:border-ember/30 rounded-lg text-xs">
                      <XCircle size={12} className="mr-1" /> {hf.reject}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── SLA Policy Manager ────────────────────────────────────────────────────────

function SLAPolicyManager({ workspaceId }: { workspaceId: string }) {
  const { t } = useLang();
  const sla = t.app.workflows.sla;
  const policies = useSLAPolicies(workspaceId);
  const addSLA = useAddSLAPolicy();
  const deleteSLA = useDeleteSLAPolicy();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', priority: 'medium', responseTime: '', resolutionTime: '' });

  async function handleAdd() {
    if (!form.name || !form.responseTime || !form.resolutionTime) return;
    await addSLA({
      workspaceId,
      name: form.name,
      priority: form.priority,
      responseTime: parseInt(form.responseTime),
      resolutionTime: parseInt(form.resolutionTime),
    });
    setForm({ name: '', priority: 'medium', responseTime: '', resolutionTime: '' });
    setFormOpen(false);
  }

  const priorityColors: Record<string, string> = {
    low: 'text-fog',
    medium: 'text-silver',
    high: 'text-amber',
    urgent: 'text-ember',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fog">{sla.title}</p>
        <Button size="sm" onClick={() => setFormOpen(v => !v)} className="rounded-full bg-ivory text-obsidian hover:bg-ivory/90 text-xs">
          <Plus size={12} className="mr-1.5" /> {sla.addPolicy}
        </Button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ translateY: -8, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -8, opacity: 0 }}
            className="bg-midnight rounded-xl border border-white/10 p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-fog text-xs">{sla.form.name}</Label>
                <Input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Premium Client SLA" className="bg-obsidian border-white/8 text-ivory" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-fog text-xs">{sla.form.priority}</Label>
                <Select value={form.priority} onValueChange={v => setForm(s => ({ ...s, priority: v }))}>
                  <SelectTrigger className="bg-obsidian border-white/8 text-ivory"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-midnight border-white/10">
                    {['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="text-silver">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-fog text-xs">{sla.responseTime} (min)</Label>
                <Input type="number" value={form.responseTime} onChange={e => setForm(s => ({ ...s, responseTime: e.target.value }))} placeholder="e.g. 240" className="bg-obsidian border-white/8 text-ivory" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-fog text-xs">{sla.resolutionTime} (min)</Label>
                <Input type="number" value={form.resolutionTime} onChange={e => setForm(s => ({ ...s, resolutionTime: e.target.value }))} placeholder="e.g. 1440" className="bg-obsidian border-white/8 text-ivory" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} className="text-fog text-xs">Cancel</Button>
              <Button size="sm" onClick={handleAdd} className="bg-ivory text-obsidian hover:bg-ivory/90 rounded-lg text-xs">Save policy</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!policies ? (
        <Skeleton className="h-40 bg-white/5 rounded-xl" />
      ) : policies.length === 0 ? (
        <div className="text-center py-12 text-fog text-sm">No SLA policies yet.</div>
      ) : (
        <div className="bg-midnight rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-5 py-3 text-[11px] font-medium text-fog uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-[11px] font-medium text-fog uppercase tracking-wider">Priority</th>
                <th className="px-5 py-3 text-[11px] font-medium text-fog uppercase tracking-wider">{sla.responseTime}</th>
                <th className="px-5 py-3 text-[11px] font-medium text-fog uppercase tracking-wider">{sla.resolutionTime}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {policies.map((p: SLAPolicy) => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3 text-sm text-ivory">{p.name}</td>
                  <td className={cn('px-5 py-3 text-sm font-medium capitalize', priorityColors[p.priority])}>{p.priority}</td>
                  <td className="px-5 py-3 text-sm text-silver">{p.responseTime}m</td>
                  <td className="px-5 py-3 text-sm text-silver">{p.resolutionTime}m</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => deleteSLA(p.id)} className="text-fog hover:text-ember transition-colors p-1"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Suggested Workflows ──────────────────────────────────────────────────────

type Suggestion = {
  trigger: string;
  suggestedName: string;
  rationale: string;
  urgency: 'high' | 'medium' | 'low';
};

function SuggestedWorkflows({ workspaceId }: { workspaceId: string }) {
  const { t, lang } = useLang();
  const wf = t.app.workflows;
  const sg = wf.suggestions;
  const addWorkflow = useAddWorkflow();

  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);

  function loadSuggestions() {
    if (!workspaceId) return;
    setSuggestions(null);
    setLoadError(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    fetch('/api/ai/workflow-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, lang }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(d => { clearTimeout(timer); setSuggestions(d.suggestions ?? []); })
      .catch(() => { clearTimeout(timer); setSuggestions([]); setLoadError(true); });
  }

  useEffect(() => {
    loadSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, lang]);

  async function handleApply(s: Suggestion) {
    if (applying) return;
    setApplying(s.suggestedName);
    try {
      await addWorkflow({
        workspaceId,
        name: s.suggestedName,
        triggerEvent: s.trigger as any,
        triggerFilters: {},
        steps: [],
      });
      setApplied(prev => new Set(prev).add(s.suggestedName));
    } catch {
      // no-op
    } finally {
      setApplying(null);
    }
  }

  const urgencyConfig: Record<string, { color: string; bg: string; border: string }> = {
    high:   { color: '#A86A6A', bg: 'rgba(168,106,106,0.10)', border: 'rgba(168,106,106,0.25)' },
    medium: { color: '#B89B6A', bg: 'rgba(184,155,106,0.10)', border: 'rgba(184,155,106,0.25)' },
    low:    { color: '#8A9099', bg: 'rgba(138,144,153,0.10)', border: 'rgba(138,144,153,0.20)' },
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-ivory">{sg.heading}</p>
        <p className="text-xs text-fog mt-0.5">{sg.subtitle}</p>
      </div>

      {suggestions === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />)}
          <p className="text-xs text-fog text-center pt-2">{sg.loading}</p>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-white/6 p-10 text-center space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm text-fog">{sg.loadError}</p>
          <button
            onClick={loadSuggestions}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/8"
            style={{ border: '1px solid rgba(255,255,255,0.10)', color: '#B8BDC7' }}
          >
            {sg.retry}
          </button>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-2xl border border-white/6 p-12 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Sparkles size={22} className="mx-auto mb-3 opacity-30" style={{ color: '#8A9099' }} />
          <p className="text-sm text-fog">{sg.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const u = urgencyConfig[s.urgency] ?? urgencyConfig.low;
            const isApplied = applied.has(s.suggestedName);
            const isApplying = applying === s.suggestedName;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border p-5 flex items-start gap-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(184,189,199,0.08)' }}>
                  <Sparkles size={14} style={{ color: '#B8BDC7' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-ivory">{s.suggestedName}</p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: u.color, backgroundColor: u.bg, borderColor: u.border }}
                    >
                      {(sg.urgency as Record<string, string>)[s.urgency] ?? s.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-fog leading-relaxed">{s.rationale}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: '#8A9099' }}>
                    {sg.trigger}: <span style={{ color: '#B8BDC7' }}>{s.trigger}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleApply(s)}
                  disabled={isApplying || isApplied}
                  className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
                  style={isApplied
                    ? { backgroundColor: 'rgba(127,163,138,0.12)', border: '1px solid rgba(127,163,138,0.25)', color: '#7FA38A' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#B8BDC7' }}
                >
                  {isApplied ? <><Check size={11} className="inline mr-1" />{sg.applied}</> : isApplying ? sg.applying : sg.apply}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Module ───────────────────────────────────────────────────────────────

export default function Workflows() {
  const { t } = useLang();
  const wf = t.app.workflows;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  const isLoading = workspaces === null;

  if (isLoading || !workspaceId) {
    return <WorkflowSkeleton />;
  }

  const tabs = [
    { id: 0, label: wf.tabWorkflows,    content: <WorkflowList workspaceId={workspaceId} /> },
    { id: 1, label: wf.tabTemplates,    content: <TemplateGallery workspaceId={workspaceId} /> },
    { id: 2, label: wf.tabHandoffs,     content: <HandoffBoard workspaceId={workspaceId} /> },
    { id: 3, label: wf.tabSLA,          content: <SLAPolicyManager workspaceId={workspaceId} /> },
    { id: 4, label: wf.tabSuggestions,  content: <SuggestedWorkflows workspaceId={workspaceId} /> },
  ];

  return (
    <div className="space-y-8 w-full">
      <div>
        <TextAnimate text={wf.title} type="calmInUp" className="text-3xl font-serif text-ivory tracking-tight" />
        <p className="text-sm text-fog mt-1">Automate agency operations end-to-end</p>
      </div>

      <DirectionAwareTabs
        tabs={tabs}
        className="w-full"
      />
    </div>
  );
}
