'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  FolderKanban,
  Receipt,
  Clock,
  Edit3,
  Trash2,
  Plus,
  X,
  Upload,
  Send,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaces, useClients, useProjects, useInvoices, useApprovals, useTasks, useUpdateClient, useDeleteClient, useAddTask, useUpdateTask } from '@/lib/hooks/useSupabase';
import { cn } from '@/lib/utils';

interface ClientDetailProps {
  clientId: string;
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse px-6 py-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-10 w-48 rounded bg-border/50" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl bg-border/50" />
          <Skeleton className="h-44 rounded-xl bg-border/50" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 rounded-xl bg-border/50" />
          <Skeleton className="h-48 rounded-xl bg-border/50" />
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  const clients = useClients(workspaceId);
  const projects = useProjects(workspaceId);
  const invoices = useInvoices(workspaceId);
  const approvals = useApprovals(workspaceId);
  const tasks = useTasks(workspaceId);

  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const createTask = useAddTask();
  const updateTask = useUpdateTask();

  const isLoading = clients === null || projects === null || invoices === null || approvals === null || tasks === null;

  // Filter client & its operations
  const client = useMemo(() =>
    (clients ?? []).find((c: any) => c.id === clientId || c._id === clientId),
  [clients, clientId]);

  const clientProjects = useMemo(() =>
    (projects ?? []).filter((p: any) => p.clientId === clientId || p.clientName === client?.company),
  [projects, clientId, client]);

  const projectIds = useMemo(() =>
    clientProjects.map((p: any) => p.id ?? p._id),
  [clientProjects]);

  const clientTasks = useMemo(() =>
    (tasks ?? []).filter((t: any) => projectIds.includes(t.projectId)),
  [tasks, projectIds]);

  const clientInvoices = useMemo(() =>
    (invoices ?? []).filter((i: any) => i.clientId === clientId),
  [invoices, clientId]);

  const clientApprovals = useMemo(() =>
    (approvals ?? []).filter((a: any) => projectIds.includes(a.projectId)),
  [approvals, projectIds]);

  const outstandingInvoices = useMemo(() =>
    clientInvoices.filter((i: any) => i.status !== 'paid'),
  [clientInvoices]);

