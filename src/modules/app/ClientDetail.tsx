'use client';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  FolderKanban,
  Receipt,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaces, useClients, useProjects, useInvoices, useApprovals, useTasks } from '@/lib/hooks/useSupabase';
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

  if (isLoading || !client) {
    return <DetailSkeleton />;
  }

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">
      
      {/* Header with back navigation */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
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

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Metadata, Description & Notes */}
        <div className="space-y-6">
          
          {/* Contact Details Card */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building size={12} /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
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
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {client.description || 'No description provided for this client account.'}
              </p>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {client.notes || 'No internal logs or notes added.'}
              </p>
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
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] uppercase font-semibold text-subtle-foreground block">Tasks</span>
                          {projectTasks.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">No tasks created under this project.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                              {projectTasks.map((task: any) => (
                                <div
                                  key={task.id ?? task._id}
                                  className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg text-xs"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <CheckCircle2
                                      size={14}
                                      className={cn(
                                        "shrink-0 mt-0.5",
                                        task.status === 'done' ? "text-success fill-success/10" : "text-muted-foreground"
                                      )}
                                    />
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
    </div>
  );
}
