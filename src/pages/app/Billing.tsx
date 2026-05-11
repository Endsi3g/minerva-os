import { Receipt } from 'lucide-react';

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center">
        <Icon size={20} className="text-fog" />
      </div>
      <div>
        <h2 className="text-lg font-medium text-ivory">{title}</h2>
        <p className="text-sm text-fog mt-1 max-w-xs">{subtitle}</p>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-dusk text-fog border border-border">Coming soon</span>
    </div>
  );
}

export default function Billing() {
  return <EmptyState icon={Receipt} title="Billing" subtitle="Invoice generation and retainer tracking coming soon." />;
}
