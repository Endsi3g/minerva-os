'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  instructions: string;
  tools: string[];
  status: 'active' | 'idle' | 'busy';
  created_at?: string;
  goal?: string;
  rules?: string[];
  avatar?: string;
}

export interface AgentApiKey {
  id?: string;
  agent_id: string;
  provider: 'openai' | 'anthropic' | 'relevance' | 'other';
  api_key: string;
}

const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: 'ux-research-insights',
    name: 'UX Research Insights Agent',
    role: 'UX Researcher',
    description: 'Turns messy interview transcripts into structured insights.',
    instructions: 'Analyze UX research transcripts, extract user pain points and needs, and output insights in markdown format.',
    goal: 'Analyze UX research data such as user interview transcripts, usability test notes, and feedback.',
    rules: [
      'Always respond using markdown formatting.',
      'Focus on user problems, behaviors, and motivations, not just summarizing text.',
      'Prioritize insights that appear across multiple users.',
      'Separate pain points, needs, and feature requests.',
      'Do not invent or assume information not present in the data.',
      'Extract clear and representative quotes when available.'
    ],
    tools: ['Extract Data from Meeting Transcripts'],
    status: 'idle'
  },
  {
    id: 'ux-competitor-benchmark',
    name: 'UX Competitor Benchmark Analyst',
    role: 'Competitor Analyst',
    description: 'Benchmarks usability patterns against top-tier tech products.',
    instructions: 'Evaluate client websites against usability benchmarks and output competitor positioning scorecards.',
    goal: 'Track competitor flows, onboarding patterns, and design details to propose UX superiority recommendations.',
    rules: [
      'Focus on design details and interaction patterns.',
      'Highlight speed, simplicity, and premium aesthetic metrics.'
    ],
    tools: ['Summarize Meeting Transcript'],
    status: 'active'
  },
  {
    id: 'rellie-recruiter',
    name: 'Rellie, The Relevance Recruiter',
    role: 'HR recruiter',
    description: 'Screens candidates and checks cultural alignment metrics.',
    instructions: 'Review candidate resumes, screen for specific roles, and draft tailored interview questions.',
    goal: 'Screen resumes, compare skill sets, and score cultural alignment based on organizational principles.',
    rules: [
      'Maintain candidate confidentiality at all times.',
      'Draft polite and structured review emails.'
    ],
    tools: ['Summarize Meeting Transcript', 'Extract Data from Meeting Transcripts'],
    status: 'active'
  },
  {
    id: 'recruitmer',
    name: 'Recruitmer',
    role: 'HR Coordinator',
    description: 'Automates job postings, description refinement, and meeting prep.',
    instructions: 'Coordinate recruitment cycles, schedule screens, and prepare interview briefings.',
    goal: 'Prepare interview dossiers for panel members, listing key indicators and check items.',
    rules: [
      'Keep summaries concise and dense.',
      'Enforce fair and transparent criteria evaluation.'
    ],
    tools: ['Extract Data from Meeting Transcripts'],
    status: 'idle'
  }
];

