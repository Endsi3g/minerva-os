'use client';
import { useState, useEffect } from 'react';
import { Calendar, Video, BookOpen, Sparkles, Plus, CheckCircle2, Circle, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { Badge } from '@/components/ui/badge';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

export default function CallPreps() {
  const { t } = useLang();
  const cp = t.app.callPreps;

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const generateBrief = async (callId: string) => {
    if (generatingId) return;
    setGeneratingId(callId);
    try {
      const res = await fetch('/api/ai/call-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCalls(prev =>
        prev.map(c => c._id === callId ? {
          ...c,
          summary: data.summary,
          prepChecklist: data.prepChecklist,
          status: data.status,
        } : c)
      );
    } catch (err) {
      console.error('Failed to generate call brief:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadCalls() {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('start_time', { ascending: true });
      if (data) {
        setCalls(data.map(c => ({
          ...c,
          _id: c.id,
          startTime: c.start_time,
          endTime: c.end_time,
          prepChecklist: c.prep_checklist,
          notesUrl: c.notes_url,
        })));
      }
    }
    loadCalls();
  }, [workspaceId]);

  const selectedCall = calls.find((c: any) => c._id === selectedId);

  const toggleTask = async (callId: string, taskIndex: number) => {
    const call = calls.find((c: any) => c._id === callId);
    if (!call) return;
    const newList = [...call.prepChecklist];
    newList[taskIndex] = { ...newList[taskIndex], completed: !newList[taskIndex].completed };

    const { error } = await supabase
      .from('calls')
      .update({ prep_checklist: newList })
      .eq('id', callId);

    if (!error) {
      setCalls(prev =>
        prev.map(c => c._id === callId ? { ...c, prepChecklist: newList } : c)
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 lg:gap-8 max-w-7xl mx-auto">
      {/* Sidebar: Upcoming Calls */}
      <div className="w-full lg:w-80 lg:shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-ivory">{cp.title}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-fog hover:text-ivory">
            <Plus size={16} />
          </Button>
        </div>

        <div className="space-y-2">
          {calls.length === 0 && (
            <p className="text-sm text-fog px-2">{cp.noMeetings}</p>
          )}
          {calls.map((call: any) => (
            <button
              key={call._id}
              onClick={() => setSelectedId(call._id)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all border",
                selectedId === call._id 
                  ? "bg-midnight border-white/10 ring-1 ring-white/5 shadow-xl" 
                  : "bg-transparent border-transparent hover:bg-white/5 text-fog hover:text-ivory"
              )}
            >
              <p className="text-sm font-medium truncate">{call.title}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] opacity-60">
                <Calendar size={10} />
                <span>{new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="mx-1">·</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-white/10 font-normal">
                  {call.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Preparation Area */}
      <div className="flex-1 min-w-0 bg-midnight/30 rounded-3xl border border-white/5 p-4 md:p-8 overflow-y-auto">
        {selectedCall ? (
          <div className="space-y-10">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-fog text-xs uppercase tracking-widest mb-2">
                <Video size={14} /> {cp.calendar}
              </div>
              <TextAnimate text={selectedCall.title} type="calmInUp" className="text-3xl font-serif text-ivory" />
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  {selectedCall.attendees.map((a: string, i: number) => (
                    <div key={i} className="h-6 w-6 rounded-full bg-dusk border border-obsidian flex items-center justify-center text-[10px] text-silver font-medium" title={a}>
                      {a[0]}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-fog">{selectedCall.attendees.join(', ')}</span>
              </div>
            </div>

            {/* Preparation Blocks - Notion Style */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checklist */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-ivory flex items-center gap-2">
                  <BookOpen size={16} className="text-sage" /> Preparation Checklist
                </h3>
                <div className="space-y-2">
                  {selectedCall.prepChecklist.map((item: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => toggleTask(selectedCall._id, i)}
                      className="flex items-start gap-3 group cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckCircle2 size={18} className="text-sage shrink-0" />
                      ) : (
                        <Circle size={18} className="text-fog group-hover:text-silver shrink-0" />
                      )}
                      <span className={cn("text-sm transition-colors", item.completed ? "text-fog line-through" : "text-silver group-hover:text-ivory")}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Summary Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-ivory flex items-center gap-2">
                  <Sparkles size={16} className="text-warm" /> {cp.aiSummary}
                </h3>
                <div className="bg-obsidian/50 rounded-2xl p-5 border border-white/5 space-y-4">
                  {generatingId === selectedCall._id ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-sage" />
                      <span className="text-xs text-fog italic animate-pulse">Hermes is compiling brief & checklist...</span>
                    </div>
                  ) : selectedCall.summary ? (
                    <p className="text-sm text-silver leading-relaxed italic">
                      "{selectedCall.summary}"
                    </p>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-fog italic">No summary generated yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 border-white/10 text-xs"
                        onClick={() => generateBrief(selectedCall._id)}
                      >
                        <Sparkles size={11} className="mr-1.5 text-warm" />
                        Generate AI Brief
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Integrations Bar */}
            <div className="pt-8 border-t border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-fog gap-3">
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Google Calendar Connected
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Granola Sync Active
                  </div>
                </div>
                {selectedCall.notesUrl && (
                  <a href={selectedCall.notesUrl} target="_blank" className="flex items-center gap-1.5 hover:text-ivory transition-colors">
                    {cp.granola} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Calendar size={48} className="mb-4" />
            <p className="text-lg font-serif">Select a meeting to prepare</p>
            <p className="text-sm">Strategic clarity begins with preparation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
