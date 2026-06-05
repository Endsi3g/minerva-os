'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAgents, AIAgent } from '@/lib/hooks/useAgents';
import { useTier } from '@/lib/hooks/useTier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Bot,
  Save,
  Share2,
  Play,
  Wrench,
  Database,
  Sparkles,
  Plus,
  X,
  Upload,
  Globe,
  FileText,
  Search,
  MoreVertical,
  Key,
  Lock,
  Terminal,
  Loader2,
  AlertCircle,
  Cpu,
  Calendar,
  Layers,
  History,
  Layout,
  Network,
} from 'lucide-react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { toast } from 'sonner';
import { useLang } from '@/i18n';
import { useSidebar } from '@/components/layout/AppShell';
import { AgentSandboxChat } from '@/components/agents/AgentSandboxChat';

export default function AgentBuilder() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;
  const { agents, updateAgent, getAgentKeys } = useAgents();
  const { tier } = useTier();
  const { collapsed } = useSidebar();
  const { t } = useLang();

  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'run'>('build');
  const [activeSubTab, setActiveSubTab] = useState<'prompt' | 'tools' | 'knowledge' | 'triggers'>('prompt');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // API Key states
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  // Knowledge tables list (RAG mock)
  const [knowledgeTables, setKnowledgeTables] = useState<any[]>([
    { id: 'affinity_mapping_csv_1', title: 'affinity_mapping_csv_1', type: 'Prompt', status: 'Ready' },
    { id: 'interview_transcript_txt_1', title: 'interview_transcript_txt_1', type: 'Prompt', status: 'Ready' },
    { id: 'ux_insights_docx_1', title: 'ux_insights_docx_1', type: 'Search tool', status: 'Ready' },
  ]);
  const [searchKnowledgeQuery, setSearchKnowledgeQuery] = useState('');

  // Run/Sandbox states
  const [pdfUrl, setPdfUrl] = useState('https://example.com/document.pdf');
  const [summaryLength, setSummaryLength] = useState('standard');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  const isStarter = tier === 'starter';

  // Load agent data
  useEffect(() => {
    if (agents.length > 0 && agentId) {
      const found = agents.find(a => a.id === agentId);
      if (found) {
        setAgent(found);
        setName(found.name);
        setRole(found.role);
        setDescription(found.description);
        setGoal(found.goal || found.instructions);
        setRules(found.rules || []);
        setIsPublished(found.status === 'active');

        // Fetch saved keys
        getAgentKeys(found.id).then(keys => {
          setOpenaiKey(keys.openai || '');
          setAnthropicKey(keys.anthropic || '');
        });
      }
    }
  }, [agents, agentId, getAgentKeys]);

  if (!agent) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-[#0A0D14] text-silver select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#7FA38A]" />
          <span className="text-xs">Loading Agent Workspace...</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t.app.agentBuilder.nameRequired);
      return;
    }
    const keysPayload: Record<string, string> = {};
    if (!isStarter) {
      keysPayload.openai = openaiKey;
      keysPayload.anthropic = anthropicKey;
    }
    try {
      await updateAgent(agent.id, {
        name,
        role,
        description,
        goal,
        rules,
        status: isPublished ? 'active' : 'idle',
      }, keysPayload);
      toast.success(t.app.agentBuilder.saveSuccess);
    } catch {
      toast.error(t.app.agentBuilder.saveError);
    }
  };

  const handlePublish = async () => {
    setIsPublished(true);
    const keysPayload: Record<string, string> = {};
    if (!isStarter) {
      keysPayload.openai = openaiKey;
      keysPayload.anthropic = anthropicKey;
    }

    await updateAgent(agent.id, {
      name,
      role,
      description,
      goal,
      rules,
      status: 'active',
    }, keysPayload);
    toast.success('Agent published successfully!');
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (idx: number) => {
    setRules(prev => prev.filter((_, i) => i !== idx));
  };

  // Inject Template values from extras grid
  const applyTemplate = (type: string) => {
    if (type === 'web_researcher') {
      setGoal('Search the web for top interaction patterns and summarize usability findings.');
      setRules([
        'Always respond using markdown formatting.',
        'Extract insights from trusted blogs like Nielsen Norman Group.',
        'Provide structural page layouts in ASCII/Markdown.'
      ]);
    } else if (type === 'meeting_prepper') {
      setGoal('Prepare dossiers and dossiers of brief notes for participants of upcoming workshops.');
      setRules([
        'Structure agenda, check items, and expected results.',
        'Include attendees backgrounds from CRM notes.'
      ]);
    } else if (type === 'email_assistant') {
      setGoal('Draft and screen customer check-ins and proposals feedback.');
      setRules([
        'Maintain a highly refined, premium editorial voice.',
        'Keep replies concise, avoiding unnecessary greetings.'
      ]);
    }
    toast.success('Agent template applied successfully!');
  };

  // Handle mock file upload
  const handleUploadFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newTable = {
      id: `${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.floor(Math.random() * 100)}`,
      title: file.name,
      type: file.name.endsWith('.csv') ? 'Prompt' : 'Search tool',
      status: 'Ready',
    };
    setKnowledgeTables(prev => [newTable, ...prev]);
    toast.success(`Successfully uploaded ${file.name} to Knowledge Base!`);
  };

  // Run/Sandbox tool execution trigger
  const handleRunTool = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunLogs([]);
    setChatMessages([]);

    const steps = [
      '1. **Extract PDF Text**: Initializing RAG pipeline...',
      'Converting PDF content to readable text chunks...',
      '2. **Generate Summary**: Running analysis using model...',
      'Identifying key themes, problems, and motives...',
      '3. **Extract Key Actions**: Mapping deadlines and owners...',
      '4. **Return Results**: Compilation complete.'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setRunLogs(prev => [...prev, steps[i]]);
    }

    setIsRunning(false);

    // Stream a mock response into the chat
    setIsChatTyping(true);
    await new Promise(r => setTimeout(r, 1000));
    setChatMessages([
      {
        id: 'mock-run',
        role: 'assistant',
        content: `### Document Action Summary\n\n· **Summary**: Usability testing highlights critical friction during team workspace setup due to complex billing tiers. \n\n· **Key Actions**:\n  - **Jane Studio**: Redesign setup steps to simplify checkout (Deadline: 12 June)\n  - **Alex**: Optimize page redirects and fix Supabase session loops (Deadline: ASAP)\n\n· **Confidence Index**: 98% (extracted from 12 transcripts).`
      }
    ]);
    setIsChatTyping(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatTyping) return;

    const userMsg = { id: Math.random().toString(), role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    const promptText = chatInput.trim();
    setChatInput('');

    setIsChatTyping(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          context: `You are simulating the agent: ${name} (${role}). Goal: ${goal}. Rules: ${rules.join(' ')}`
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { id: Math.random().toString(), role: 'assistant', content: data.content }]);
    } catch {
      setChatMessages(prev => [...prev, { id: Math.random().toString(), role: 'assistant', content: 'Simulation output complete based on instructions.' }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full select-none bg-[#0A0D14]">
      
      {/* Top Workspace Header Bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111522]/50 relative z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/app/agents')}
            className="p-1.5 hover:bg-white/5 rounded-lg border border-white/10 text-fog hover:text-silver transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Bot size={16} />
            </div>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-ivory outline-none focus:bg-white/5 px-1 py-0.5 rounded"
              />
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isPublished ? "bg-[#7FA38A]" : "bg-warm"
                )} />
                <span className="text-[9px] font-bold text-fog tracking-wider uppercase">
                  {isPublished ? 'Published' : 'Unpublished'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Build / Run Tabs */}
        <div className="flex items-center bg-black/30 border border-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('build')}
            className={cn(
              "px-4 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'build' ? "bg-white/10 text-ivory" : "text-fog hover:text-silver"
            )}
          >
            <Wrench size={10} /> Build
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={cn(
              "px-4 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'run' ? "bg-white/10 text-ivory" : "text-fog hover:text-silver"
            )}
          >
            <Play size={10} /> Run
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Agent link copied!');
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-fog hover:text-silver border border-white/10 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            <Share2 size={10} /> Share
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-[10px] font-bold text-fog hover:text-silver border border-white/10 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            <Save size={10} /> Save
          </button>

          <Button
            onClick={handlePublish}
            className="bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer shadow-md"
          >
            Publish
          </Button>

          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title="Toggle Right Panel"
            className={cn(
              "p-1.5 hover:bg-white/5 rounded-lg text-fog hover:text-silver border border-white/10 transition-colors cursor-pointer",
              rightPanelOpen && "bg-white/5 text-silver"
            )}
          >
            <Layout size={13} />
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Thin Left Sidebar Menu */}
        <div className="shrink-0 w-36 bg-[#111522]/20 border-r border-white/5 p-2 flex flex-col justify-between">
          <div className="space-y-0.5">
            {[
              { id: 'prompt', label: 'Prompt', icon: Sparkles },
              { id: 'tools', label: 'Tools', icon: Wrench },
              { id: 'knowledge', label: 'Knowledge', icon: Database },
              { id: 'triggers', label: 'Triggers', icon: Cpu },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab('build');
                  setActiveSubTab(tab.id as any);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-colors cursor-pointer",
                  activeTab === 'build' && activeSubTab === tab.id
                    ? "text-[#7FA38A] bg-white/5"
                    : "text-fog hover:text-silver hover:bg-white/3"
                )}
              >
                <tab.icon size={12} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-0.5 border-t border-white/5 pt-2">
            <button className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-fog hover:text-silver cursor-pointer">
              <AlertCircle size={11} /> Alerts
            </button>
            <button className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-fog hover:text-silver cursor-pointer">
              <History size={11} /> Memory
            </button>
            <button className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-fog hover:text-silver cursor-pointer">
              <Key size={11} /> Variables
            </button>
          </div>
        </div>

        {/* Center Panel - Dynamically toggles between Build and Run */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-black/[0.05]">
          
          {/* Build Tab Content */}
          {activeTab === 'build' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Build - Prompt Subtab */}
              {activeSubTab === 'prompt' && (
                <div className="space-y-6">
                  {/* Goal instructions panel */}
                  <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Goal Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Write details on what you want your agent to accomplish..."
                        rows={3}
                        className="bg-black/30 border-white/5 text-xs text-silver rounded-xl resize-none focus:ring-1 focus:ring-[#7FA38A]/30"
                      />
                    </CardContent>
                  </Card>

                  {/* Rules instructions panel */}
                  <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory">Agent Guidelines / Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {rules.length === 0 ? (
                        <p className="text-[11px] text-fog italic">No rules defined. Guide your agent by adding constraints.</p>
                      ) : (
                        <div className="space-y-2">
                          {rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-black/20 border border-white/5 px-3 py-1.5 rounded-lg text-xs text-silver">
                              <span>{rule}</span>
                              <button onClick={() => handleRemoveRule(idx)} className="text-fog hover:text-ember cursor-pointer">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-1">
                        <Input
                          value={newRule}
                          onChange={(e) => setNewRule(e.target.value)}
                          placeholder="e.g. Always respond using bullet points..."
                          className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-8"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                        />
                        <Button onClick={handleAddRule} className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs text-silver h-8 px-3 cursor-pointer">
                          Add Rule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Optional extras templates */}
                  <div className="border border-white/5 rounded-xl p-5 bg-[#111522]/40 relative overflow-hidden">
                    <TextureOverlay texture="dots" opacity={0.06} />
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-ivory uppercase tracking-wider block">Optional Extras to make agent smarter</span>
                        <span className="text-[10px] text-fog">Inject presets and capabilities into your agent prompt.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                      {[
                        { id: 'web_researcher', title: 'Web Researcher', desc: 'Search the web and summarize findings', color: 'from-blue-950 to-indigo-950' },
                        { id: 'meeting_prepper', title: 'Meeting Prepper', desc: 'Prepare for meetings and send briefs', color: 'from-amber-950 to-orange-950' },
                        { id: 'email_assistant', title: 'Email Assistant', desc: 'Draft and respond to checkins', color: 'from-purple-950 to-pink-950' },
                      ].map(tpl => (
                        <div key={tpl.id} className={cn("rounded-xl border border-white/5 p-3.5 flex flex-col justify-between h-32 bg-gradient-to-br", tpl.color)}>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-ivory block">{tpl.title}</span>
                            <span className="text-[10px] text-silver leading-relaxed line-clamp-2">{tpl.desc}</span>
                          </div>
                          <button
                            onClick={() => applyTemplate(tpl.id)}
                            className="text-[10px] font-bold text-[#7FA38A] hover:underline self-start cursor-pointer mt-2"
                          >
                            Use template
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom API Keys Block */}
                  <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory flex items-center gap-1.5">
                          <Key size={13} className="text-[#B89B6A]" />
                          Custom LLM Keys
                        </CardTitle>
                        {isStarter && (
                          <span className="text-[9px] font-bold text-warm bg-warm/10 border border-warm/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase">
                            <Lock size={8} /> locked
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isStarter ? (
                        <div className="text-center py-4 space-y-2">
                          <p className="text-xs text-silver max-w-md mx-auto leading-relaxed">
                            Adding custom API keys forces the agent to run directly on your own billing quotas. Upgrade to <span className="text-[#7FA38A] font-bold">Growth</span> or <span className="text-[#B89B6A] font-bold">Scale</span> plans to unlock this configuration.
                          </p>
                          <Button
                            onClick={() => router.push('/app/billing')}
                            className="bg-warm text-midnight hover:bg-warm/90 rounded-lg text-[10px] font-bold h-7 px-4 cursor-pointer mt-1"
                          >
                            Upgrade Now
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-fog uppercase">OpenAI API Key</label>
                            <Input
                              type="password"
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              placeholder="sk-..."
                              className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-fog uppercase">Anthropic API Key</label>
                            <Input
                              type="password"
                              value={anthropicKey}
                              onChange={(e) => setAnthropicKey(e.target.value)}
                              placeholder="sk-ant-..."
                              className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              )}

              {/* Build - Knowledge Subtab */}
              {activeSubTab === 'knowledge' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ivory">Knowledge base</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Upload documents, interview briefs, spreadsheets, or FAQs to teach this agent about custom contexts.
                    </p>
                  </div>

                  {/* Search and Table list */}
                  <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <div className="relative max-w-sm w-full bg-black/20 border border-white/5 rounded-lg overflow-hidden group h-8 flex items-center">
                        <Search className="absolute left-2.5 text-fog" size={12} />
                        <Input
                          value={searchKnowledgeQuery}
                          onChange={(e) => setSearchKnowledgeQuery(e.target.value)}
                          placeholder="Search connected knowledge..."
                          className="w-full pl-8 pr-3 bg-transparent border-none text-[11px] text-ivory placeholder-fog focus:ring-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-white/5">
                        {knowledgeTables
                          .filter(t => t.title.toLowerCase().includes(searchKnowledgeQuery.toLowerCase()))
                          .map((table) => (
                            <div key={table.id} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={13} className="text-[#7FA38A] shrink-0" />
                                <span className="text-xs text-silver font-mono truncate">{table.title}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                  {table.status}
                                </span>
                                <span className="text-[10px] text-fog font-semibold">{table.type}</span>
                                <button className="text-fog hover:text-silver cursor-pointer">
                                  <MoreVertical size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upload box */}
                  <div className="border border-dashed border-white/10 rounded-xl p-8 bg-[#111522]/20 text-center relative hover:bg-white/[0.01] transition-colors group">
                    <input
                      type="file"
                      onChange={handleUploadFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={22} className="text-fog mx-auto mb-3 group-hover:scale-105 transition-transform" />
                    <p className="text-xs text-silver font-semibold">
                      Drag & drop or <span className="text-[#7FA38A] hover:underline">choose files</span> to upload
                    </p>
                    <p className="text-[10px] text-fog mt-1">
                      Supported formats: .csv, .json, .pdf, .xlsx, .txt, .md. Max 5 files per upload.
                    </p>
                  </div>

                  {/* Integration buttons */}
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {[
                      { label: 'Add Google Drive', icon: Globe },
                      { label: 'Add Notion', icon: Layers },
                      { label: 'Import Website', icon: Globe },
                      { label: 'Blank Table', icon: Database },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={() => toast.info(`${btn.label} connector setup wizard opened.`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111522] border border-white/5 rounded-lg text-[10px] font-bold text-silver hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <btn.icon size={11} />
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Run Tab Content - Testing Sandbox */}
          {activeTab === 'run' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left Sandbox Inputs Form */}
              <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider font-semibold text-ivory flex items-center gap-1.5">
                    <Terminal size={13} className="text-blue-400" />
                    Input Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">PDF File URL *</label>
                    <Input
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                      className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Summary Length</label>
                    <select
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className="w-full bg-black/30 border border-white/5 text-xs text-silver rounded-lg h-9 px-3 outline-none focus:border-white/10"
                    >
                      <option value="brief">Brief (1-2 paragraphs)</option>
                      <option value="standard">Standard (3-5 paragraphs)</option>
                      <option value="detailed">Detailed (6+ paragraphs)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleRunTool}
                    disabled={isRunning}
                    className="w-full bg-[#7FA38A] text-midnight hover:bg-[#7FA38A]/90 rounded-lg text-xs font-bold h-9 cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Running execution...
                      </>
                    ) : (
                      <>
                        <Play size={12} /> Run Tool
                      </>
                    )}
                  </Button>

                  {/* Terminal Log Console */}
                  {(runLogs.length > 0 || isRunning) && (
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 font-mono text-[9px] text-[#7FA38A] space-y-1 min-h-[120px] select-text">
                      <div className="flex items-center gap-1.5 text-fog mb-2 text-[8px] select-none">
                        <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                        <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                        <span className="ml-2 font-sans font-bold">Standard Operating Procedure Execution</span>
                      </div>
                      {runLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                      ))}
                      {isRunning && <span className="inline-block w-1.5 h-3 bg-[#7FA38A] animate-[pulse_0.8s_infinite] ml-1" />}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Sandbox Chat Console */}
              <AgentSandboxChat
                chatMessages={chatMessages}
                isChatTyping={isChatTyping}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendChatMessage={handleSendChatMessage}
                agentName={name}
              />

            </div>
          )}

        </div>

        {/* Right collapsible options pane */}
        {rightPanelOpen && !collapsed && (
          <div className="shrink-0 w-52 bg-[#111522]/30 border-l border-white/5 p-4 space-y-6 overflow-y-auto scrollbar-thin">
            
            {/* Triggers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Triggers</span>
                <button className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5">
                  <Plus size={8} /> Add
                </button>
              </div>
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg text-center">
                <div className="flex justify-center gap-1.5 mb-1.5 opacity-60">
                  <Globe size={12} />
                  <Calendar size={12} />
                  <Network size={12} />
                </div>
                <p className="text-[9px] text-fog leading-relaxed">
                  Automatically run this agent on events like emails, schedules, or webhooks.
                </p>
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Tools</span>
                <button className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5">
                  <Plus size={8} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {agent.tools?.map((tool: string) => (
                  <div key={tool} className="flex items-center justify-between bg-white/2 border border-white/5 px-2 py-1.5 rounded-lg text-[10px] text-silver font-semibold">
                    <span className="truncate flex-1 pr-1">{tool}</span>
                    <Wrench size={10} className="text-[#7FA38A] shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge files snippet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Knowledge</span>
                <button className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5">
                  <Plus size={8} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {knowledgeTables.slice(0, 2).map((tbl) => (
                  <div key={tbl.id} className="flex items-center gap-1.5 text-[9px] text-silver truncate">
                    <Database size={10} className="text-[#7FA38A] shrink-0" />
                    <span className="truncate">{tbl.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Variables</span>
              </div>
              <p className="text-[9px] text-fog leading-relaxed">
                Turn values into dynamic parameters using <code className="text-[#7FA38A] font-mono bg-white/5 px-1 py-0.5 rounded">{"{{"}</code> brackets.
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
