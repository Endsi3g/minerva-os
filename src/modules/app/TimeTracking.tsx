'use client';
import { useState } from 'react';
import { Clock, Download, Filter as FilterIcon, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupByDay(entries: any[]) {
  const groups: Record<string, any[]> = {};
  for (const entry of entries) {
    const key = new Date(entry.startTime).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.entries(groups).sort((a, b) => {
    const aTime = a[1][0]?.startTime ?? 0;
    const bTime = b[1][0]?.startTime ?? 0;
    return bTime - aTime;
  });
}

type Filter = 'week' | 'month' | 'all';

export default function TimeTracking() {
  const [filter, setFilter] = useState<Filter>('week');

  const workspaceList = useQuery(api.workspaces.list, {});
  const workspace = workspaceList?.[0];
  const entries = useQuery(
    api.timeEntries.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  ) ?? [];
  const removeEntry = useMutation(api.timeEntries.remove);

  const now = Date.now();
  const cutoffs: Record<Filter, number> = {
    week: now - 7 * 24 * 60 * 60 * 1000,
    month: now - 30 * 24 * 60 * 60 * 1000,
    all: 0,
  };

  const filtered = entries.filter((e: any) => e.startTime >= cutoffs[filter]);
  const grouped = groupByDay(filtered);

  const totalMinutes = filtered.reduce((acc: number, e: any) => acc + e.duration, 0);
  const billableMinutes = filtered.filter((e: any) => e.billable).reduce((acc: number, e: any) => acc + e.duration, 0);
  const nonBillable = totalMinutes - billableMinutes;

  function exportCSV() {
    const rows = [
      ['Date', 'Start', 'End', 'Duration (min)', 'Description', 'Billable', 'Rate'],
      ...filtered.map((e: any) => [
        new Date(e.startTime).toLocaleDateString(),
        formatTime(e.startTime),
        formatTime(e.endTime),
        e.duration,
        e.description,
        e.billable ? 'Yes' : 'No',
        e.hourlyRate ?? '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Time Tracking</h1>
          <p className="text-sm text-fog mt-0.5">Track billable hours across projects and clients.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={exportCSV} className="text-fog hover:text-ivory gap-1.5">
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Hours', value: formatDuration(totalMinutes), sub: `${filter === 'week' ? 'this week' : filter === 'month' ? 'this month' : 'all time'}` },
          { label: 'Billable', value: formatDuration(billableMinutes), sub: totalMinutes ? `${Math.round(billableMinutes / totalMinutes * 100)}% of total` : '0%' },
          { label: 'Non-billable', value: formatDuration(nonBillable), sub: 'internal / admin' },
          { label: 'Entries', value: String(filtered.length), sub: 'time records' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="rounded-xl p-4"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] text-fog uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl font-semibold text-ivory">{kpi.value}</p>
            <p className="text-[11px] text-fog/70 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4">
        <FilterIcon size={14} className="text-fog mr-2" />
        {(['week', 'month', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs transition-colors',
              filter === f
                ? 'bg-sage/20 text-sage'
                : 'text-fog hover:text-ivory hover:bg-white/5'
            )}
          >
            {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Grouped entries */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock size={40} className="text-fog/30 mb-4" />
          <p className="text-fog text-sm">No time entries yet.</p>
          <p className="text-fog/60 text-xs mt-1">Use the timer in the sidebar to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEntries]) => {
            const dayTotal = dayEntries.reduce((acc: number, e: any) => acc + e.duration, 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-silver">{formatDate(dayEntries[0].startTime)}</span>
                  <span className="text-xs text-fog">{formatDuration(dayTotal)}</span>
                </div>
                <div
                  className="rounded-xl overflow-hidden divide-y"
                  style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  {dayEntries.map((entry: any) => (
                    <div key={entry._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ivory truncate">{entry.description}</p>
                        <p className="text-[11px] text-fog mt-0.5">
                          {formatTime(entry.startTime)} · {formatTime(entry.endTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            'text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                            entry.billable
                              ? 'bg-sage/10 text-sage'
                              : 'bg-fog/10 text-fog'
                          )}
                        >
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </span>
                        <span className="text-sm font-mono text-silver w-12 text-right">
                          {formatDuration(entry.duration)}
                        </span>
                        <button
                          onClick={() => removeEntry({ id: entry._id })}
                          className="opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
