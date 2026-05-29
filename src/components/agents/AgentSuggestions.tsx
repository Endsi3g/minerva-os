'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-terracotta" />
        <h2 className="text-lg font-semibold text-near-black dark:text-parchment">
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
            >
              <Card className="glass-card overflow-hidden border-terracotta/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        {s.title}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-terracotta/10 text-terracotta uppercase tracking-wider">
                          Suggestion
                        </span>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {s.reasoning && (
                    <div className="mt-2 mb-4 p-2 rounded bg-parchment/50 dark:bg-near-black/30 border border-clay/20 text-[11px] text-muted-foreground italic flex gap-2">
                      <Info size={12} className="shrink-0 mt-0.5 text-terracotta" />
                      {s.reasoning}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => approve(s._id)}
                      className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white text-xs h-8"
                    >
                      <Check size={14} className="mr-1.5" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => reject(s._id)}
                      className="text-muted-foreground hover:text-near-black text-xs h-8"
                    >
                      <X size={14} className="mr-1.5" />
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
