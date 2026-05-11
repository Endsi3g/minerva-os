import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, ClipboardCheck, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const kpis = [
  { label: 'Active Projects', value: '12', delta: '+2 this month', icon: FolderKanban, color: 'text-sage' },
  { label: 'Open Tasks',       value: '48', delta: '6 due today',   icon: CheckSquare,  color: 'text-warm' },
  { label: 'Pending Approvals',value: '5',  delta: '2 urgent',      icon: ClipboardCheck, color: 'text-ember' },
  { label: 'Revenue MTD',      value: '$42k', delta: '+18% vs last month', icon: DollarSign, color: 'text-silver' },
];

function ActivityFeed() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-fog pt-4">Activity will appear here once you start working.</p>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'New Project',   to: '/app/projects' },
  { label: 'Add Client',    to: '/app/clients' },
  { label: 'Add Deal',      to: '/app/pipeline' },
  { label: 'Send Invoice',  to: '/app/billing' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-ivory">{greeting}, Uprising Studio</h1>
        <p className="text-sm text-fog mt-1">Here's what's happening across your workspace today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-fog">{kpi.label}</CardTitle>
                <kpi.icon size={14} className={kpi.color} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-ivory">{kpi.value}</p>
              <p className="text-xs text-fog mt-1">{kpi.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-ivory">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-ivory">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg text-silver hover:bg-dusk hover:text-ivory transition-colors"
              >
                {action.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
