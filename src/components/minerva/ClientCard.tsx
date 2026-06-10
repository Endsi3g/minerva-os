import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FolderKanban, Mail, Link } from 'lucide-react';
import type { Client, ClientStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; class: string }> = {
  active:     { label: 'Active',     class: 'text-success bg-success/10 border border-success/20' },
  onboarding: { label: 'Onboarding', class: 'text-warning bg-warning/10 border border-warning/20' },
  lead:       { label: 'Lead',       class: 'text-muted-foreground bg-muted border border-border' },
  inactive:   { label: 'Inactive',   class: 'text-muted-foreground bg-muted border border-border'  },
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getClientHealthMetrics(company: string) {
  const name = company.toLowerCase();
  if (name.includes('acme')) {
    return {
      status: 'At Risk',
      nps: 5,
      overdueInvoices: 1200,
      delayedTasks: 4,
      openTickets: 1,
      badgeClass: 'text-danger bg-danger/10 border border-danger/20',
      dotClass: 'bg-danger',
    };
  } else if (name.includes('bolt')) {
    return {
      status: 'Fair',
      nps: 7,
      overdueInvoices: 450,
      delayedTasks: 1,
      openTickets: 0,
      badgeClass: 'text-warning bg-warning/10 border border-warning/20',
      dotClass: 'bg-warning',
    };
  } else {
    return {
      status: 'Good',
      nps: 9,
      overdueInvoices: 0,
      delayedTasks: 0,
      openTickets: 0,
      badgeClass: 'text-success bg-success/10 border border-success/20',
      dotClass: 'bg-success',
    };
  }
}

interface ClientCardProps {
  client: Client;
  onPortalLink?: (clientId: string) => void;
  activePortalToken?: any;
  onClick?: () => void;
}

export function ClientCard({ client, onPortalLink, activePortalToken, onClick }: ClientCardProps) {
  const status = STATUS_CONFIG[client.status];
  const isPortalActive = activePortalToken && new Date(activePortalToken.expires_at) > new Date();
  const health = getClientHealthMetrics(client.company);

  return (
    <Card 
      onClick={onClick} 
      className={cn(
        'bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border-strong hover:bg-surface-alt/50 transition-all duration-300 shadow-sm hover:shadow-md select-none', 
        onClick && 'cursor-pointer'
      )}
    >
      {/* Header with Avatar, Name, Industry and Badges */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 border border-border">
            <AvatarFallback className="text-sm font-semibold text-foreground bg-border/20">{initials(client.company)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{client.company}</p>
            <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={cn('text-[9px] font-semibold px-2 py-0.5 border-none rounded-full uppercase tracking-wider', status.class)}>
            {status.label}
          </Badge>
          
          <div className="relative group/health">
            <span className={cn(
              "cursor-help px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all",
              health.badgeClass
            )}>
              <span className={cn("h-1 w-1 rounded-full shrink-0", health.dotClass)} />
              {health.status}
            </span>
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 hidden group-hover/health:block w-48 p-3 rounded-xl border border-border bg-surface shadow-lg text-left text-[10px] text-muted-foreground z-50">
              <p className="font-semibold text-foreground mb-1.5 border-b border-border pb-1">Account Health Breakdown</p>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>NPS Rating:</span>
                  <span className="text-foreground font-bold">{health.nps}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Bills:</span>
                  <span className={health.overdueInvoices > 0 ? "text-danger font-bold" : "text-success font-bold"}>
                    ${health.overdueInvoices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delayed Tasks:</span>
                  <span className={health.delayedTasks > 0 ? "text-warning font-bold" : "text-success font-bold"}>
                    {health.delayedTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Open Tickets:</span>
                  <span className={health.openTickets > 0 ? "text-warning font-bold" : "text-success font-bold"}>
                    {health.openTickets}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Snippet (Circled Zone 2) */}
      <div className="min-h-[2.5rem] flex items-center">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {client.description || 'No description provided for this client account.'}
        </p>
      </div>

      {/* Contact Details */}
      <div className="space-y-1 pt-1 text-xs border-t border-border/50">
        <p className="text-foreground font-medium">{client.contact}</p>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail size={12} className="shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
      </div>

      {/* Stats & Portal Link Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderKanban size={12} className="text-muted-foreground" />
          <span>{client.activeProjects} project{client.activeProjects !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {onPortalLink && (
            <Button
              variant={isPortalActive ? 'outline' : 'ghost'}
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] gap-1 transition-all duration-200 border-border text-muted-foreground hover:text-foreground",
                isPortalActive && "text-success bg-success/5 border-success/20 hover:bg-success/10 hover:text-success"
              )}
              onClick={e => { e.stopPropagation(); onPortalLink(client.id); }}
            >
              <span className={cn("w-1 h-1 rounded-full shrink-0", isPortalActive ? "bg-success" : "bg-transparent")} />
              <Link size={10} />
              Portal
            </Button>
          )}
          <p className="text-xs font-semibold text-foreground">
            {client.monthlyValue > 0 ? `${fmt(client.monthlyValue)}/mo` : 'No retainer'}
          </p>
        </div>
      </div>
    </Card>
  );
}
