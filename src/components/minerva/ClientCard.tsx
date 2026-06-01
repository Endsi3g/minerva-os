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
}

export function ClientCard({ client, onPortalLink, activePortalToken }: ClientCardProps) {
  const status = STATUS_CONFIG[client.status];
  const isPortalActive = activePortalToken && new Date(activePortalToken.expires_at) > new Date();

  return (
    <Card className="bg-card border-border rounded-xl p-5 space-y-4 hover:border-white/15 hover:bg-dusk/30 transition-colors shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-sm font-semibold">{initials(client.company)}</AvatarFallback>
        </Avatar>
        <Badge variant="outline" className={cn('text-[10px] font-semibold px-2 py-0.5 border-none rounded-full mt-0.5', status.class)}>
          {status.label}
        </Badge>
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
