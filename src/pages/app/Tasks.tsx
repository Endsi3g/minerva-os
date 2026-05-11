import { useState } from 'react';
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
import { MOCK_TASKS, MOCK_PROJECTS } from '@/lib/mock-data';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';

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

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

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
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  function cycleStatus(id: string) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t
    ));
  }

  function handleAdd() {
    if (!form.title.trim()) return;
    const project = MOCK_PROJECTS.find(p => p.id === form.projectId);
    const task: Task = {
      id: `t${Date.now()}`,
      title: form.title.trim(),
      project: project?.name ?? 'Unassigned',
      projectId: form.projectId,
      assignee: form.assignee.trim() || 'US',
      dueDate: form.dueDate || '2026-12-31',
      priority: form.priority,
      status: form.status,
    };
    setTasks(prev => [task, ...prev]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Tasks</h1>
          <p className="text-sm text-fog mt-0.5">{tasks.length} total · {tasks.filter(t => t.status !== 'done').length} open</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          Add task
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
                {tasks.filter(t => t.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {visible.length === 0 && (
          <p className="text-sm text-fog py-8 text-center">No tasks in this view.</p>
        )}
        {visible.map(task => {
          const StatusIcon = STATUS_ICON[task.status];
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/80 transition-colors group"
            >
              {/* Status toggle */}
              <button
                onClick={() => cycleStatus(task.id)}
                className="shrink-0 transition-opacity hover:opacity-80"
                aria-label="Cycle status"
              >
                <StatusIcon size={16} className={STATUS_COLOR[task.status]} />
              </button>

              {/* Title */}
              <p className={cn('flex-1 text-sm truncate', task.status === 'done' ? 'line-through text-fog' : 'text-ivory')}>
                {task.title}
              </p>

              {/* Project pill */}
              <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full bg-dusk text-fog border border-border shrink-0 max-w-[120px] truncate">
                {task.project}
              </span>

              {/* Priority */}
              <span className={cn('hidden md:block text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize shrink-0', PRIORITY_COLOR[task.priority])}>
                {task.priority}
              </span>

              {/* Due date */}
              <span className="hidden lg:block text-[10px] text-fog shrink-0">
                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>

              {/* Assignee */}
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[8px]">{task.assignee}</AvatarFallback>
              </Avatar>
            </div>
          );
        })}
      </div>

      {/* Add task sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>New Task</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>Task title</Label>
              <Input placeholder="Finalise homepage wireframes" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                <SelectContent>
                  {MOCK_PROJECTS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee initials</Label>
              <Input placeholder="US" maxLength={3} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="[color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TaskStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>Add Task</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
