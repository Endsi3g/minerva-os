'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { useTeamMembers, type TeamMember } from '@/lib/hooks/useTeamMembers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface CommentSectionProps {
  targetId: string;
  targetType: 'approval' | 'task' | 'invoice' | 'proposal';
  token?: string;
}

export function CommentSection({ targetId, targetType, token }: CommentSectionProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const c = t.comments;
  const { members } = useTeamMembers();

  const [comments, setComments]   = useState<any[]>([]);
  const [content, setContent]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  // @mention state
  const [mentionOpen, setMentionOpen]   = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  useEffect(() => {
    if (!targetId || !targetType) return;
    async function load() {
      if (token) {
        try {
          const res = await fetch(`/api/portal/comment?token=${token}&targetId=${targetId}&targetType=${targetType}`);
          if (res.ok) setComments(await res.json());
        } catch (err) {
          console.error(err);
        }
      } else {
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('target_id', targetId)
          .eq('target_type', targetType)
          .order('timestamp', { ascending: true });
        if (data) setComments(data.map((c: any) => ({ ...c, _id: c.id })));
      }
    }
    load();
  }, [targetId, targetType, token]);

  // Detect @mention trigger while typing
  function handleContentChange(value: string) {
    setContent(value);

    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf('@');

    if (atIdx !== -1) {
      const charBefore = textBefore[atIdx - 1];
      const isWordBoundary = atIdx === 0 || charBefore === ' ' || charBefore === '\n';
      if (isWordBoundary) {
        const query = textBefore.slice(atIdx + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query.toLowerCase());
          setMentionOpen(true);
          return;
        }
      }
    }
    setMentionOpen(false);
  }

  function handleMentionSelect(name: string) {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf('@');
    const before = content.slice(0, atIdx);
    const after = content.slice(cursor);
    const updated = `${before}@${name} ${after}`;
    setContent(updated);
    setMentionOpen(false);
    // Re-focus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = before.length + name.length + 2;
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  const filteredMembers: TeamMember[] = members.filter((m: TeamMember) =>
    m.name.toLowerCase().includes(mentionQuery) ||
    m.email.toLowerCase().includes(mentionQuery)
  ).slice(0, 5);

  async function handleSubmit() {
    if (!content.trim()) return;
    if (!token && !user) return;
    setSubmitting(true);
    try {
      if (token) {
        const res = await fetch('/api/portal/comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, targetId, targetType, content: content.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.comment) {
            setComments((prev: any[]) => [...prev, data.comment]);
            setContent('');
          }
        }
      } else {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            target_id:   targetId,
            target_type: targetType,
            author:      user?.name || user?.email || 'Anonymous',
            content:     content.trim(),
          })
          .select()
          .single();

        if (!error && data) {
          setComments((prev: any[]) => [...prev, { ...data, _id: data.id }]);
          setContent('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  // Highlight @mentions in comment text
  function renderContent(text: string) {
    const parts = text.split(/(@\w[\w\s]*\w|\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium bg-primary/8 rounded px-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comment thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
            <p className="text-xs text-muted-foreground">{c.empty}</p>
            <p className="text-xs text-muted-foreground">{c.startConversation}</p>
          </div>
        ) : (
          comments
            .slice()
            .reverse()
            .map((item: any) => (
              <div key={item._id ?? item.id} className="flex gap-3">
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                    {(item.author ?? 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.author}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                    {renderContent(item.content)}
                  </p>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Compose area */}
      <div className="relative">
        {/* @mention dropdown */}
        {mentionOpen && filteredMembers.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-raised overflow-hidden z-20">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <AtSign size={10} /> Mention
            </p>
            {filteredMembers.map(m => (
              <button
                key={m.id}
                onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); handleMentionSelect(m.name); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-alt transition-colors text-left"
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
                    {m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground">{m.name}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{m.role}</span>
              </button>
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          placeholder={c.placeholder}
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value)}
          className={cn('text-xs min-h-[80px] resize-none pr-10 bg-background border-border')}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') { setMentionOpen(false); return; }
            if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          disabled={!content.trim() || submitting || (!token && !user)}
          onClick={handleSubmit}
          className="absolute bottom-2 right-2 h-7 w-7 bg-primary text-primary-foreground hover:bg-primary-hover"
          variant="default"
        >
          <Send size={13} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