export function useAgents() {
  const { workspace } = useWorkspace();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load agents
  const loadAgents = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      // 1. Try fetching from Supabase
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace.id);

      if (!error && data && data.length > 0) {
        // Map database fields to AIAgent type
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          role: d.role,
          description: d.description,
          instructions: d.instructions,
          tools: d.tools || [],
          status: d.status,
          goal: d.goal || d.instructions.slice(0, 100),
          rules: d.rules || [],
        }));
        // Merge in defaults if they aren't in database
        const customIds = new Set(mapped.map(m => m.id));
        const missingDefaults = DEFAULT_AGENTS.filter(def => !customIds.has(def.id));
        setAgents([...mapped, ...missingDefaults]);
      } else {
        // Fallback to local storage or defaults
        const local = localStorage.getItem(`minerva_custom_agents_${workspace.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          const customIds = new Set(parsed.map((m: any) => m.id));
          const missingDefaults = DEFAULT_AGENTS.filter(def => !customIds.has(def.id));
          setAgents([...parsed, ...missingDefaults]);
        } else {
          setAgents(DEFAULT_AGENTS);
        }
      }
    } catch {
      // Fallback
      setAgents(DEFAULT_AGENTS);
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Create new Agent
  const createAgent = async (agent: Partial<AIAgent>, apiKeys?: Partial<Record<string, string>>) => {
    if (!workspace?.id) throw new Error('No workspace selected');

    const newId = Math.random().toString(36).substring(7);
    const newAgent: AIAgent = {
      id: newId,
      name: agent.name || 'Untitled Agent',
      role: agent.role || 'General Assistant',
      description: agent.description || 'Give this agent a short description...',
      instructions: agent.instructions || 'Write instructions here...',
      goal: agent.goal || agent.instructions || 'Goal goes here...',
      rules: agent.rules || [],
      tools: agent.tools || [],
      status: 'idle',
    };

    // 1. Try Supabase
    try {
      const { data, error } = await supabase.from('agents').insert({
        workspace_id: workspace.id,
        name: newAgent.name,
        role: newAgent.role,
        description: newAgent.description,
        instructions: newAgent.instructions,
        tools: newAgent.tools,
        status: newAgent.status,
      }).select().single();

      if (!error && data) {
        newAgent.id = data.id; // use Supabase generated UUID
        
        // Save API Keys if present
        if (apiKeys) {
          const keysPayload = Object.entries(apiKeys)
            .filter(([_, value]) => !!value)
            .map(([provider, key]) => ({
              workspace_id: workspace.id,
              agent_id: data.id,
              provider: provider as any,
              api_key: key,
            }));

          if (keysPayload.length > 0) {
            await supabase.from('agent_api_keys').insert(keysPayload);
          }
        }
      } else {
        // Fallback save in localstorage
        const local = localStorage.getItem(`minerva_custom_agents_${workspace.id}`);
        const current = local ? JSON.parse(local) : [];
        const updated = [...current, newAgent];
        localStorage.setItem(`minerva_custom_agents_${workspace.id}`, JSON.stringify(updated));

        if (apiKeys) {
          const keysLocal = localStorage.getItem(`minerva_agent_keys_${workspace.id}`) || '{}';
          const keysObj = JSON.parse(keysLocal);
          keysObj[newAgent.id] = apiKeys;
          localStorage.setItem(`minerva_agent_keys_${workspace.id}`, JSON.stringify(keysObj));
        }
      }
    } catch {
      // Local fallback
      const local = localStorage.getItem(`minerva_custom_agents_${workspace.id}`);
      const current = local ? JSON.parse(local) : [];
      const updated = [...current, newAgent];
      localStorage.setItem(`minerva_custom_agents_${workspace.id}`, JSON.stringify(updated));

      if (apiKeys) {
        const keysLocal = localStorage.getItem(`minerva_agent_keys_${workspace.id}`) || '{}';
        const keysObj = JSON.parse(keysLocal);
        keysObj[newAgent.id] = apiKeys;
        localStorage.setItem(`minerva_agent_keys_${workspace.id}`, JSON.stringify(keysObj));
      }
    }

    setAgents(prev => [...prev, newAgent]);
    toast.success('AI Agent created successfully!');
    return newAgent;
  };

  // Update Agent
  const updateAgent = async (id: string, updates: Partial<AIAgent>, apiKeys?: Partial<Record<string, string>>) => {
    if (!workspace?.id) return;

    // 1. Try Supabase
    try {
      const { error } = await supabase.from('agents').update({
        name: updates.name,
        role: updates.role,
        description: updates.description,
        instructions: updates.instructions,
        tools: updates.tools,
        status: updates.status,
      }).eq('id', id);

      if (error) throw error;

      // Save API Keys if present
      if (apiKeys) {
        for (const [provider, key] of Object.entries(apiKeys)) {
          if (!key) continue;
          await supabase.from('agent_api_keys').upsert({
            workspace_id: workspace.id,
            agent_id: id,
            provider: provider as any,
            api_key: key,
          }, { onConflict: 'agent_id,provider' });
        }
      }
    } catch {
      // Local fallback
      const local = localStorage.getItem(`minerva_custom_agents_${workspace.id}`);
      if (local) {
        const current = JSON.parse(local);
        const updated = current.map((a: any) => a.id === id ? { ...a, ...updates } : a);
        localStorage.setItem(`minerva_custom_agents_${workspace.id}`, JSON.stringify(updated));
      }

      if (apiKeys) {
        const keysLocal = localStorage.getItem(`minerva_agent_keys_${workspace.id}`) || '{}';
        const keysObj = JSON.parse(keysLocal);
        keysObj[id] = { ...(keysObj[id] || {}), ...apiKeys };
        localStorage.setItem(`minerva_agent_keys_${workspace.id}`, JSON.stringify(keysObj));
      }
    }

    // Also update UI state
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    toast.success('Agent changes saved successfully!');
  };

  // Get API Keys for Agent
  const getAgentKeys = async (id: string) => {
    if (!workspace?.id) return {};
    try {
      const { data, error } = await supabase
        .from('agent_api_keys')
        .select('*')
        .eq('agent_id', id);

      if (!error && data) {
        const keysObj: Record<string, string> = {};
        data.forEach((d: any) => {
          keysObj[d.provider] = d.api_key;
        });
        return keysObj;
      }
    } catch {
      // fallback
    }

    const keysLocal = localStorage.getItem(`minerva_agent_keys_${workspace.id}`) || '{}';
    const keysObj = JSON.parse(keysLocal);
    return keysObj[id] || {};
  };

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    getAgentKeys,
    refresh: loadAgents,
  };
}
