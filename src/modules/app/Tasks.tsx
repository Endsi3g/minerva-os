import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Circle, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import { TextAnimate } from '@/components/ui/text-animate';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TopBlur, BottomBlur } from '@/components/ui/edge-blur';
import { Reorder } from 'motion/react';
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
import { useWorkspaces, useTasks, useProjects, useAddTask, useUpdateTask } from '@/lib/hooks/useSupabase';
import { CommentSection } from '@/components/minerva/CommentSection';

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

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-midnight border border-white/5 animate-pulse">
      <Skeleton className="h-4 w-4 rounded-full bg-white/5 shrink-0" />
      <Skeleton className="h-4 w-1/3 bg-white/5 flex-1" />
      <Skeleton className="h-4 w-20 bg-white/5 shrink-0 hidden sm:block" />
      <Skeleton className="h-4 w-16 bg-white/5 shrink-0 hidden md:block" />
      <Skeleton className="h-5 w-5 rounded-full bg-white/5 shrink-0" />
    </div>
  );
}

export default function Tasks() {
  const { t, lang } = useLang();
  const tk = t.app.tasks;

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: tasks, count: totalTasksCount } = useTasks(workspaceId, null, page, pageSize) || { data: null, count: 0 };
  const projects = useProjects(workspaceId);
  const createTask = useAddTask();

  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const updateTask = useUpdateTask();

  const FILTER_TABS = useMemo(() => [
    { id: 'all' as Filter,         label: tk.filters.all },
    { id: 'todo' as Filter,        label: tk.filters.todo },
    { id: 'in_progress' as Filter, label: tk.filters.in_progress },
    { id: 'review' as Filter,      label: tk.filters.review },
    { id: 'done' as Filter,        label: tk.filters.done },
  ], [tk]);

  const [orderedTasks, setOrderedTasks] = useState<any[]>([]);

  useEffect(() => {
    if (tasks) {
      setOrderedTasks(tasks);
    }
  }, [tasks]);

  const isLoading = tasks === null || projects === null;
  const visible = filter === 'all' ? orderedTasks : orderedTasks.filter((t: any) => t.status === filter);
  const totalPages = Math.ceil(totalTasksCount / pageSize);

  async function cycleStatus(id: string, currentStatus: TaskStatus) {
    const nextStatus = STATUS_CYCLE[currentStatus];
    const originalTasks = [...orderedTasks];
    
    // Optimistic Update
    setOrderedTasks(prev => prev.map(t => t._id === id ? { ...t, status: nextStatus } : t));
    
    try {
      await updateTask({ id, status: nextStatus });
    } catch (err) {
      setOrderedTasks(originalTasks);
      toast.error(lang === 'fr' ? 'Échec de la mise à jour du statut' : 'Failed to update task status');
    }
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.projectId || !workspaceId) return;
    
    await createTask({
      workspaceId,
      title: form.title.trim(),
      projectId: form.projectId as any,
      status: form.status,
      priority: form.priority,
      assignee: form.assignee.trim() || 'US',
      dueDate: form.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <TextAnimate text={tk.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {tk.stats
              .replace('total', String(totalTasksCount))
              .replace('open', String(tasks ? tasks.filter((t: any) => t.status !== 'done').length : 0))}
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }} id="btn-new-task">
          <Plus size={14} />
          {tk.addTask}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-card border border-border w-fit max-w-full overflow-x-auto">
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
            {tab.id !== 'all' && tasks && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {tasks.filter((t: any) => t.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="relative max-h-[60vh] overflow-y-auto pr-1">
        <TopBlur className="absolute top-0 z-20" height={24} />
        
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5].map(i => <TaskRowSkeleton key={i} />)}
          </div>
        ) : totalTasksCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-midnight/30 rounded-xl border border-white/5 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-fog">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-ivory">{lang === 'fr' ? 'Aucune tâche trouvée' : 'No tasks found'}</p>
              <p className="text-xs text-fog max-w-xs">{lang === 'fr' ? 'Créez votre première tâche pour commencer à collaborer.' : 'Create your first task to start collaborating.'}</p>
            </div>
            <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }} className="rounded-full">
              <Plus size={14} className="mr-1.5" />
              {tk.addTask}
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-fog py-8 text-center">{tk.empty}</p>
        ) : (
          <>
            <Reorder.Group axis="y" values={orderedTasks} onReorder={setOrderedTasks} className="space-y-1 py-4">
              {visible.map((task: any) => {
                const StatusIcon = STATUS_ICON[task.status as TaskStatus] || Circle;
                const project = projects?.find((p: any) => p._id === task.projectId);
                return (
                  <Reorder.Item
                    key={task._id}
                    value={task}
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/80 transition-colors group cursor-grab active:cursor-grabbing bg-midnight border border-white/5 select-none"
                  >
                    {/* Status toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleStatus(task._id, task.status as TaskStatus);
                      }}
                      className="shrink-0 transition-opacity hover:opacity-80 cursor-pointer"
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
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1 py-2 border-t border-white/5">
                <span className="text-xs text-fog">
                  Showing {Math.min((page - 1) * pageSize + 1, totalTasksCount)}-{Math.min(page * pageSize, totalTasksCount)} of {totalTasksCount} tasks
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="border-white/10 text-fog hover:text-ivory"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-silver font-medium font-mono px-2">{page} / {totalPages}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="border-white/10 text-fog hover:text-ivory"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <BottomBlur className="absolute bottom-0 z-20" height={24} />
      </div>

      {/* Task detail sheet */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent side="right" className="w-full sm:w-[400px] bg-midnight border-white/5 flex flex-col p-0">
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
        <SheetContent side="right" className="w-full sm:w-96 p-6 flex flex-col gap-6">
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
                  {projects?.map((p: any) => (
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
