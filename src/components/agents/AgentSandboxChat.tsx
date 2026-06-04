'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AgentSandboxChatProps {
  chatMessages: ChatMessage[];
  isChatTyping: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: () => void;
  agentName: string;
}

export function AgentSandboxChat({
  chatMessages,
  isChatTyping,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  agentName,
}: AgentSandboxChatProps) {
  return (
    <div className="flex flex-col h-[400px] bg-[#111522]/80 border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div className="shrink-0 p-3.5 border-b border-white/5 flex items-center gap-2">
        <MessageSquare size={13} className="text-[#7FA38A]" />
        <span className="text-xs font-bold text-ivory">Simulation Sandbox Chat</span>
      </div>

      {/* Message display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <p className="text-[11px] text-fog max-w-[200px] leading-relaxed">
              No outputs yet. Trigger the tool run or type directly in the input box below to query the sandbox.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1 text-left select-text">
                <span className={cn(
                  "text-[10px] font-bold",
                  msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'
                )}>
                  {msg.role === 'user' ? 'You' : agentName}
                </span>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-silver leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
        {isChatTyping && (
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-purple-400">Agent</span>
            <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-fog italic flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[#7FA38A]" /> Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="shrink-0 p-3 border-t border-white/5 bg-black/20">
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask sandbox..."
            className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg h-8"
            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
          />
          <Button onClick={handleSendChatMessage} className="bg-[#7FA38A] hover:bg-[#7FA38A]/90 text-midnight rounded-lg px-3 h-8 flex items-center justify-center cursor-pointer shadow-md">
            <Send size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}
