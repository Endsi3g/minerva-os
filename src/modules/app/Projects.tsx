import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeBanner } from '@/components/minerva/UpgradeBanner';
import { Plus, LayoutGrid, GanttChartSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/ui/text-animate';
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
import { toast } from 'sonner';
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

function ProjectCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 bg-white/5" />
          <Skeleton className="h-3 w-1/2 bg-white/5" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full shrink-0 bg-white/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full bg-white/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full bg-white/5" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex -space-x-1.5">
          <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
          <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
        </div>
        <Skeleton className="h-3 w-20 bg-white/5" />
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Projects() {
  const { t, lang } = useLang();
  const p = t.app.projects;

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  const projects = useProjects(workspaceId);
  const clients = useClients(workspaceId);
  const createProject = useAddProject();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);
  const [viewTab, setViewTab] = useState<'grid' | 'timeline'>('grid');
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'at_risk' | 'completed'>('all');

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p: any) => {
      if (projectFilter === 'all') return true;
      if (projectFilter === 'active') return p.status === 'active';
      if (projectFilter === 'completed') return p.status === 'completed';
      if (projectFilter === 'at_risk') {
        const isOverdue = p.dueDate && new Date(p.dueDate).getTime() < Date.now();
        return p.status === 'active' && (isOverdue || (p.budget ?? 0) > 10000);
      }
      return true;
    });
  }, [projects, projectFilter]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('create') === 'true' || searchParams?.get('new') === 'true') {
      setSheetOpen(true);
    }
  }, [searchParams]);

  const isLoading = projects === null || clients === null;
  const activeCount = projects ? projects.filter((p: any) => p.status === 'active').length : 0;
  const totalCount = projects ? projects.length : 0;

  async function handleAdd() {
    if (!form.name.trim() || !form.clientId) return;
    const client = clients?.find((c: any) => c._id === form.clientId);

    try {
      const project = await createProject({
        workspaceId: workspaceId!,
        name: form.name.trim(),
        clientName: client?.company ?? '',
        status: 'active',
        dueDate: form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: parseFloat(form.budget) || 0,
      });

      if (project?.id && workspaceId) {
        fetch('/api/workflow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'project_created',
            entityType: 'project',
            entityId: project.id,
            workspaceId,
            context: { projectId: project.id, projectName: project.name, clientName: client?.company ?? '' },
          }),
        }).catch(() => null);
      }

      toast.success(p.createSuccess);
      setSheetOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error(p.createError);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={p.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {p.stats
              .replace('active', String(activeCount))
              .replace('total', String(totalCount))}
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
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }} id="btn-new-project">
            <Plus size={14} />
            {p.newProject}
          </Button>
        </div>
      </div>

      {/* Saved Views Filter Tabs / Chips */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
          {[
            { id: 'all' as const, label: lang === 'fr' ? 'Tous' : 'All' },
            { id: 'active' as const, label: lang === 'fr' ? 'Actifs' : 'Active' },
            { id: 'at_risk' as const, label: lang === 'fr' ? 'À risque' : 'At Risk' },
            { id: 'completed' as const, label: lang === 'fr' ? 'Complétés' : 'Completed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setProjectFilter(tab.id)}
              className={cn(
                "relative px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none",
                projectFilter === tab.id
                  ? "bg-white/10 text-ivory border-white/15 shadow-sm"
                  : "bg-transparent text-fog border-transparent hover:text-silver"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <UpgradeBanner featureKey="workflows" show={(projects?.length ?? 0) >= 3} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-midnight/30 rounded-xl border border-white/5 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-fog">
            <GanttChartSquare size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ivory">{lang === 'fr' ? 'Aucun projet trouvé' : 'No projects found'}</p>
            <p className="text-xs text-fog max-w-xs">{lang === 'fr' ? 'Créez votre premier projet pour commencer à suivre votre travail.' : 'Create your first project to start tracking deliverables.'}</p>
          </div>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }} className="rounded-full">
            <Plus size={14} className="mr-1.5" />
            {p.newProject}
          </Button>
        </div>
      ) : (
        <>
          {viewTab === 'timeline' && (
            <div className="rounded-xl border border-border bg-card p-4 mb-4">
              <GanttTimeline projects={filteredProjects as any[]} />
            </div>
          )}

          {viewTab === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj: any) => (
                <ProjectCard key={proj._id} project={{
                  ...proj,
                  id: proj._id,
                  client: proj.clientName,
                  spent: 0,
                  totalTasks: 0,
                  doneTasks: 0,
                  team: ['US']
                }} />
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-6 flex flex-col gap-6">
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
                  {clients?.map((c: any) => (
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
