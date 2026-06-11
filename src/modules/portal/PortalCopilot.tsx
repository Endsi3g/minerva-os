'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export default function PortalCopilot() {
  const { t } = useLang();
  const pc = t.portal.copilot;
  const { token, isValid } = usePortalData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isValid || !token) return null;

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev: Message[]) => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);

    const idx = messages.length + 1;
    setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/portal/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: userMsg, history: messages.slice(-10) }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev: Message[]) => prev.map((m: Message, i: number) => i === idx ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false } : m));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const snapshot = text;
        setMessages((prev: Message[]) => prev.map((m: Message, i: number) => i === idx ? { ...m, content: snapshot } : m));
      }

      setMessages((prev: Message[]) => prev.map((m: Message, i: number) => i === idx ? { ...m, streaming: false } : m));
    } catch {
      setMessages((prev: Message[]) => prev.map((m: Message, i: number) => i === idx ? { ...m, content: 'Connection error. Please try again.', streaming: false } : m));
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setOpen(true)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--warning)' }} />
              <span className="text-sm font-medium">{pc.title}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-[20px] border overflow-hidden w-[340px] sm:w-[380px]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              height: '520px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <Sparkles size={14} style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{pc.title}</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <X size={15} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Sparkles size={22} className="mb-3" style={{ color: '#B89B6A', opacity: 0.6 }} />
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{pc.emptyState}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pc.subtitle}</p>
                </div>
              )}
              {messages.map((m: Message, i: number) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-[14px] text-sm leading-relaxed"
                    style={
                      m.role === 'user'
                        ? { backgroundColor: 'color-mix(in srgb, var(--foreground) 10%, transparent)', color: 'var(--foreground)' }
                        : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--muted-foreground)', border: '1px solid rgba(255,255,255,0.06)' }
                    }
                  >
                    {m.content}
                    {m.streaming && <span className="inline-block h-3.5 w-0.5 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: 'var(--muted-foreground)' }} />}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={pc.placeholder}
                  disabled={streaming}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  style={{ color: 'var(--foreground)' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="shrink-0 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30 cursor-pointer hover:bg-white/5"
                >
                  <Send size={13} style={{ color: 'var(--primary)' }} />
                </button>
              </div>
              <p className="text-center text-[10px] mt-2" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>{pc.poweredBy}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
