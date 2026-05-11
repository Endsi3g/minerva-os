import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Lead } from '@/lib/types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ProbBadge({ p }: { p: number }) {
  const color = p >= 70 ? 'text-sage bg-sage/10' : p >= 40 ? 'text-warm bg-warm/10' : 'text-fog bg-fog/10';
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', color)}>
      {p}%
    </span>
  );
}

interface DealCardProps {
  lead: Lead;
}

export function DealCard({ lead }: DealCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 cursor-pointer hover:border-white/15 hover:bg-dusk/40 transition-colors select-none">
      {/* Company + value */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ivory leading-tight">{lead.company}</p>
        <p className="text-sm font-semibold text-ivory shrink-0">{fmt(lead.value)}</p>
      </div>

      {/* Contact */}
      <p className="text-xs text-fog">{lead.contact}</p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ProbBadge p={lead.probability} />
          {lead.daysInStage > 0 && (
            <span className="text-[10px] text-fog">{lead.daysInStage}d</span>
          )}
        </div>
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-[8px]">{lead.owner}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
