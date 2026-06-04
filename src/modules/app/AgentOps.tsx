'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { TextAnimate } from '@/components/ui/text-animate';
import {
  TerminalAnimationRoot,
  TerminalAnimationWindow,
  TerminalAnimationContent,
  TerminalAnimationCommandBar,
  TerminalAnimationOutput,
} from '@/components/ui/terminal-animation';
import { Sparkles, History, Activity, Edit3, CheckCircle, HelpCircle, Play, TrendingUp, FolderKanban, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROMPT_TEMPLATES = [
  {
    title: 'Analyseur de Risques (RAG & Alerte)',
    role: 'Risk Management',
    description: 'Surveille les jalons, le scope creep et les indicateurs financiers du projet.',
    instructions: 'Vous êtes un agent IA expert en analyse de risques projet. Analysez le statut des jalons, l\'historique des tâches et la consommation de budget pour identifier les dérives. Vos alertes doivent être concises, basées sur des données factuelles et classées par gravité (Faible, Moyenne, Haute). Proposez toujours des plans de contingence.'
  },
  {
    title: 'Rédacteur Stratégique Uprising',
    role: 'Editorial & Copywriting',
    description: 'Assure un ton de voix éditorial haut de gamme ("Noir") conforme à la charte d\'Uprising Studio.',
    instructions: 'Vous êtes le gardien de la marque Uprising Studio. Relisez et ajustez toutes les communications clients, les descriptifs de propositions et les tickets d\'onboarding. Utilisez un ton raffiné, précis, sans jargon superflu. Évitez les formules de politesse convenues et privilégiez la clarté élégante.'
  },
  {
    title: 'Auditeur & Contrôleur Financier',
    role: 'Financial Auditing',
    description: 'Vérifie les calculs de taxes (TPS/TVQ), le suivi des dépenses et la conformité de facturation.',
    instructions: 'Vous êtes un auditeur financier rigoureux. Passez au crible toutes les dépenses soumises et les brouillons de factures. Validez que les taxes locales sont correctement ventilées. Signalez immédiatement tout écart de tarification ou facture en retard de paiement.'
  }
];

const MODULE_AGENTS = [
  {
    id: 'crm-agent',
    name: 'CRM Agent',
    role: 'Pipeline Intelligence',
    description: 'Scores leads, detects stalling deals, and surfaces pipeline health alerts before opportunities slip.',
    icon: TrendingUp,
    color: 'bg-blue-600',
    endpoint: '/api/agents/crm',
    action: 'crm_agent_run',
    alertAction: 'crm_agent_alert',
  },
  {
    id: 'pm-agent',
    name: 'PM Agent',
    role: 'Project Intelligence',
    description: 'Detects scope drift, predicts delays, and flags blocked tasks before they stall delivery.',
    icon: FolderKanban,
    color: 'bg-purple-600',
    endpoint: '/api/agents/pm',
    action: 'pm_agent_run',
    alertAction: 'pm_agent_alert',
  },
  {
    id: 'finance-agent',
    name: 'Finance Agent',
    role: 'Financial Intelligence',
    description: 'Monitors overdue invoices, retainer renewals, and cash flow anomalies in real time.',
    icon: DollarSign,
    color: 'bg-emerald-600',
    endpoint: '/api/agents/finance',
    action: 'finance_agent_run',
    alertAction: 'finance_agent_alert',
  },
];

export default function AgentOps() {
  const [agents, setAgents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [agentAlerts, setAgentAlerts] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [lastRuns, setLastRuns] = useState<Record<string, string>>({});

  const terminalTabs = useMemo(() => [
    {
      label: "agent-ops.log",
      command: "tail -n 20 agent-audit.log",
      lines: audit.map((log: any) => ({
        text: `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.action}: ${JSON.stringify(log.details)}`,
        color: log.action.includes('error') ? 'text-[#ff5f56]' : 'text-[#7FA38A]',
        delay: 200
      }))
    }
  ], [audit]);

  async function loadData() {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    setWorkspaceId(wid);
    const [agRes, auRes, alertRes] = await Promise.all([
      supabase.from('agents').select('*').eq('workspace_id', wid),
      supabase.from('agent_audit').select('*').eq('workspace_id', wid).order('timestamp', { ascending: false }).limit(20),
      supabase
        .from('agent_audit')
        .select('details, action, timestamp')
        .eq('workspace_id', wid)
        .in('action', ['crm_agent_alert', 'pm_agent_alert', 'finance_agent_alert'])
        .gte('timestamp', new Date(Date.now() - 86400000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(15),
    ]);
    setAgents(agRes.data ?? []);
    setAudit(auRes.data ?? []);
    setAgentAlerts(alertRes.data ?? []);

    // Compute last run times per agent
    const runs: Record<string, string> = {};
    for (const mod of MODULE_AGENTS) {
      const row = (auRes.data ?? []).find((r: any) => r.action === mod.action);
      if (row) runs[mod.id] = row.timestamp;
    }
    setLastRuns(runs);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function runAgent(mod: typeof MODULE_AGENTS[0]) {
    if (!workspaceId || runningAgent) return;
    setRunningAgent(mod.id);
    try {
      await fetch(mod.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      await loadData();
    } catch (err) {
      console.error(`[${mod.name}] run error:`, err);
    } finally {
      setRunningAgent(null);
    }
  }

  async function runAllAgents() {
    if (!workspaceId || runningAgent) return;
    setRunningAgent('all');
    try {
      await Promise.all(
        MODULE_AGENTS.map(mod =>
          fetch(mod.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId }),
          })
        )
      );
      await loadData();
    } catch (err) {
      console.error('[Run all agents]', err);
    } finally {
      setRunningAgent(null);
    }
  }

  const openEditor = (agent: any) => {
    setEditingAgent(agent);
    setEditedInstructions(agent.instructions || '');
    setSaveStatus('idle');
  };

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setEditedInstructions(template.instructions);
  };

  const handleSave = async () => {
    if (!editingAgent) return;
    setSaveStatus('saving');
    const { error } = await supabase
      .from('agents')
      .update({ instructions: editedInstructions })
      .eq('id', editingAgent.id);

    if (error) {
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      // Update local state
      setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, instructions: editedInstructions } : a));
      // Log audit trail
      if (workspaceId) {
        await supabase.from('agent_audit').insert({
          workspace_id: workspaceId,
          agent_id: editingAgent.id,
          action: 'update_agent_instructions',
          details: { agent_name: editingAgent.name, version: 'custom_prompt' },
          timestamp: new Date().toISOString()
        });
        // Reload audit trail
        const auRes = await supabase.from('agent_audit').select('*').eq('workspace_id', workspaceId).order('timestamp', { ascending: false }).limit(20);
        setAudit(auRes.data ?? []);
      }
      setTimeout(() => {
        setEditingAgent(null);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8 w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ivory font-serif italic flex items-center gap-3">
            <Sparkles className="text-warm" />
            <TextAnimate text="Agent Operations" type="calmInUp" className="text-3xl font-bold text-ivory font-serif italic" />
          </h1>
          <p className="text-sm text-silver mt-2">
            Monitor, govern, and configure the instructions for your AGI agency agents.
          </p>
        </div>
      </header>

      {/* v4 Module Agents */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-ivory">Module Agents</p>
            <p className="text-[11px] text-fog mt-0.5">AI agents running autonomously across your core modules</p>
          </div>
          <Button
            size="sm"
            onClick={runAllAgents}
            disabled={!!runningAgent}
            className="flex items-center gap-2 text-xs bg-ivory text-midnight hover:bg-ivory/90 rounded-lg px-4 disabled:opacity-50"
          >
            <Play size={11} className={runningAgent === 'all' ? 'animate-pulse' : ''} />
            {runningAgent === 'all' ? 'Running...' : 'Run All'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {MODULE_AGENTS.map(mod => {
            const Icon = mod.icon;
            const alertsForAgent = agentAlerts.filter((a: any) => a.action === mod.alertAction);
            const roseCount = alertsForAgent.filter((a: any) => a.details?.severity === 'rose').length;
            const amberCount = alertsForAgent.filter((a: any) => a.details?.severity === 'amber').length;
            const lastRan = lastRuns[mod.id];

            return (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-midnight border-white/8 relative overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', mod.color)}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ivory">{mod.name}</p>
                          <p className="text-[9px] uppercase tracking-wider text-fog font-medium">{mod.role}</p>
                        </div>
                      </div>
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1', lastRan ? 'bg-sage' : 'bg-silver/30')} />
                    </div>
                    <p className="text-[11px] text-silver leading-relaxed">{mod.description}</p>
                    {alertsForAgent.length > 0 && (
                      <div className="flex items-center gap-2">
                        {roseCount > 0 && (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-rose/10 text-rose border border-rose/20">
                            <AlertTriangle size={8} /> {roseCount} critical
                          </span>
                        )}
                        {amberCount > 0 && (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">
                            <AlertTriangle size={8} /> {amberCount} warning
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-[9px] text-fog">
                        {lastRan ? `Last run ${new Date(lastRan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never run'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => runAgent(mod)}
                        disabled={!!runningAgent}
                        className="h-6 px-2 text-[10px] text-silver hover:text-ivory border border-white/5 hover:bg-white/5 rounded-md flex items-center gap-1 disabled:opacity-40"
                      >
                        <Play size={8} className={runningAgent === mod.id ? 'animate-pulse' : ''} />
                        {runningAgent === mod.id ? 'Running' : 'Run'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Agent Alerts */}
        {agentAlerts.length > 0 && (
          <Card className="bg-midnight border-white/8 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-ivory flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber" />
                Recent Agent Alerts
                <span className="ml-auto text-[9px] text-fog font-normal">Last 24h</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                {agentAlerts.slice(0, 8).map((row: any, i: number) => {
                  const d = row.details ?? {};
                  const dotColor = d.severity === 'rose' ? '#A86A6A' : d.severity === 'amber' ? '#B89B6A' : '#8A9099';
                  return (
                    <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-white/4 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-ivory truncate">{d.title || d.description}</p>
                        {d.description && d.title && (
                          <p className="text-[10px] text-fog mt-0.5 truncate">{d.description}</p>
                        )}
                      </div>
                      <span className="text-[9px] text-fog shrink-0">{new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Custom Agents Status Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {agents.map((agent: any, index: number) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-white/10 bg-midnight relative group overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-ivory">{agent.name}</CardTitle>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    agent.status === 'active' ? "bg-sage animate-pulse" : "bg-silver/40"
                  )} />
                </div>
                <p className="text-[10px] text-warm font-medium uppercase tracking-widest">{agent.role}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-silver mt-2 line-clamp-3">
                  {agent.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {agent.tools?.map((tool: string) => (
                    <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-silver">
                      {tool}
                    </span>
                  ))}
                </div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditor(agent)}
                    className="w-full text-xs text-silver hover:text-ivory border border-white/5 hover:bg-white/5 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={12} />
                    Configure Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Audit Trail + Prompt Editor Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Audit Trail */}
        <Card className="glass-card border-white/10 bg-midnight">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-ivory flex items-center gap-2">
              <History size={16} className="text-warm" />
              Live Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-xs text-silver italic">No recent agent activity.</p>
            ) : (
              <TerminalAnimationRoot tabs={terminalTabs} alwaysDark={true} className="w-full">
                <TerminalAnimationWindow minHeight="320px" animateOnVisible={false} className="border border-white/5 bg-black/60 rounded-xl font-mono text-[10px]">
                  <TerminalAnimationContent className="p-4 overflow-y-auto max-h-[300px] custom-scrollbar">
                    <div className="flex items-center gap-1.5 text-fog mb-3 text-[9px] select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                      <span className="ml-2">Hermes Terminal Logs</span>
                    </div>
                    <div className="text-silver select-none">
                      <span className="text-[#32f3e9]">guest@minerva-os</span>:<span className="text-[#b39aff]">~</span>$ <TerminalAnimationCommandBar className="inline-block" />
                    </div>
                    <TerminalAnimationOutput className="mt-2 space-y-1" />
                  </TerminalAnimationContent>
                </TerminalAnimationWindow>
              </TerminalAnimationRoot>
            )}
          </CardContent>
        </Card>

        {/* System Signals & Configuration */}
        <div className="space-y-6">
          <Card className="glass-card border-white/10 bg-midnight">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-ivory flex items-center gap-2">
                <Activity size={16} className="text-sage" />
                System Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-silver">Active Workflows</span>
                  <span className="font-bold text-ivory">12</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-silver">Success Rate</span>
                  <span className="font-bold text-sage">99.2%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-silver">Human Interventions</span>
                  <span className="font-bold text-ember">2</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 bg-midnight">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-ivory">Governance Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-silver leading-relaxed">
                Currently operating in <strong>Suggest-then-Approve</strong> mode. Agents require explicit confirmation for all critical actions (deals stage change, note creation, tasks assignment).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Instructions Editor dialog (MorphSurface Simulation) */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-3xl bg-midnight border-white/10 text-ivory selection:bg-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif italic text-ivory flex items-center gap-2">
              <Sparkles className="text-warm" size={18} />
              Configure {editingAgent?.name} Instructions
            </DialogTitle>
            <DialogDescription className="text-xs text-silver">
              Fine-tune the custom instructions for {editingAgent?.role}. Apply standard templates below to override.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver uppercase tracking-wider">System Prompt Instructions</label>
                <Textarea
                  value={editedInstructions}
                  onChange={(e) => setEditedInstructions(e.target.value)}
                  className="min-h-[250px] bg-black/30 border-white/5 text-silver text-xs rounded-xl focus:ring-1 focus:ring-warm/50"
                  placeholder="Describe how the agent should think, speak, and make decisions..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAgent(null)}
                  className="text-xs text-silver hover:bg-white/5 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={cn(
                    "text-xs font-semibold rounded-lg px-4",
                    saveStatus === 'saved'
                      ? "bg-sage text-midnight hover:bg-sage"
                      : "bg-ivory text-midnight hover:bg-ivory/90"
                  )}
                >
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={12} /> Saved!
                    </span>
                  )}
                  {saveStatus === 'error' && 'Error! Try Again'}
                  {saveStatus === 'idle' && 'Save & Apply'}
                </Button>
              </div>
            </div>

            {/* Prompt Library */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-4">
              <h3 className="text-xs font-semibold text-silver uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={13} className="text-warm" />
                Prompt Library
              </h3>
              <div className="space-y-3">
                {PROMPT_TEMPLATES.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => applyTemplate(template)}
                    className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 transition-all space-y-1 group"
                  >
                    <p className="text-[11px] font-semibold text-ivory group-hover:text-warm transition-colors">{template.title}</p>
                    <p className="text-[9px] text-fog leading-relaxed line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
