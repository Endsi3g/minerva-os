'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentSuggestions({ workspaceId }: { workspaceId: any }) {
  const suggestions = useQuery(api.agents.getSuggestions, { workspaceId }) ?? [];
  const approve = useMutation(api.agents.approveSuggestion);
  const reject = useMutation(api.agents.rejectSuggestion);

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
              <Card className="glass-card antigravity-float overflow-hidden border-terracotta/20">
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
                      onClick={() => approve({ suggestionId: s._id })}
                      className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white text-xs h-8"
                    >
                      <Check size={14} className="mr-1.5" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => reject({ suggestionId: s._id })}
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
