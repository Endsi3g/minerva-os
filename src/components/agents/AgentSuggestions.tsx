'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { MorphSurface } from '@/components/ui/morph-surface';
import { TextureButton } from '@/components/ui/texture-button';

export function AgentSuggestions({ workspaceId }: { workspaceId: any }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    async function loadSuggestions() {
      const { data } = await supabase
        .from('agent_suggestions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setSuggestions(data.map(s => ({
          ...s,
          _id: s.id,
        })));
      }
    }
    loadSuggestions();
  }, [workspaceId]);

  async function approve(suggestionId: string) {
    const { error } = await supabase
      .from('agent_suggestions')
      .update({ status: 'approved' })
      .eq('id', suggestionId);

    if (!error) {
      setSuggestions(prev => prev.filter(s => s._id !== suggestionId));
    }
  }

  async function reject(suggestionId: string) {
    const { error } = await supabase
      .from('agent_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId);

    if (!error) {
      setSuggestions(prev => prev.filter(s => s._id !== suggestionId));
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-sage" />
        <h2 className="text-sm font-semibold text-ivory uppercase tracking-widest">
          Minerva Intelligence
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {suggestions.map((s: any, index: number) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="w-full flex justify-center items-end"
            >
              <MorphSurface
                collapsedWidth="auto"
                collapsedHeight={96}
                expandedWidth={340}
                expandedHeight={220}
                triggerLabel={s.title}
                className="w-full"
                renderTrigger={({ onClick }) => (
                  <Card 
                    onClick={onClick}
                    className="glass-card overflow-hidden border-white/5 bg-midnight hover:border-white/10 transition-colors w-full h-24 flex flex-col justify-center px-4 cursor-pointer"
                  >
                    <CardHeader className="p-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold text-ivory flex items-center gap-1.5">
                          {s.title}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/10 text-sage uppercase tracking-wider">
                            AI Suggestion
                          </span>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-1">
                      <p className="text-[11px] text-silver truncate">
                        {s.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
                renderContent={({ onClose }) => (
                  <div className="flex flex-col gap-3 p-4 w-full h-full text-left bg-midnight rounded-xl border border-white/10 shadow-2xl relative select-none">
                    <button 
                      onClick={onClose} 
                      className="absolute top-2.5 right-2.5 text-fog hover:text-ivory transition-colors p-1 hover:bg-white/5 rounded"
                    >
                      <X size={12} />
                    </button>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-ivory pr-6">{s.title}</h4>
                      <p className="text-[11px] text-silver leading-relaxed line-clamp-3">{s.description}</p>
                    </div>
                    {s.reasoning && (
                      <div className="p-2 rounded bg-black/20 border border-white/5 text-[10px] text-fog italic flex gap-1.5">
                        <Info size={11} className="shrink-0 mt-0.5 text-sage" />
                        <span className="line-clamp-2">{s.reasoning}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-auto">
                      <TextureButton
                        type="button"
                        onClick={() => {
                          approve(s._id);
                          onClose();
                        }}
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        <Check size={12} className="mr-1 inline" />
                        Approve
                      </TextureButton>
                      <TextureButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          reject(s._id);
                          onClose();
                        }}
                        className="flex-1 h-8 text-xs text-fog"
                      >
                        <X size={12} className="mr-1 inline" />
                        Dismiss
                      </TextureButton>
                    </div>
                  </div>
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
