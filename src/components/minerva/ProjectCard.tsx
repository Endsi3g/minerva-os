import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import type { Project, ProjectStatus } from '@/lib/types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; class: string }> = {
  active:    { label: 'Active',     class: 'text-sage bg-sage/10' },
  on_hold:   { label: 'On Hold',    class: 'text-warm bg-warm/10' },
  completed: { label: 'Completed',  class: 'text-fog  bg-fog/10'  },
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const pct = project.totalTasks > 0
    ? Math.round((project.doneTasks / project.totalTasks) * 100)
    : 0;
  const budgetPct = project.budget > 0
    ? Math.min(Math.round((project.spent / project.budget) * 100), 100)
    : 0;
  const status = STATUS_CONFIG[project.status];
  const budgetColor = budgetPct >= 90 ? 'bg-ember' : budgetPct >= 70 ? 'bg-warm' : 'bg-sage';

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 cursor-pointer hover:border-white/15 hover:bg-dusk/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ivory truncate">{project.name}</p>
          <p className="text-xs text-fog mt-0.5">{project.client}</p>
        </div>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5', status.class)}>
          {status.label}
        </span>
      </div>

      {/* Task progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-fog">
          <span>Progress</span>
          <span>{project.doneTasks}/{project.totalTasks} tasks · {pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-dusk overflow-hidden">
          <div className="h-full rounded-full bg-ivory/70 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-fog">
          <span>Budget</span>
          <span>{fmt(project.spent)} / {fmt(project.budget)}</span>
        </div>
        <div className="h-1 rounded-full bg-dusk overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', budgetColor)} style={{ width: `${budgetPct}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {/* Team avatars */}
        <div className="flex -space-x-1.5">
          {project.team.slice(0, 4).map(member => (
            <Avatar key={member} className="h-6 w-6 ring-1 ring-card">
              <AvatarFallback className="text-[8px]">{member}</AvatarFallback>
            </Avatar>
          ))}
          {project.team.length > 4 && (
            <Avatar className="h-6 w-6 ring-1 ring-card">
              <AvatarFallback className="text-[8px]">+{project.team.length - 4}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1 text-[10px] text-fog">
          <CalendarDays size={10} />
          {new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
}
