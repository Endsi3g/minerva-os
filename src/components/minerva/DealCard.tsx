import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Lead } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ProbBadge({ p }: { p: number }) {
  const color = p >= 70 ? 'text-sage bg-sage/10' : p >= 40 ? 'text-warm bg-warm/10' : 'text-fog bg-fog/10';
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium px-1.5 py-0.5 border-none rounded-full', color)}>
      {p}%
    </Badge>
  );
}

interface DealCardProps {
  lead: Lead;
  onEdit?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export function DealCard({ lead, onEdit, onDragStart }: DealCardProps) {
  return (
    <Card 
      draggable
      onDragStart={onDragStart}
      onClick={onEdit}
      className="bg-card border border-border rounded-md p-4 space-y-3 cursor-pointer hover:bg-secondary/40 transition-all select-none active:opacity-50 shadow-none"
    >
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
    </Card>
  );
}
