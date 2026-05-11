import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { MOCK_PROJECTS, MOCK_CLIENTS } from '@/lib/mock-data';
import type { Project } from '@/lib/types';

interface NewProjectForm {
  name: string;
  clientId: string;
  dueDate: string;
  budget: string;
}

const EMPTY_FORM: NewProjectForm = { name: '', clientId: '', dueDate: '', budget: '' };

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);

  const active = projects.filter(p => p.status === 'active').length;

  function handleAdd() {
    if (!form.name.trim() || !form.clientId) return;
    const client = MOCK_CLIENTS.find(c => c.id === form.clientId);
    const project: Project = {
      id: `p${Date.now()}`,
      name: form.name.trim(),
      client: client?.company ?? '',
      clientId: form.clientId,
      status: 'active',
      dueDate: form.dueDate || '2026-12-31',
      budget: parseFloat(form.budget) || 0,
      spent: 0,
      totalTasks: 0,
      doneTasks: 0,
      team: ['US'],
    };
    setProjects(prev => [project, ...prev]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Projects</h1>
          <p className="text-sm text-fog mt-0.5">{active} active · {projects.length} total</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          New project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>New Project</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>Project name</Label>
              <Input placeholder="Website Redesign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CLIENTS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="[color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <Label>Budget (USD)</Label>
              <Input type="number" placeholder="15000" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>Create Project</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
