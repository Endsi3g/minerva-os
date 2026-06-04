'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/lib/hooks/useAgents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Plus,
  ArrowRight,
  Globe,
  Search,
  MessageSquare,
  Activity,
  Wrench,
  Key,
  Users,
  Bot,
  Database,
  Hammer,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { AgentOrbit } from '@/components/agents/AgentOrbit';
import { CreateAgentModal } from '@/components/agents/CreateAgentModal';

export default function AgentsList() {
  const router = useRouter();
  const { agents } = useAgents();

  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Maps default icons for orbit display
  const getAgentIcons = (id: string) => {
    if (id.includes('research')) return [Globe, Search, MessageSquare];
    if (id.includes('benchmark')) return [Activity, Wrench, Key];
    if (id.includes('recruiter')) return [Users, Bot, Database];
    return [Hammer, HelpCircle, Activity];
  };

  const getAgentColor = (id: string) => {
    if (id.includes('research')) return 'bg-indigo-600';
    if (id.includes('benchmark')) return 'bg-emerald-600';
    if (id.includes('recruiter')) return 'bg-purple-600';
    return 'bg-pink-600';
  };

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1200px] mx-auto select-none">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ivory tracking-tight flex items-center gap-2">
            <Bot className="text-[#7FA38A]" />
            Workforce Agents
          </h1>
          <p className="text-xs text-fog max-w-xl leading-relaxed">
            Deploy and orchestrate autonomous AI agents specialized in project delivery, client onboarding, tax audits, or CRM intelligence.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-ivory text-midnight hover:bg-ivory/90 rounded-full text-xs font-bold px-4 shadow-md flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          Create Agent
        </Button>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-md w-full bg-[#111522] border border-white/5 rounded-xl overflow-hidden group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog group-focus-within:text-silver transition-colors" size={14} />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search workforce agents..."
          className="w-full pl-10 pr-4 bg-transparent border-none text-xs text-ivory placeholder-fog focus:ring-0 focus-visible:ring-0"
        />
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-[#111522] border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col justify-between h-72 shadow-sm relative overflow-hidden group">
              <TextureOverlay texture="dots" opacity={0.05} />
              
              <CardContent className="pt-6 text-center relative z-10 flex-1">
                {/* Orbit Bubble */}
                <AgentOrbit
                  avatarColor={getAgentColor(agent.id)}
                  name={agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  icons={getAgentIcons(agent.id)}
                />
                
                <h3 className="text-sm font-bold text-ivory truncate px-2">{agent.name}</h3>
                <p className="text-[10px] text-warm font-semibold uppercase tracking-wider mt-0.5">{agent.role}</p>
                <p className="text-xs text-silver mt-2 line-clamp-2 px-4 leading-relaxed font-sans">{agent.description}</p>
              </CardContent>

              <div className="p-4 border-t border-white/5 relative z-10 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    agent.status === 'active' ? 'bg-[#7FA38A] animate-pulse' : 'bg-fog'
                  )} />
                  <span className="text-[10px] text-fog capitalize font-semibold">{agent.status}</span>
                </div>
                
                <Button
                  onClick={() => router.push(`/app/agents/${agent.id}`)}
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-[#7FA38A] hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Builder</span>
                  <ArrowRight size={12} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal open={createOpen} onOpenChange={setCreateOpen} />

    </div>
  );
}

