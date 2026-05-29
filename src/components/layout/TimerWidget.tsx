'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

interface TimerWidgetProps {
  collapsed: boolean;
}

export function TimerWidget({ collapsed }: TimerWidgetProps) {
  const { user } = useAuth();
  const userId = user?.email ?? 'anonymous';

  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);

  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  // Fetch active timer
  useEffect(() => {
    if (!userId) return;
    async function loadActiveTimer() {
      const { data } = await supabase
        .from('active_timers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setActiveTimer({
          ...data,
          _id: data.id,
          startTime: Number(data.start_time),
        });
      } else {
        setActiveTimer(null);
      }
    }
    loadActiveTimer();
  }, [userId]);

  // Fetch projects
  useEffect(() => {
    if (!workspaceId) return;
    supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => {
        if (data) {
          setProjects(data.map(p => ({ ...p, _id: p.id })));
        }
      });
  }, [workspaceId]);

  // Fetch project tasks
  useEffect(() => {
    if (!selectedProjectId) {
      setProjectTasks([]);
      return;
    }
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', selectedProjectId)
      .then(({ data }) => {
        if (data) {
          setProjectTasks(data.map(t => ({ ...t, _id: t.id })));
        }
      });
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeTimer) {
      setElapsed(Date.now() - activeTimer.startTime);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - activeTimer.startTime);
      }, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  async function handleStart() {
    if (!workspaceId || !description.trim()) return;
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('active_timers')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        description: description.trim(),
        project_id: selectedProjectId || null,
        task_id: selectedTaskId || null,
        start_time: startTime,
      })
      .select()
      .single();

    if (!error && data) {
      setActiveTimer({
        ...data,
        _id: data.id,
        startTime: Number(data.start_time),
      });
      setDescription('');
      setSelectedProjectId('');
      setSelectedTaskId('');
      setShowForm(false);
    }
  }

  async function handleStop() {
    if (!workspaceId || !activeTimer) return;
    const endTime = Date.now();
    const duration = endTime - activeTimer.startTime;

    // Create time entry
    await supabase.from('time_entries').insert({
      workspace_id: workspaceId,
      user_id: userId,
      project_id: activeTimer.project_id || null,
      task_id: activeTimer.task_id || null,
      description: activeTimer.description,
      start_time: activeTimer.startTime,
      end_time: endTime,
      duration: duration,
      billable: false,
    });

    // Delete active timer
    await supabase.from('active_timers').delete().eq('id', activeTimer._id);
    setActiveTimer(null);
  }

  async function handleCancel() {
    if (!activeTimer) return;
    await supabase.from('active_timers').delete().eq('id', activeTimer._id);
    setActiveTimer(null);
  }

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <button
          onClick={() => activeTimer ? handleStop() : setShowForm(v => !v)}
          className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
            activeTimer
              ? 'bg-sage/20 text-sage hover:bg-sage/30'
              : 'text-fog hover:text-ivory hover:bg-white/5'
          )}
          title={activeTimer ? formatElapsed(elapsed) : 'Start timer'}
        >
          {activeTimer ? <Square size={13} /> : <Clock size={13} />}
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      {activeTimer ? (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(127,163,138,0.08)', border: '1px solid rgba(127,163,138,0.15)' }}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
          </span>
          <span className="flex-1 min-w-0">
            <p className="text-[11px] font-mono text-sage font-medium">{formatElapsed(elapsed)}</p>
            <p className="text-[9px] text-fog truncate">{activeTimer.description}</p>
          </span>
          <button onClick={handleStop} className="text-sage hover:text-ivory transition-colors shrink-0" title="Stop timer">
            <Square size={12} />
          </button>
          <button onClick={handleCancel} className="text-fog hover:text-ember transition-colors shrink-0" title="Cancel">
            <X size={10} />
          </button>
        </div>
      ) : showForm ? (
        <div
          className="rounded-lg px-3 py-2 space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <input
            autoFocus
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleStart(); if (e.key === 'Escape') setShowForm(false); }}
            placeholder="What are you working on?"
            className="w-full text-[11px] bg-transparent text-ivory placeholder:text-fog outline-none"
          />

          <select
            value={selectedProjectId}
            onChange={e => {
              setSelectedProjectId(e.target.value);
              setSelectedTaskId('');
            }}
            className="w-full text-[10px] bg-midnight text-silver border border-white/5 rounded-md p-1 outline-none cursor-pointer"
          >
            <option value="" className="bg-midnight text-fog">Select Project (optional)</option>
            {projects.map((p: any) => (
              <option key={p._id} value={p._id} className="bg-midnight text-silver">
                {p.name}
              </option>
            ))}
          </select>

          {selectedProjectId && (
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              className="w-full text-[10px] bg-midnight text-silver border border-white/5 rounded-md p-1 outline-none cursor-pointer"
            >
              <option value="" className="bg-midnight text-fog">Select Task (optional)</option>
              {projectTasks.map((t: any) => (
                <option key={t._id} value={t._id} className="bg-midnight text-silver">
                  {t.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={handleStart}
              disabled={!description.trim()}
              className="h-6 px-2 text-[10px] flex-1 bg-sage/20 hover:bg-sage/30 text-sage border-0"
            >
              <Play size={9} />
              Start
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setSelectedProjectId('');
                setSelectedTaskId('');
              }}
              className="h-6 px-2 text-[10px] text-fog"
            >
              <X size={9} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-fog hover:text-ivory hover:bg-white/5 transition-colors text-[11px]"
        >
          <Clock size={12} className="shrink-0" />
          <span>Start timer</span>
        </button>
      )}
    </div>
  );
}
