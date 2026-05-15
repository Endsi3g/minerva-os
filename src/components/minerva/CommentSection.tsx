'use client';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface CommentSectionProps {
  targetId: string;
  targetType: 'approval' | 'task';
}

export function CommentSection({ targetId, targetType }: CommentSectionProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const c = t.comments;
  const comments = useQuery(api.comments.list, { targetId, targetType }) ?? [];
  const addComment = useMutation(api.comments.add);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      await addComment({
        targetId,
        targetType,
        author: user.name || user.email || 'Anonymous',
        content: content.trim(),
      });
      setContent('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-fog text-xs py-10 opacity-50">
            <p>{c.empty}</p>
            <p>{c.startConversation}</p>
          </div>
        ) : (
          comments.slice().reverse().map((c: any) => (
            <div key={c._id} className="flex gap-3">
              <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                <AvatarFallback className="text-[10px] bg-dusk text-silver">
                  {c.author[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-ivory">{c.author}</span>
                  <span className="text-[10px] text-fog">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-silver mt-1 leading-relaxed whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative">
        <Textarea
          placeholder={c.placeholder}
          value={content}
          onChange={(e: any) => setContent(e.target.value)}
          className={cn(
            "bg-midnight text-xs min-h-[80px] resize-none pr-10 border-white/5 focus-visible:ring-sage/20",
          )}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          disabled={!content.trim() || submitting}
          onClick={handleSubmit}
          className="absolute bottom-2 right-2 h-7 w-7 text-sage hover:bg-sage/10"
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
