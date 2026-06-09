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
  active:     { label: 'Active',     class: 'text-sage bg-sage/10' },
  onboarding: { label: 'Onboarding', class: 'text-warm bg-warm/10' },
  lead:       { label: 'Lead',       class: 'text-silver bg-silver/10' },
  inactive:   { label: 'Inactive',   class: 'text-fog  bg-fog/10'  },
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface ClientCardProps {
  client: Client;
  onPortalLink?: (clientId: string) => void;
  activePortalToken?: any;
  onClick?: () => void;
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
      badgeClass: 'text-ember bg-[#A86A6A]/10 border-[#A86A6A]/20',
      dotClass: 'bg-ember',
    };
  } else if (name.includes('bolt')) {
    return {
      status: 'Fair',
      nps: 7,
      overdueInvoices: 450,
      delayedTasks: 1,
      openTickets: 0,
      badgeClass: 'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20',
      dotClass: 'bg-warm',
    };
  } else {
    return {
      status: 'Good',
      nps: 9,
      overdueInvoices: 0,
      delayedTasks: 0,
      openTickets: 0,
      badgeClass: 'text-sage bg-[#7FA38A]/10 border-[#7FA38A]/20',
      dotClass: 'bg-sage',
    };
  }
}

export function ClientCard({ client, onPortalLink, activePortalToken, onClick }: ClientCardProps) {
  const status = STATUS_CONFIG[client.status];
  const isPortalActive = activePortalToken && new Date(activePortalToken.expires_at) > new Date();
  const health = getClientHealthMetrics(client.company);

  return (
    <Card onClick={onClick} className={cn('bg-card border-border rounded-xl p-5 space-y-4 hover:border-white/15 hover:bg-dusk/30 transition-colors shadow-none', onClick && 'cursor-pointer')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-sm font-semibold">{initials(client.company)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className={cn('text-[10px] font-semibold px-2 py-0.5 border-none rounded-full', status.class)}>
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
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 hidden group-hover/health:block w-48 p-3 rounded-xl border border-white/10 bg-[#171C2A] shadow-2xl text-left text-[10px] text-silver z-50">
              <p className="font-semibold text-ivory mb-1.5 border-b border-white/5 pb-1">Account Health Breakdown</p>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>NPS Rating:</span>
                  <span className="text-ivory font-bold">{health.nps}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Bills:</span>
                  <span className={health.overdueInvoices > 0 ? "text-ember font-bold" : "text-sage font-bold"}>
                    ${health.overdueInvoices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delayed Tasks:</span>
                  <span className={health.delayedTasks > 0 ? "text-warm font-bold" : "text-sage"}>
                    {health.delayedTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Open Tickets:</span>
                  <span className={health.openTickets > 0 ? "text-warm font-bold" : "text-sage"}>
                    {health.openTickets}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Name + industry */}
      <div>
        <p className="text-sm font-semibold text-ivory">{client.company}</p>
        <p className="text-xs text-fog mt-0.5">{client.industry}</p>
      </div>

      {/* Contact */}
      <div className="space-y-1">
        <p className="text-xs text-silver">{client.contact}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-fog">
          <Mail size={10} />
          {client.email}
        </div>
      </div>

      {/* Stats + portal link */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-fog">
          <FolderKanban size={12} />
          <span>{client.activeProjects} project{client.activeProjects !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {onPortalLink && (
            <Button
              variant={isPortalActive ? 'outline' : 'ghost'}
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] gap-1 transition-all duration-200",
                isPortalActive
                  ? "text-[#7FA38A] bg-[#7FA38A]/5 border-[#7FA38A]/20 hover:bg-[#7FA38A]/10 hover:text-[#7FA38A]"
                  : "text-fog hover:text-ivory"
              )}
              onClick={e => { e.stopPropagation(); onPortalLink(client.id); }}
            >
              <span className={cn("w-1 h-1 rounded-full shrink-0", isPortalActive ? "bg-[#7FA38A]" : "bg-transparent")} />
              <Link size={10} />
              Portal
            </Button>
          )}
          <p className="text-xs font-medium text-ivory">
            {client.monthlyValue > 0 ? `${fmt(client.monthlyValue)}/mo` : 'No retainer'}
          </p>
        </div>
      </div>
    </Card>
  );
}
