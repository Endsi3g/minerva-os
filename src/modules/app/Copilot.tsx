'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, FileText, Copy, Trash2, Sidebar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function Copilot() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am Lucifee, the Hermes Agent co-pilot. I can help you review CRM pipeline, project timelines, invoice statuses, and coordinate your team. What would you like to build or check today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const displayName = user?.name ?? 'JS';
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsgText = input.trim();
    setInput('');

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: userMsgText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const assistantMsgId = Math.random().toString(36).substring(7);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, initialAssistantMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Gather context
      const context = `User name is ${displayName}. Active workspace is ${workspace?.name ?? 'AS Mobbin'}.`;
      
      const payloadMessages = [...messages, userMessage].map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, context }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reply');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          streamedContent += chunk;

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: streamedContent } : m
            )
          );
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Response generation stopped');
      } else {
        console.error('Chat error:', err);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
              : m
          )
        );
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopWriting = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I am Lucifee, the Hermes Agent co-pilot. I can help you review CRM pipeline, project timelines, invoice statuses, and coordinate your team. What would you like to build or check today?",
        timestamp: Date.now(),
      },
    ]);
    toast.success('Conversation history cleared');
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleCreateDoc = async (content: string) => {
    toast.promise(
      (async () => {
        if (!workspace?.id) throw new Error('No workspace selected');
        // Insert a mock file in knowledge base
        const { error } = await supabase.from('knowledge_base').insert({
          workspace_id: workspace.id,
          title: `AI Draft — ${new Date().toLocaleDateString()}`,
          category: 'references_briefs',
          content: content,
        });
        if (error) throw error;
      })(),
      {
        loading: 'Creating document...',
        success: 'Document created successfully in Knowledge Base!',
        error: 'Failed to create document.',
      }
    );
  };

  const handleMagicWand = () => {
    setInput("Suggest three ways to improve our current project execution rate.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-4xl mx-auto px-6 py-4 select-none">
      
      {/* Top Header Bar */}
      <div className="shrink-0 flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[#7FA38A]" />
          <h1 className="text-sm font-semibold text-ivory tracking-tight">Hermes Agent</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 text-[11px] font-semibold text-fog hover:text-silver hover:bg-white/5 border border-white/10 px-2.5 py-1 rounded-md transition-all cursor-pointer"
          >
            <Trash2 size={11} />
            <span>Clear Chat</span>
          </button>
          <button
            onClick={handleMagicWand}
            title="Auto Suggestion"
            className="p-1.5 hover:bg-white/5 rounded-md text-fog hover:text-silver border border-white/10 transition-colors cursor-pointer"
          >
            <Sparkles size={12} />
          </button>
          <button
            title="Toggle Sidebar"
            className="p-1.5 hover:bg-white/5 rounded-md text-fog hover:text-silver border border-white/10 transition-colors cursor-pointer"
          >
            <Sidebar size={12} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-4">
            
            {/* Avatar */}
            {msg.role === 'user' ? (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-md">
                {userInitials}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-md">
                H
              </div>
            )}

            {/* Content box */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ivory">
                  {msg.role === 'user' ? 'You' : 'Hermes'}
                </span>
                <span className="text-[9px] text-fog">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-silver leading-relaxed whitespace-pre-wrap font-sans mt-1 bg-white/2 border border-white/3 rounded-xl p-3.5 shadow-sm">
                {msg.content || (
                  <span className="flex items-center gap-1.5 text-fog italic animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                  </span>
                )}
              </p>

              {/* Action Buttons under Assistant messages */}
              {msg.role === 'assistant' && msg.content && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleCreateDoc(msg.content)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-[#B89B6A]/10 border border-[#B89B6A]/20 hover:bg-[#B89B6A]/20 text-[#B89B6A] px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-sm"
                  >
                    <FileText size={10} />
                    <span>Create a doc</span>
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(msg.content)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-[#7FA38A]/10 border border-[#7FA38A]/20 hover:bg-[#7FA38A]/20 text-[#7FA38A] px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-sm"
                  >
                    <Copy size={10} />
                    <span>Copy to clipboard</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center justify-between bg-[#111522]/30 border border-white/5 px-4 py-2.5 rounded-xl">
            <span className="text-xs text-fog italic flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[#7FA38A]" /> Hermes is typing...
            </span>
            <button
              onClick={handleStopWriting}
              className="text-[10px] font-bold text-silver border border-white/10 px-2 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              Stop writing
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Box */}
      <div className="shrink-0 mt-4 relative bg-[#111522] border border-white/5 rounded-xl p-3.5 shadow-lg group">
        <TextureOverlay texture="dots" opacity={0.06} />
        <div className="flex items-end gap-3 relative z-10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Send a message about Marketing..."
            rows={2}
            className="flex-1 bg-transparent text-xs text-ivory placeholder-fog resize-none outline-none border-none min-h-[40px] scrollbar-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isTyping
                ? 'bg-[#7FA38A] text-obsidian cursor-pointer hover:opacity-90 shadow-md'
                : 'bg-white/5 text-fog cursor-not-allowed'
            )}
          >
            <Send size={11} className={input.trim() && !isTyping ? 'translate-x-[0.5px] -translate-y-[0.5px]' : ''} />
          </button>
        </div>
      </div>

    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