  const outstandingTotal = useMemo(() =>
    outstandingInvoices.reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0),
  [outstandingInvoices]);

  const pendingApprovals = useMemo(() =>
    clientApprovals.filter((a: any) => a.status === 'pending'),
  [clientApprovals]);

  // --- Inline Editing States ---
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMonthlyValue, setEditMonthlyValue] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editIndustry, setEditIndustry] = useState('');

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // --- Task Creation States ---
  const [isCreatingTaskForProjectId, setIsCreatingTaskForProjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // --- Task Completion States ---
  const [isCompletingTaskId, setIsCompletingTaskId] = useState<string | null>(null);
  const [completionProof, setCompletionProof] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mockFilesUploaded, setMockFilesUploaded] = useState<string[]>([]);

  // --- Notification Log Dialog Alert ---
  const [activeAlert, setActiveAlert] = useState<{
    taskTitle: string;
    clientEmail: string;
    teamList: string;
    proof: string;
    files: string[];
  } | null>(null);

  // --- Init inline inputs ---
  const initContactEdit = () => {
    if (client) {
      setEditContact(client.contact || '');
      setEditEmail(client.email || '');
      setEditPhone(client.phone || '');
      setEditMonthlyValue(String(client.monthlyValue || ''));
      setEditStatus(client.status || 'active');
      setEditIndustry(client.industry || '');
      setIsEditingContact(true);
    }
  };

  const initDescriptionEdit = () => {
    if (client) {
      setEditDescription(client.description || '');
      setIsEditingDescription(true);
    }
  };

  const initNotesEdit = () => {
    if (client) {
      setEditNotes(client.notes || '');
      setIsEditingNotes(true);
    }
  };

  // --- Submit Edits ---
  const handleSaveContact = async () => {
    if (!client || !editContact.trim() || !editEmail.trim()) {
      toast.error('Contact person name and Email are required.');
      return;
    }
    try {
      await updateClient({
        id: client.id,
        contact: editContact.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        monthlyValue: parseFloat(editMonthlyValue) || 0,
        status: editStatus,
        industry: editIndustry.trim(),
      });
      setIsEditingContact(false);
      toast.success('Contact information updated successfully.');
    } catch {
      toast.error('Failed to update contact information.');
    }
  };

  const handleSaveDescription = async () => {
    if (!client) return;
    try {
      await updateClient({
        id: client.id,
        description: editDescription.trim(),
      });
      setIsEditingDescription(false);
      toast.success('Description updated successfully.');
    } catch {
      toast.error('Failed to update description.');
    }
  };

  const handleSaveNotes = async () => {
    if (!client) return;
    try {
      await updateClient({
        id: client.id,
        notes: editNotes.trim(),
      });
      setIsEditingNotes(false);
      toast.success('Internal notes updated successfully.');
    } catch {
      toast.error('Failed to update internal notes.');
    }
  };

  // --- Delete Client Account ---
  const handleDeleteClient = async () => {
    if (!client) return;
    try {
      await deleteClient(client.id);
      setIsDeleteConfirmOpen(false);
      toast.success(`Client ${client.company} removed successfully.`);
      router.push('/app/clients');
    } catch {
      toast.error('Failed to delete client account.');
    }
  };

  // --- Create Task ---
  const handleCreateTask = async () => {
    if (!isCreatingTaskForProjectId || !newTaskTitle.trim() || !workspaceId) {
      toast.error('Task title is required.');
      return;
    }
    try {
      await createTask({
        workspaceId,
        projectId: isCreatingTaskForProjectId,
        title: newTaskTitle.trim(),
        assignee: 'US',
        status: 'todo',
        priority: newTaskPriority,
        dueDate: newTaskDueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      });
      setIsCreatingTaskForProjectId(null);
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      toast.success('Task created successfully.');
    } catch {
      toast.error('Failed to add task.');
    }
  };

  // --- Complete Task with Proof & Notify ---
  const handleOpenCompleteTask = (task: any) => {
    setIsCompletingTaskId(task.id ?? task._id);
    setCompletionProof('');
    setNotifyClient(true);
    setNotifyTeam(true);
    setMockFilesUploaded([]);
  };

  const handleCompleteTask = async () => {
    if (!isCompletingTaskId) return;
    const task = clientTasks.find((t: any) => (t.id ?? t._id) === isCompletingTaskId);
    if (!task) return;

    if (!completionProof.trim() && mockFilesUploaded.length === 0) {
      toast.error('Please provide a text proof of completion or upload a file.');
      return;
    }

    try {
      // 1. Mark task status as done in database
      await updateTask({
        id: isCompletingTaskId,
        status: 'done',
      });

      // 2. Append proof to client's operational notes in mock database to record the event
      if (client) {
        const timestamp = new Date().toLocaleString();
        const logsAppend = `\n\n[System Log: ${timestamp}] Completed task "${task.title}".\nProof of work: "${completionProof}"\nNotify Client: ${notifyClient ? 'Yes' : 'No'} · Notify Team: ${notifyTeam ? 'Yes' : 'No'}`;
        await updateClient({
          id: client.id,
          notes: (client.notes || '') + logsAppend,
        });
      }

      // 3. Reset complete panel state
      setIsCompletingTaskId(null);

      // 4. Set visual notification alert popup state
      if (notifyClient || notifyTeam) {
        setActiveAlert({
          taskTitle: task.title,
          clientEmail: client?.email || 'client@minervaos.com',
          teamList: 'JR, ML, PK',
          proof: completionProof,
          files: mockFilesUploaded,
        });
      }

      toast.success('Task marked as completed.');
    } catch {
      toast.error('Failed to complete task.');
    }
  };

  // --- Mock File Drop Area ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const names = Array.from(e.dataTransfer.files).map(f => f.name);
      setMockFilesUploaded(prev => [...prev, ...names]);
      toast.success(`Attached: ${names.join(', ')}`);
    }
  };
  const triggerMockUpload = () => {
    const defaultFiles = ['screenshot_final_review.png', 'delivery_spec_v2.pdf'];
    const chosen = defaultFiles[Math.floor(Math.random() * defaultFiles.length)];
    setMockFilesUploaded(prev => [...prev, chosen]);
    toast.success(`Mock Upload: ${chosen} attached.`);
  };

  if (isLoading || !client) {
    return <DetailSkeleton />;
  }

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">
      
      {/* Header with back navigation & delete action */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app/clients')}
            className="h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft size={14} />
          </Button>
          <div>
            <h1 className="text-2xl font-serif text-foreground tracking-tight flex items-center gap-2.5">
              {client.company}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.industry || 'Services'} · {client.status}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setIsDeleteConfirmOpen(true)}
          className="text-danger border-danger/20 hover:bg-danger/10 hover:text-danger hover:border-danger gap-1.5 h-8 text-xs font-semibold px-3.5 rounded-lg"
        >
          <Trash2 size={13} /> Delete Account
        </Button>
      </div>

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Metadata, Description & Notes */}
        <div className="space-y-6">
          
          {/* Contact Details Card */}
          <Card className="bg-surface border-border shadow-card relative group">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building size={12} /> Contact Information
              </CardTitle>
              {!isEditingContact && (
                <button
                  onClick={initContactEdit}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-alt transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Edit Contact Info"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {isEditingContact ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Primary Contact</Label>
                    <Input value={editContact} onChange={e => setEditContact(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Email Address</Label>
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Phone Number</Label>
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Industry</Label>
                    <Input value={editIndustry} onChange={e => setEditIndustry(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Retainer</Label>
                      <Input type="number" value={editMonthlyValue} onChange={e => setEditMonthlyValue(e.target.value)} className="h-8 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveContact} size="sm" className="h-7 text-[10px] flex-1">Save</Button>
                    <Button onClick={() => setIsEditingContact(false)} variant="outline" size="sm" className="h-7 text-[10px] flex-1 border-border">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-subtle-foreground block">Primary Contact</span>
                    <span className="text-xs text-foreground font-medium">{client.contact || 'No contact specified'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-subtle-foreground block">Email Address</span>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Mail size={12} /> {client.email || 'No email available'}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-subtle-foreground block">Phone Number</span>
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="text-xs text-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <Phone size={12} className="text-muted-foreground" /> {client.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No phone number added</span>
                    )}
                  </div>
                  <div className="space-y-1 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-subtle-foreground">Monthly Retainer</span>
                    <span className="text-sm font-semibold font-mono text-foreground">{fmt(client.monthlyValue)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="bg-surface border-border shadow-card relative group">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Description
              </CardTitle>
              {!isEditingDescription && (
                <button
                  onClick={initDescriptionEdit}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-alt transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Edit Description"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full min-h-[90px] bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    placeholder="Enter client description..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveDescription} size="sm" className="h-7 text-[10px] flex-1">Save</Button>
                    <Button onClick={() => setIsEditingDescription(false)} variant="outline" size="sm" className="h-7 text-[10px] flex-1 border-border">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {client.description || 'No description provided for this client account.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="bg-surface border-border shadow-card relative group">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Internal Notes
              </CardTitle>
              {!isEditingNotes && (
                <button
                  onClick={initNotesEdit}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-alt transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Edit Notes"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full min-h-[140px] bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed font-mono"
                    placeholder="Enter operational log details..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} size="sm" className="h-7 text-[10px] flex-1">Save</Button>
                    <Button onClick={() => setIsEditingNotes(false)} variant="outline" size="sm" className="h-7 text-[10px] flex-1 border-border">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {client.notes || 'No internal logs or notes added.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Projects, Tasks, Approvals & Invoices */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Projects & Tasks list */}
          <Card className="bg-surface border-border shadow-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <FolderKanban size={12} /> Projects & Associated Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clientProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No projects currently active for this client.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {clientProjects.map((project: any) => {
                    const projectTasks = clientTasks.filter((t: any) => t.projectId === project.id || t.projectId === project._id);
                    const doneCount = projectTasks.filter((t: any) => t.status === 'done').length;
                    const totalCount = projectTasks.length;
                    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                    
                    return (
                      <div key={project.id ?? project._id} className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm text-foreground block">{project.name}</span>
                            <span className="text-[10px] text-muted-foreground">Due date: {project.dueDate}</span>
                          </div>
                          <span className={cn(
                            'text-[9px] font-semibold px-2 py-0.5 rounded-full border self-start sm:self-auto uppercase tracking-wider',
                            project.status === 'active' ? 'badge-success' :
                            project.status === 'on_hold' ? 'badge-warning' :
                            'badge-neutral'
                          )}>
                            {project.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Tasks Complete</span>
                            <span className="font-semibold text-foreground">
                              {doneCount}/{totalCount} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-2.5 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-semibold text-subtle-foreground">Tasks</span>
                            <Button
                              onClick={() => setIsCreatingTaskForProjectId(project.id ?? project._id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-primary hover:text-primary-hover hover:bg-primary-soft rounded border border-primary-soft-border/50 gap-1 font-semibold"
                            >
                              <Plus size={10} /> Add Task
                            </Button>
                          </div>
                          
                          {projectTasks.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic pl-1">No tasks created under this project.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                              {projectTasks.map((task: any) => (
                                <div
                                  key={task.id ?? task._id}
                                  className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg text-xs"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <button
                                      disabled={task.status === 'done'}
                                      onClick={() => handleOpenCompleteTask(task)}
                                      className={cn(
                                        "shrink-0 mt-0.5 transition-colors cursor-pointer",
                                        task.status === 'done' ? "cursor-default text-success" : "text-muted-foreground hover:text-success"
                                      )}
                                      title={task.status === 'done' ? 'Completed' : 'Mark task complete with proof'}
                                    >
                                      <CheckCircle2
                                        size={14}
                                        className={cn(
                                          task.status === 'done' ? "text-success fill-success/10" : "text-muted-foreground hover:scale-110"
                                        )}
                                      />
                                    </button>
                                    <span className={cn(
                                      "font-medium truncate",
                                      task.status === 'done' ? "text-muted-foreground line-through" : "text-foreground"
                                    )}>
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className={cn(
                                      "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase",
                                      task.priority === 'urgent' || task.priority === 'high' ? "text-danger bg-red-50 border border-red-200" :
                                      task.priority === 'medium' ? "text-warning bg-amber-50 border border-amber-200" :
                                      "text-muted-foreground bg-surface-alt border border-border"
                                    )}>
                                      {task.priority}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono">{task.dueDate}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unpaid Invoices */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <Receipt size={12} /> Outstanding Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {outstandingInvoices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">All invoices are paid. Thank you!</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{outstandingInvoices.length} outstanding invoice{outstandingInvoices.length !== 1 ? 's' : ''}</span>
                    <span className="text-sm font-semibold text-danger">{fmt(outstandingTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    {outstandingInvoices.map((inv: any) => (
                      <div
                        key={inv.id ?? inv._id}
                        className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg text-xs"
                      >
                        <div>
                          <span className="font-semibold text-foreground block">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-muted-foreground">Due: {inv.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase",
                            inv.status === 'overdue' ? "text-danger bg-red-50 border-red-200" : "text-warning bg-amber-50 border-amber-200"
                          )}>
                            {inv.status}
                          </span>
                          <span className="font-mono font-semibold text-foreground">{fmt(inv.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Pending Deliverable Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {pendingApprovals.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">No deliverables currently pending client sign-off.</p>
              ) : (
                <div className="space-y-2">
                  {pendingApprovals.map((appr: any) => (
                    <div
                      key={appr.id ?? appr._id}
                      className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground block">{appr.name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={9} /> Sent: {appr.submittedDate}</span>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase text-warning bg-amber-50 border-amber-200">
                        {appr.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
              <Trash2 size={16} className="text-danger" /> Delete Client Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to delete <strong>{client.company}</strong>? This action will permanently remove the client and all associated dashboards, invoicing snapshots, and retainers. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              onClick={() => setIsDeleteConfirmOpen(false)}
              variant="outline"
              className="text-xs border-border h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClient}
              className="bg-danger text-white hover:bg-danger/90 text-xs h-8 border-none"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Create Task Dialog --- */}
      <Dialog open={isCreatingTaskForProjectId !== null} onOpenChange={open => !open && setIsCreatingTaskForProjectId(null)}>
        <DialogContent className="sm:max-w-sm bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
              <Plus size={16} className="text-primary" /> Create Project Task
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground">
              Add a new deliverable item to the project timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground">Task Title</Label>
              <Input
                placeholder="Write logo guidelines, export source assets..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="h-8 text-xs text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">Priority</Label>
                <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="h-8 text-xs text-foreground cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4 pt-2">
            <Button
              onClick={() => setIsCreatingTaskForProjectId(null)}
              variant="outline"
              className="text-xs border-border h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              className="text-xs h-8 bg-primary text-white hover:bg-primary-hover border-none"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Complete Task with Proof Dialog --- */}
      <Dialog open={isCompletingTaskId !== null} onOpenChange={open => !open && setIsCompletingTaskId(null)}>
        <DialogContent className="sm:max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success" /> Complete Task & Submit Proof
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground">
              Provide visual or written evidence of project delivery to log with client details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            
            {/* Written proof textarea */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-muted-foreground">Proof of Work (Link or Description)</Label>
              <textarea
                placeholder="Add Figma file links, GitHub Pull Request link, or notes regarding files delivered..."
                value={completionProof}
                onChange={e => setCompletionProof(e.target.value)}
                className="w-full min-h-[90px] bg-background border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* File Drag-and-drop dropzone */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-muted-foreground">Attachments (Assets, Screenshots)</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border border-dashed border-border rounded-lg p-5 text-center flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
                  isDragOver ? "bg-primary-soft border-primary" : "bg-background hover:bg-sidebar/50"
                )}
                onClick={triggerMockUpload}
              >
                <Upload size={20} className={cn("transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="text-[10px] font-semibold text-foreground">Drag & drop files here, or click to upload</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Supports PNG, PDF, JPG, ZIP</p>
                </div>
              </div>
              
              {/* Show attached files list */}
              {mockFilesUploaded.length > 0 && (
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Attached Files:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mockFilesUploaded.map((fName, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sidebar border border-border text-foreground font-medium">
                        <FileText size={10} className="text-muted-foreground" /> {fName}
                        <button onClick={(e) => { e.stopPropagation(); setMockFilesUploaded(prev => prev.filter((_, idx) => idx !== i)); }} className="hover:text-danger">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications selection toggles */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Notification Dispatch</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyClient}
                    onChange={() => setNotifyClient(prev => !prev)}
                    className="rounded border-border focus:ring-0 focus:ring-offset-0 accent-primary h-3.5 w-3.5"
                  />
                  <span>Notify Client Contact (<strong>{client.contact}</strong> · {client.email})</span>
                </label>
                
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyTeam}
                    onChange={() => setNotifyTeam(prev => !prev)}
                    className="rounded border-border focus:ring-0 focus:ring-offset-0 accent-primary h-3.5 w-3.5"
                  />
                  <span>Notify Assigned Team Members (JR, ML, PK)</span>
                </label>
              </div>
            </div>

          </div>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4 pt-2">
            <Button
              onClick={() => setIsCompletingTaskId(null)}
              variant="outline"
              className="text-xs border-border h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTask}
              className="text-xs h-8 bg-success hover:bg-success/95 text-white border-none gap-1.5"
            >
              <Send size={12} /> Submit Proof & Close Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Notification Dispatch Dispatch Success Overlay Dialog --- */}
      <Dialog open={activeAlert !== null} onOpenChange={open => !open && setActiveAlert(null)}>
        <DialogContent className="sm:max-w-md bg-surface border-border border shadow-2xl">
          <DialogHeader className="border-b border-border pb-3 flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
              <Send size={16} className="text-success" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-sm font-semibold">
                Alerts & Notifications Dispatched
              </DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
                Simulated emails and team alerts have been dispatched.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          {activeAlert && (
            <div className="space-y-4 pt-4 text-xs">
              
              {/* Client Mail Block */}
              {notifyClient && (
                <div className="rounded-lg border border-border bg-sidebar/50 p-3 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-success flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Sent to Client via SMTP
                  </span>
                  <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                    <div><strong>To:</strong> {activeAlert.clientEmail}</div>
                    <div><strong>Subject:</strong> Task Complete: "{activeAlert.taskTitle}"</div>
                    <div className="pt-1 border-t border-border/40 mt-1">
                      <strong>Body:</strong> The team has completed this task. Attached proof details: "{activeAlert.proof}"
                    </div>
                  </div>
                </div>
              )}

              {/* Team chat block */}
              {notifyTeam && (
                <div className="rounded-lg border border-border bg-sidebar/50 p-3 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Dispatched to Slack Channel
                  </span>
                  <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                    <div><strong>Channel:</strong> #project-delivery</div>
                    <div><strong>Message:</strong> 🚀 Task <strong>"{activeAlert.taskTitle}"</strong> marked as done by <strong>US</strong>.</div>
                    <div><strong>Pinged:</strong> {activeAlert.teamList}</div>
                  </div>
                </div>
              )}

              {/* Proof logged info block */}
              <div className="space-y-1 pl-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Proof Details Logged:</span>
                <p className="text-xs text-foreground bg-background border border-border rounded p-2.5 font-mono italic whitespace-pre-wrap">
                  {activeAlert.proof || 'No written proof added.'}
                </p>
                {activeAlert.files.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground block">Logged Attachments:</span>
                    <div className="flex flex-wrap gap-1 text-[9px]">
                      {activeAlert.files.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          <DialogFooter className="mt-4 pt-3 border-t border-border">
            <Button
              onClick={() => setActiveAlert(null)}
              className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs h-8 border-none"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
