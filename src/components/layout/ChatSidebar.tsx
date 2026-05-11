'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Loader2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLang } from '@/i18n';
import { useChat } from './AppShell';
import { useHermes } from '@/lib/hooks/useHermes';
import { cn } from '@/lib/utils';

export function ChatSidebar() {
  const { isChatOpen, toggleChat } = useChat();
  const { t } = useLang();
  const { messages, sendMessage, isLoading, error, clearMessages } = useHermes();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleChat}
            className="fixed inset-0 bg-void/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-2 right-2 bottom-2 w-96 bg-midnight border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-dusk/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ivory leading-tight">{t.chat.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                    <span className="text-[10px] text-fog uppercase tracking-wider font-medium">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearMessages}
                  className="text-fog hover:text-ivory h-8 w-8"
                  title="Clear conversation"
                >
                  <Eraser size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleChat}
                  className="text-fog hover:text-ivory h-8 w-8"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-dusk flex items-center justify-center text-fog mb-4">
                      <MessageSquare size={24} />
                    </div>
                    <p className="text-sm text-silver italic leading-relaxed">
                      {t.chat.empty}
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[85%] gap-1.5",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                       {msg.role === 'assistant' && <span className="text-[10px] font-medium text-sage uppercase tracking-widest">Hermes</span>}
                       {msg.role === 'user' && <span className="text-[10px] font-medium text-silver uppercase tracking-widest">You</span>}
                    </div>
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-sage text-midnight font-medium rounded-tr-none" 
                          : "bg-dusk text-ivory border border-border/50 rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex flex-col max-w-[85%] gap-1.5 mr-auto items-start">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium text-sage uppercase tracking-widest">Hermes</span>
                    </div>
                    <div className="bg-dusk text-ivory border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-sage" />
                        <span className="text-xs text-fog italic">Thinking...</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-void/50 border border-border/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                        <span className="text-[10px] text-fog font-mono uppercase tracking-tight">Accessing Terminal</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-ember/10 border border-ember/20 text-ember text-xs text-center mt-2">
                    {t.chat.error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-midnight">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t.chat.placeholder}
                  rows={1}
                  className="w-full bg-dusk text-ivory text-sm rounded-xl py-3 pl-4 pr-12 border border-border focus:border-sage/50 focus:ring-1 focus:ring-sage/20 outline-none transition-all resize-none placeholder:text-fog/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 top-1.5 h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    input.trim() && !isLoading 
                      ? "bg-sage text-midnight hover:scale-105" 
                      : "bg-void/50 text-fog cursor-not-allowed"
                  )}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-fog/40 text-center mt-3 uppercase tracking-tighter">
                Powered by Hermes Agent · Uprising Studio
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
