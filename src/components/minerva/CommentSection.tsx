'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { MOCK_COMMENTS } from '@/lib/mock-data';

const IS_TEST = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === '1';

interface CommentSectionProps {
  targetId: string;
  targetType: 'approval' | 'task';
}

export function CommentSection({ targetId, targetType }: CommentSectionProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const c = t.comments;

  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!targetId || !targetType) return;
    if (IS_TEST) {
      setComments(MOCK_COMMENTS.map(c => ({ ...c, _id: c.id, author: c.userName, timestamp: c.timestamp })));
      return;
    }
    async function loadComments() {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .order('timestamp', { ascending: true });
      if (data) {
        setComments(data.map(comment => ({ ...comment, _id: comment.id })));
      }
    }
    loadComments();
  }, [targetId, targetType]);

  async function handleSubmit() {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      const newComment = {
        _id: `demo-${Date.now()}`,
        id: `demo-${Date.now()}`,
        author: user.name || user.email || 'Anonymous',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      if (IS_TEST) {
        setComments(prev => [...prev, newComment]);
        setContent('');
        return;
      }
      const { data, error } = await supabase
        .from('comments')
        .insert({ target_id: targetId, target_type: targetType, author: user.name || user.email || 'Anonymous', content: content.trim() })
        .select()
        .single();
      if (!error && data) {
        setComments(prev => [...prev, { ...data, _id: data.id }]);
        setContent('');
      }
    } catch (err) {
      console.error(err);
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
          comments.slice().reverse().map((item: any) => (
            <div key={item._id} className="flex gap-3">
              <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                <AvatarFallback className="text-[10px] bg-dusk text-silver">
                  {item.author[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-ivory">{item.author}</span>
                  <span className="text-[10px] text-fog">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-silver mt-1 leading-relaxed whitespace-pre-wrap">
                  {item.content}
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
