'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckSquare, Users, Loader2, Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active:    { label: 'Active',    class: 'text-sage bg-sage/10' },
  on_hold:   { label: 'On Hold',   class: 'text-warm bg-warm/10' },
  completed: { label: 'Completed', class: 'text-fog bg-fog/10' },
  cancelled: { label: 'Cancelled', class: 'text-ember bg-ember/10' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!projData) {
        toast.error('Project not found');
        router.push('/app/projects');
        return;
      }
      setProject(projData);

      const [{ data: taskData }, { data: fileData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
        supabase.from('files').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ]);

      setTasks((taskData ?? []).map((t: any) => ({ ...t, _id: t.id })));
      setFiles((fileData ?? []).map((f: any) => ({ ...f, _id: f.id })));
      setLoading(false);
    }
    load();
  }, [projectId, router]);

  async function toggleTask(taskId: string, done: boolean) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: done ? 'done' : 'todo' })
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: done ? 'done' : 'todo' } : t));
    } else {
      toast.error('Failed to update task');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-fog" />
      </div>
    );
  }

  if (!project) return null;

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;
  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const budgetSpent = project.spent || 0;
  const budgetTotal = project.budget || 0;
  const budgetPct = budgetTotal > 0 ? Math.min(Math.round((budgetSpent / budgetTotal) * 100), 100) : 0;
  const team: string[] = project.team || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/app/projects')}
          className="flex items-center gap-2 text-sm text-fog hover:text-ivory transition-colors mb-4"
        >
          <ArrowLeft size={14} /> All projects
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-ivory">{project.name}</h1>
            <p className="text-sm text-fog mt-0.5">{project.client_name || 'No client'}</p>
          </div>
          <Badge variant="outline" className={cn('text-[11px] font-semibold border-none rounded-full', status.class)}>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks', value: `${doneTasks} / ${tasks.length}` },
          { label: 'Progress', value: `${pct}%` },
          { label: 'Budget', value: budgetTotal > 0 ? fmt(budgetTotal) : '—' },
          { label: 'Due date', value: project.due_date ? new Date(project.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl p-4 space-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] text-fog">{stat.label}</p>
            <p className="text-xl font-semibold text-ivory">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-fog">
            <span>Task completion</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5 bg-dusk" />
        </div>
        {budgetTotal > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-fog">
              <span>Budget used</span>
              <span>{fmt(budgetSpent)} / {fmt(budgetTotal)} · {budgetPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-dusk overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', budgetPct >= 90 ? 'bg-ember' : budgetPct >= 70 ? 'bg-warm' : 'bg-sage')}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Team */}
      {team.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory mb-3 flex items-center gap-2">
            <Users size={14} className="text-fog" /> Team ({team.length})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {team.map((member: string) => (
              <div key={member} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">{member}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-silver">{member}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-ivory mb-3 flex items-center gap-2">
          <CheckSquare size={14} className="text-fog" /> Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-fog py-4">No tasks yet.</p>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task: any) => {
              const done = task.status === 'done';
              return (
                <div
                  key={task._id}
                  onClick={() => toggleTask(task._id, !done)}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer group transition-colors"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {done
                    ? <CheckCircle2 size={16} className="text-sage shrink-0 mt-0.5" />
                    : <Circle size={16} className="text-fog group-hover:text-silver shrink-0 mt-0.5 transition-colors" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm transition-colors', done ? 'text-fog line-through' : 'text-silver group-hover:text-ivory')}>
                      {task.title || task.name}
                    </p>
                    {task.description && (
                      <p className="text-[11px] text-fog/60 mt-0.5 truncate">{task.description}</p>
                    )}
                  </div>
                  {task.priority && (
                    <span className={cn('text-[10px] capitalize shrink-0', task.priority === 'high' || task.priority === 'urgent' ? 'text-ember' : task.priority === 'medium' ? 'text-warm' : 'text-fog')}>
                      {task.priority}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory mb-3">Files ({files.length})</h2>
          <div className="space-y-2">
            {files.map((file: any) => (
              <div
                key={file._id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory truncate">{file.name}</p>
                  <p className="text-[11px] text-fog">{new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                {file.url && (
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-fog hover:text-ivory transition-colors">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
