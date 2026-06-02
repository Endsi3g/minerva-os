'use client';
import { useState, useEffect } from 'react';
import { PackageCheck, ArrowRight, CheckCircle2, Circle, ListTodo, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

export default function Fulfillment() {
  const { t } = useLang();
  const fl = t.app.fulfillmentModule;

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadDeliveries() {
      const { data } = await supabase
        .from('fulfillment')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) {
        setDeliveries(data.map(d => ({
          ...d,
          _id: d.id,
          serviceType: d.service_type,
          projectId: d.project_id,
        })));
      }
    }
    loadDeliveries();
  }, [workspaceId]);

  const activeDelivery = deliveries.find((d: any) => d._id === activeId);

  const toggleItem = async (deliveryId: string, itemIndex: number) => {
    const delivery = deliveries.find((d: any) => d._id === deliveryId);
    if (!delivery) return;

    const newChecklist = [...delivery.checklist];
    newChecklist[itemIndex] = { ...newChecklist[itemIndex], done: !newChecklist[itemIndex].done };

    const doneCount = newChecklist.filter((i: any) => i.done).length;
    const progress = Math.round((doneCount / newChecklist.length) * 100);

    const { error } = await supabase
      .from('fulfillment')
      .update({
        checklist: newChecklist,
        progress,
        status: progress === 100 ? 'completed' : 'in_progress',
      })
      .eq('id', deliveryId);

    if (!error) {
      setDeliveries(prev =>
        prev.map(d =>
          d._id === deliveryId
            ? { ...d, checklist: newChecklist, progress, status: progress === 100 ? 'completed' : 'in_progress' }
            : d
        )
      );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <TextAnimate text={fl.title} type="calmInUp" className="text-3xl font-serif text-ivory tracking-tight" />
          <p className="text-sm text-fog mt-1">{deliveries.length} {fl.stats}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" className="rounded-full border-white/5 bg-white/5 hover:bg-white/10">
            <BarChart3 size={16} className="mr-2" /> {fl.metrics}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Deliveries List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-fog uppercase tracking-widest px-1">
            <Clock size={12} /> Recent Deliveries
          </div>
          <div className="space-y-3">
            {deliveries.length === 0 && (
              <p className="text-sm text-fog italic py-8 text-center bg-midnight/30 rounded-2xl border border-dashed border-white/10">
                No active fulfillments found.
              </p>
            )}
            {deliveries.map((delivery: any) => (
              <button
                key={delivery._id}
                onClick={() => setActiveId(delivery._id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border",
                  activeId === delivery._id
                    ? "bg-midnight border-white/10 ring-1 ring-white/5 shadow-xl"
                    : "bg-transparent border-transparent hover:bg-white/5"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold text-sage uppercase tracking-wider">{delivery.serviceType}</span>
                  <span className="text-[10px] text-fog">{delivery.progress}%</span>
                </div>
                <p className="text-sm font-medium text-ivory mb-3">Project Reference #{delivery.projectId.slice(0, 4)}</p>
                <Progress value={delivery.progress} className="h-1 bg-white/5" />
              </button>
            ))}
          </div>
        </div>

        {/* Fulfillment Detail - Notion Style */}
        <div className="lg:col-span-2">
          {activeDelivery ? (
            <Card className="bg-midnight/30 border-white/5 shadow-none p-8 rounded-3xl">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif text-ivory mb-2">{fl.delivery}</h2>
                  <p className="text-sm text-fog">Management and execution of {activeDelivery.serviceType} services.</p>
                </div>

                {/* Progress Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-fog mb-2">
                      <span>{fl.onboarding} Progress</span>
                      <span>{activeDelivery.progress}%</span>
                    </div>
                    <Progress value={activeDelivery.progress} className="h-1.5 bg-obsidian" />
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-white/5" />
                  <div className="sm:text-right">
                    <p className="text-[10px] text-fog uppercase font-semibold">Status</p>
                    <p className="text-sm text-sage font-medium">{activeDelivery.status.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-ivory flex items-center gap-2">
                    <ListTodo size={16} className="text-warm" /> {fl.checklist}
                  </h3>
                  <div className="grid grid-cols-1 gap-1">
                    {activeDelivery.checklist.map((item: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => toggleItem(activeDelivery._id, i)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] cursor-pointer group transition-colors"
                      >
                        {item.done ? (
                          <CheckCircle2 size={18} className="text-sage shrink-0" />
                        ) : (
                          <Circle size={18} className="text-fog group-hover:text-silver shrink-0" />
                        )}
                        <span className={cn("text-sm", item.done ? "text-fog line-through" : "text-silver group-hover:text-ivory")}>
                          {item.item}
                        </span>
                        <ArrowRight size={14} className="ml-auto text-fog opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-white/5 rounded-3xl p-12">
              <PackageCheck size={48} className="mb-4 text-fog" />
              <p className="text-lg font-serif">Select a project delivery</p>
              <p className="text-sm">Track every step of client fulfillment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
