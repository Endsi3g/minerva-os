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
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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

  const projects = useQuery(api.projects.list) ?? [];
  const clients = useQuery(api.clients.list) ?? [];
  const createProject = useMutation(api.projects.add);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);

  const activeCount = projects.filter((p: any) => p.status === 'active').length;

  async function handleAdd() {
    if (!form.name.trim() || !form.clientId) return;
    const client = clients.find((c: any) => c._id === form.clientId);
    
    await createProject({
      name: form.name.trim(),
      clientName: client?.company ?? '',
      status: 'active',
      dueDate: form.dueDate || '2026-12-31',
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
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          {p.newProject}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj: any) => (
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
