import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import type { Project, ProjectStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; class: string }> = {
  active:    { label: 'Active',     class: 'text-success bg-success/10 border border-success/20' },
  on_hold:   { label: 'On Hold',    class: 'text-warning bg-warning/10 border border-warning/20' },
  completed: { label: 'Completed',  class: 'text-muted-foreground bg-muted border border-border' },
};

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const pct = project.totalTasks > 0
    ? Math.round((project.doneTasks / project.totalTasks) * 100)
    : 0;
  const budgetPct = project.budget > 0
    ? Math.min(Math.round((project.spent / project.budget) * 100), 100)
    : 0;
  const status = STATUS_CONFIG[project.status];
  const budgetColor = budgetPct >= 90 ? 'bg-danger' : budgetPct >= 70 ? 'bg-warning' : 'bg-success';

  return (
    <Card 
      onClick={onClick} 
      className="bg-card border border-border rounded-xl p-5 space-y-4 cursor-pointer hover:border-border-strong hover:bg-surface-alt/50 transition-all duration-300 shadow-sm hover:shadow-md select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
        </div>
        <Badge variant="outline" className={cn('text-[9px] font-semibold px-2 py-0.5 border-none rounded-full shrink-0 mt-0.5 uppercase tracking-wider', status.class)}>
          {status.label}
        </Badge>
      </div>

      {/* Task progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium text-foreground">{project.doneTasks}/{project.totalTasks} tasks · {pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5 bg-border/40" />
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Budget spent</span>
          <span className="font-medium text-foreground">{fmt(project.spent)} / {fmt(project.budget)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', budgetColor)} style={{ width: `${budgetPct}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Team avatars */}
        <div className="flex -space-x-1.5">
          {project.team.slice(0, 4).map(member => (
            <Avatar key={member} className="h-6 w-6 ring-2 ring-card border border-border">
              <AvatarFallback className="text-[8px] font-semibold bg-sidebar text-foreground">{member}</AvatarFallback>
            </Avatar>
          ))}
          {project.team.length > 4 && (
            <Avatar className="h-6 w-6 ring-2 ring-card border border-border">
              <AvatarFallback className="text-[8px] font-semibold bg-sidebar text-foreground">+{project.team.length - 4}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <CalendarDays size={12} className="text-muted-foreground" />
          <span>Due {new Date(project.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </Card>
  );
}
