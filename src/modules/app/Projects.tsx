import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, GanttChartSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ProjectCard } from '@/components/minerva/ProjectCard';
import { useLang } from '@/i18n';
import { useWorkspaces, useProjects, useClients, useAddProject } from '@/lib/hooks/useSupabase';

const STATUS_COLORS: Record<string, string> = {
  active:    '#7FA38A',
  completed: '#B89B6A',
  paused:    '#8A9099',
  cancelled: '#A86A6A',
};

function GanttTimeline({ projects }: { projects: any[] }) {
  const today = Date.now();

  const sorted = useMemo(() => [...projects].sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  ), [projects]);

  if (sorted.length === 0) {
    return <div className="py-20 text-center text-fog text-sm">No projects to display.</div>;
  }

  const minTs = Math.min(...sorted.map(p => new Date(p.dueDate).getTime() - 30 * 24 * 60 * 60 * 1000));
  const maxTs = Math.max(...sorted.map(p => new Date(p.dueDate).getTime())) + 7 * 24 * 60 * 60 * 1000;
  const totalMs = maxTs - minTs;

  function pct(ts: number) {
    return ((ts - minTs) / totalMs) * 100;
  }

  // Generate month labels
  const months: { label: string; pct: number }[] = [];
  const cursor = new Date(minTs);
  cursor.setDate(1);
  while (cursor.getTime() < maxTs) {
    months.push({
      label: cursor.toLocaleDateString([], { month: 'short', year: '2-digit' }),
      pct: pct(cursor.getTime()),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const todayPct = pct(today);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month header */}
        <div className="relative h-6 mb-2 ml-40">
          {months.map(m => (
            <div
              key={m.label}
              className="absolute top-0 text-[10px] text-fog"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {sorted.map(project => {
            const dueTs = new Date(project.dueDate).getTime();
            const startTs = dueTs - 21 * 24 * 60 * 60 * 1000;
            const left = pct(Math.max(startTs, minTs));
            const right = pct(dueTs);
            const width = Math.max(right - left, 1);
            const isOverdue = dueTs < today && project.status === 'active';
            const barColor = isOverdue ? '#A86A6A' : STATUS_COLORS[project.status] ?? '#8A9099';

            return (
              <div key={project._id} className="flex items-center gap-2 h-8">
                <div className="w-40 shrink-0 text-right">
                  <span className="text-xs text-silver truncate">{project.name}</span>
                </div>
                <div className="flex-1 relative h-full">
                  {/* Grid lines */}
                  {months.map(m => (
                    <div
                      key={m.label}
                      className="absolute top-0 bottom-0 border-l"
                      style={{ left: `${m.pct}%`, borderColor: 'rgba(255,255,255,0.04)' }}
                    />
                  ))}
                  {/* Today line */}
                  {todayPct > 0 && todayPct < 100 && (
                    <div
                      className="absolute top-0 bottom-0 border-l border-dashed border-warm/40 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}
                  {/* Bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md flex items-center px-2 text-[10px] text-white/80 overflow-hidden"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: barColor, opacity: 0.85 }}
                    title={`${project.name} · Due ${new Date(project.dueDate).toLocaleDateString()}`}
                  >
                    {width > 8 && <span className="truncate">{new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface NewProjectForm {
  name: string;
  clientId: string;
  dueDate: string;
  budget: string;
}

const EMPTY_FORM: NewProjectForm = { name: '', clientId: '', dueDate: '', budget: '' };

export default function Projects() {
  const { t } = useLang();
  const p = t.app.projects;
  const router = useRouter();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces[0]?.id;

  const projects = useProjects(workspaceId);
  const clients = useClients(workspaceId);
  const createProject = useAddProject();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);
  const [viewTab, setViewTab] = useState<'grid' | 'timeline'>('grid');

  const activeCount = projects.filter((p: any) => p.status === 'active').length;

  async function handleAdd() {
    if (!form.name.trim() || !form.clientId) return;
    const client = clients.find((c: any) => c._id === form.clientId);
    
    await createProject({
      workspaceId: workspaceId!,
      name: form.name.trim(),
      clientName: client?.company ?? '',
      status: 'active',
      dueDate: form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: parseFloat(form.budget) || 0,
    });
    
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{p.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {p.stats
              .replace('active', String(activeCount))
              .replace('total', String(projects.length))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden border border-white/8">
            <button
              onClick={() => setViewTab('grid')}
              className={cn('h-8 px-3 flex items-center gap-1.5 text-xs transition-colors', viewTab === 'grid' ? 'bg-white/10 text-ivory' : 'text-fog hover:text-silver')}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewTab('timeline')}
              className={cn('h-8 px-3 flex items-center gap-1.5 text-xs transition-colors border-l border-white/8', viewTab === 'timeline' ? 'bg-white/10 text-ivory' : 'text-fog hover:text-silver')}
            >
              <GanttChartSquare size={13} />
            </button>
          </div>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
            <Plus size={14} />
            {p.newProject}
          </Button>
        </div>
      </div>

      {viewTab === 'timeline' && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <GanttTimeline projects={projects as any[]} />
        </div>
      )}

      {viewTab === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj: any) => (
          <ProjectCard
            key={proj._id}
            project={{
              ...proj,
              id: proj._id,
              client: proj.clientName,
              spent: 0,
              totalTasks: 0,
              doneTasks: 0,
              team: ['US'],
            }}
            onClick={() => router.push(`/app/projects/${proj._id}`)}
          />
        ))}
      </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{p.newProject}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{p.form.name}</Label>
              <Input placeholder={p.form.namePlaceholder} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.client}</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={p.form.clientPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.dueDate}</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="[color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.budget}</Label>
              <Input type="number" placeholder={p.form.budgetPlaceholder} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>{p.form.create}</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
