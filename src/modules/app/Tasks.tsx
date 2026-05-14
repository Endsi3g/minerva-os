import { useState, useMemo } from 'react';
import { Plus, Circle, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskStatus, TaskPriority } from '@/lib/types';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CommentSection } from '@/components/minerva/CommentSection';
import { Id } from '../../../convex/_generated/dataModel';

type Filter = TaskStatus | 'all';

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: 'todo',
};

const STATUS_ICON: Record<TaskStatus, React.ElementType> = {
  todo:        Circle,
  in_progress: Loader2,
  review:      Eye,
  done:        CheckCircle2,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:        'text-fog',
  in_progress: 'text-warm animate-spin',
  review:      'text-silver',
  done:        'text-sage',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: 'text-ember bg-ember/10',
  high:   'text-warm  bg-warm/10',
  medium: 'text-silver bg-silver/10',
  low:    'text-fog   bg-fog/10',
};

interface NewTaskForm {
  title: string;
  projectId: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const EMPTY_FORM: NewTaskForm = {
  title: '', projectId: '', assignee: 'US', dueDate: '', priority: 'medium', status: 'todo',
};

export default function Tasks() {
  const { t, lang } = useLang();
  const tk = t.app.tasks;

  const tasks = useQuery(api.tasks.get) ?? [];
  const projects = useQuery(api.projects.list) ?? [];
  const createTask = useMutation(api.tasks.create);

  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const updateTask = useMutation(api.tasks.update);

  const FILTER_TABS = useMemo(() => [
    { id: 'all' as Filter,         label: tk.filters.all },
    { id: 'todo' as Filter,        label: tk.filters.todo },
    { id: 'in_progress' as Filter, label: tk.filters.in_progress },
    { id: 'review' as Filter,      label: tk.filters.review },
    { id: 'done' as Filter,        label: tk.filters.done },
  ], [tk]);

  const visible = filter === 'all' ? tasks : tasks.filter((t: any) => t.status === filter);

  async function cycleStatus(id: any, currentStatus: TaskStatus) {
    const nextStatus = STATUS_CYCLE[currentStatus];
    await updateTask({ id, status: nextStatus });
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.projectId) return;
    
    await createTask({
      title: form.title.trim(),
      projectId: form.projectId as any,
      status: form.status,
      priority: form.priority,
      assignee: form.assignee.trim() || 'US',
      dueDate: form.dueDate || '2026-12-31',
    });
    
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{tk.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {tk.stats
              .replace('total', String(tasks.length))
              .replace('open', String(tasks.filter((t: any) => t.status !== 'done').length))}
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          {tk.addTask}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-card border border-border w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === tab.id
                ? 'bg-dusk text-ivory'
                : 'text-fog hover:text-silver'
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {tasks.filter((t: any) => t.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {visible.length === 0 && (
          <p className="text-sm text-fog py-8 text-center">{tk.empty}</p>
        )}
        {visible.map((task: any) => {
          const StatusIcon = STATUS_ICON[task.status as TaskStatus] || Circle;
          const project = projects.find((p: any) => p._id === task.projectId);
          return (
            <div
              key={task._id}
              onClick={() => setSelectedTask(task)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/80 transition-colors group cursor-pointer"
            >
              {/* Status toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cycleStatus(task._id, task.status as TaskStatus);
                }}
                className="shrink-0 transition-opacity hover:opacity-80"
                aria-label={lang === 'fr' ? 'Changer le statut' : 'Cycle status'}
              >
                <StatusIcon size={16} className={STATUS_COLOR[task.status as TaskStatus]} />
              </button>

              {/* Title */}
              <p className={cn('flex-1 text-sm truncate', task.status === 'done' ? 'line-through text-fog' : 'text-ivory')}>
                {task.title}
              </p>

              {/* Project pill */}
              <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full bg-dusk text-fog border border-border shrink-0 max-w-[120px] truncate">
                {project?.name || '...'}
              </span>

              {/* Priority */}
              <span className={cn('hidden md:block text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize shrink-0', PRIORITY_COLOR[task.priority as TaskPriority])}>
                {tk.priorities[task.priority as TaskPriority]}
              </span>

              {/* Due date */}
              <span className="hidden lg:block text-[10px] text-fog shrink-0">
                {new Date(task.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
              </span>

              {/* Assignee */}
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[8px]">{task.assignee}</AvatarFallback>
              </Avatar>
            </div>
          );
        })}
      </div>

      {/* Task detail sheet */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent side="right" className="w-[400px] bg-midnight border-white/5 flex flex-col p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full', PRIORITY_COLOR[selectedTask?.priority as TaskPriority])}>
                {tk.priorities[selectedTask?.priority as TaskPriority]}
              </span>
              <span className="text-[10px] text-fog">Due {new Date(selectedTask?.dueDate).toLocaleDateString()}</span>
            </div>
            <SheetTitle className="text-xl font-semibold text-ivory leading-tight">{selectedTask?.title}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fog mb-4">Discussion</p>
            {selectedTask && (
              <CommentSection targetId={selectedTask._id} targetType="task" />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add task sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{tk.newTask}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{tk.form.title}</Label>
              <Input placeholder={tk.form.titlePlaceholder} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{tk.form.project}</Label>
              <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                <SelectTrigger><SelectValue placeholder={tk.form.projectPlaceholder} /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{tk.form.assignee}</Label>
              <Input placeholder={tk.form.assigneePlaceholder} maxLength={3} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{tk.form.dueDate}</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="[color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <Label>{tk.form.priority}</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{tk.priorities.low}</SelectItem>
                  <SelectItem value="medium">{tk.priorities.medium}</SelectItem>
                  <SelectItem value="high">{tk.priorities.high}</SelectItem>
                  <SelectItem value="urgent">{tk.priorities.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{tk.form.status}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TaskStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{tk.filters.todo}</SelectItem>
                  <SelectItem value="in_progress">{tk.filters.in_progress}</SelectItem>
                  <SelectItem value="review">{tk.filters.review}</SelectItem>
                  <SelectItem value="done">{tk.filters.done}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>{tk.form.add}</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
