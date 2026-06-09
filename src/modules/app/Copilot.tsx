'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, FileText, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

const PROMPT_CARDS = [
  {
    icon: '🗂️',
    label: 'Projets',
    prompt: 'Quel est l\'état de mes projets en cours ?',
  },
  {
    icon: '📊',
    label: 'CRM',
    prompt: 'Résume mon pipeline de ventes et les opportunités prioritaires.',
  },
  {
    icon: '💳',
    label: 'Finance',
    prompt: 'Montre-moi les factures impayées et le chiffre d\'affaires du mois.',
  },
  {
    icon: '⚙️',
    label: 'Opérations',
    prompt: 'Quelles tâches sont en retard et qui les a en charge ?',
  },
];

function groupConversations(conversations: Conversation[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];

  for (const c of [...conversations].sort((a, b) => b.createdAt - a.createdAt)) {
    if (c.createdAt >= todayStart.getTime()) today.push(c);
    else if (c.createdAt >= yesterdayStart.getTime()) yesterday.push(c);
    else older.push(c);
  }

  return { today, yesterday, older };
}

export default function Copilot() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const displayName = user?.name?.split(' ')[0] ?? 'vous';
  const userInitials = (user?.name ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startNewChat = () => {
    setActiveConvId(null);
    setInput('');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const msgText = text.trim();
    setInput('');

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: msgText,
      timestamp: Date.now(),
    };

    let convId = activeConvId;

    if (!convId) {
      convId = Math.random().toString(36).substring(7);
      const newConv: Conversation = {
        id: convId,
        title: msgText.slice(0, 42) + (msgText.length > 42 ? '…' : ''),
        createdAt: Date.now(),
        messages: [userMessage],
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(convId);
    } else {
      setConversations(prev =>
        prev.map(c =>
          c.id === convId ? { ...c, messages: [...c.messages, userMessage] } : c
        )
      );
    }

    setIsTyping(true);

    const assistantMsgId = Math.random().toString(36).substring(7);
    const placeholderMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const finalConvId = convId;

    setConversations(prev =>
      prev.map(c =>
        c.id === finalConvId ? { ...c, messages: [...c.messages, placeholderMsg] } : c
      )
    );

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const context = `User name is ${user?.name ?? displayName}. Active workspace is ${workspace?.name ?? 'Minerva'}.`;
      const historyMsgs = (activeConv?.messages ?? []).concat(userMessage);
      const payloadMessages = historyMsgs.map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, context }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Failed to fetch reply');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamedContent += decoder.decode(value);
          setConversations(prev =>
            prev.map(c =>
              c.id === finalConvId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                    ),
                  }
                : c
            )
          );
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Génération arrêtée');
      } else {
        setConversations(prev =>
          prev.map(c =>
            c.id === finalConvId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: 'Une erreur est survenue. Veuillez réessayer.' }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopWriting = () => {
    abortControllerRef.current?.abort();
    setIsTyping(false);
  };

  const handleCreateDoc = async (content: string) => {
    toast.promise(
      (async () => {
        if (!workspace?.id) throw new Error('No workspace selected');
        const { error } = await supabase.from('knowledge_base').insert({
          workspace_id: workspace.id,
          title: `AI Draft — ${new Date().toLocaleDateString()}`,
          category: 'references_briefs',
          content,
        });
        if (error) throw error;
      })(),
      {
        loading: 'Création du document…',
        success: 'Document créé dans la base de connaissances !',
        error: 'Échec de la création.',
      }
    );
  };

  const handleDeleteConv = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const { today, yesterday, older } = groupConversations(conversations);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background p-4">

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "shrink-0 flex flex-col bg-sidebar border border-border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm",
          sidebarOpen ? "w-[260px] opacity-100 mr-4" : "w-0 opacity-0 pointer-events-none border-none mr-0"
        )}
      >
        <div className="p-3 shrink-0 flex items-center justify-between gap-2 border-b border-border bg-surface-alt/50">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-xs font-semibold rounded-full py-2 px-4 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={13} />
            Nouvelle conversation
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Masquer le menu"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          {conversations.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center mt-8 px-4 leading-relaxed">
              Tes conversations apparaîtront ici.
            </p>
          )}

          {today.length > 0 && (
            <ConvGroup label="Aujourd'hui" items={today} activeId={activeConvId} onSelect={setActiveConvId} onDelete={handleDeleteConv} />
          )}
          {yesterday.length > 0 && (
            <ConvGroup label="Hier" items={yesterday} activeId={activeConvId} onSelect={setActiveConvId} onDelete={handleDeleteConv} />
          )}
          {older.length > 0 && (
            <ConvGroup label="Plus tôt" items={older} activeId={activeConvId} onSelect={setActiveConvId} onDelete={handleDeleteConv} />
          )}
        </div>

        {/* Agent badge */}
        <div className="p-3 border-t border-border flex items-center gap-2 shrink-0 bg-surface-alt/50">
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary-soft-border flex items-center justify-center shrink-0">
            <Bot size={13} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-none">Hermes Agent</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Co-pilote IA</p>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface border border-border rounded-2xl shadow-sm">

        {/* Universal Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-border bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors mr-1 cursor-pointer shrink-0"
                title="Afficher le menu"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            <MessageSquare size={13} className="text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              {activeConv ? activeConv.title : "Copilot IA"}
            </span>
          </div>
          {activeConv && (
            <button
              onClick={() => handleDeleteConv(activeConv.id)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-white/5 px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0"
            >
              <Trash2 size={11} />
              <span>Effacer</span>
            </button>
          )}
        </div>

        {/* Input bar (moved to top) */}
        <div className="shrink-0 px-6 py-4 border-b border-border bg-surface-alt/40">
          <div className="relative bg-surface border border-border rounded-xl p-3 shadow-sm max-w-xl mx-auto">
            <TextureOverlay texture="dots" opacity={0.05} />
            <div className="flex items-end gap-3 relative z-10">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Envoie un message à Hermes…"
                rows={1}
                className="flex-1 bg-transparent text-xs text-foreground placeholder-fog resize-none outline-none border-none min-h-[24px] max-h-[120px] scrollbar-none py-1.5"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all mb-0.5',
                  input.trim() && !isTyping
                    ? 'bg-primary text-white cursor-pointer hover:opacity-90 shadow-md'
                    : 'bg-white/5 text-muted-foreground cursor-not-allowed'
                )}
              >
                <Send size={11} className={input.trim() && !isTyping ? 'translate-x-[0.5px] -translate-y-[0.5px]' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeConv ? (
            /* Messages */
            <div className="px-6 py-5 space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3">
                  {msg.role === 'user' ? (
                    <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5">
                      {userInitials}
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary-soft-border flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {msg.role === 'user' ? 'Vous' : 'Hermes'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-3.5">
                      {!msg.content ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground italic text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Réflexion en cours…
                        </span>
                      ) : msg.role === 'assistant' ? (
                        <div className="minerva-prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content + (isTyping && messages[messages.length - 1]?.id === msg.id ? '▍' : '')}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.content && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleCreateDoc(msg.content)}
                          className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 border border-amber-200 hover:bg-amber-100 text-warning px-2.5 py-1 rounded-md transition-all cursor-pointer"
                        >
                          <FileText size={10} />
                          <span>Créer un doc</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center justify-between bg-surface/60 border border-border px-4 py-2.5 rounded-xl">
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Hermes rédige…
                  </span>
                  <button
                    onClick={handleStopWriting}
                    className="text-[10px] font-semibold text-foreground border border-border px-2 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Arrêter
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center px-8 py-12">
              <div className="w-full max-w-xl">
                <div className="mb-8 text-center">
                  <h1 className="font-display text-3xl text-foreground mb-2">
                    Bonjour, {displayName} 👋
                  </h1>
                  <p className="text-sm text-muted-foreground">Que puis-je faire pour toi aujourd'hui ?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {PROMPT_CARDS.map(card => (
                    <button
                      key={card.label}
                      onClick={() => sendMessage(card.prompt)}
                      className="group text-left bg-surface-alt border border-border hover:border-primary-soft-border hover:bg-surface/80 rounded-xl p-4 transition-all duration-200 cursor-pointer"
                    >
                      <span className="text-xl block mb-2">{card.icon}</span>
                      <p className="text-xs font-semibold text-foreground mb-1">{card.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{card.prompt}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-3 px-1">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[11px] text-muted-foreground">Ou pose ta propre question…</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ConvGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string;
  items: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">{label}</p>
      <div className="space-y-0.5">
        {items.map(conv => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2 w-full rounded-lg px-2 py-2 cursor-pointer transition-all',
              activeId === conv.id
                ? 'bg-primary-soft/60 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-alt'
            )}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare size={11} className="shrink-0 opacity-60" />
            <span className="text-[11px] flex-1 truncate leading-snug">{conv.title}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger shrink-0 cursor-pointer"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
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
