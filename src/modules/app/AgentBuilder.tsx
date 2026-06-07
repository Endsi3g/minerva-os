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
  Key,
  Lock,
  Loader2,
  AlertCircle,
  Cpu,
  Calendar,
  Layers,
  History,
  Layout,
  Network,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Send,
  Zap,
  Clock,
  ArrowRight,
  Settings,
  Grid,
  Mail,
  Star,
  HelpCircle,
  Users,
  Check,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { toast } from 'sonner';
import { useLang } from '@/i18n';
import { useSidebar } from '@/components/layout/AppShell';
const PRESET_CONFIGS: Record<string, {
  avatar: string;
  initials: string;
  triggers: Array<{ id: string; name: string; type: string; icon: any; color: string; desc: string }>;
  tools: Array<{ name: string; icon: any; color: string; desc: string }>;
  runSteps: string[];
  runResult: string;
}> = {
  web_researcher: {
    avatar: 'bg-indigo-600',
    initials: 'WR',
    triggers: [
      { id: 'trig-webhook', name: 'Incoming Webhook', type: 'webhook', icon: Zap, color: 'text-green-400 bg-green-500/10 border-green-500/20', desc: 'Fires on incoming webhook payload' },
      { id: 'trig-slack', name: 'Slack channel trigger', type: 'slack', icon: MessageSquare, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Fires when a message is posted in #ux-research' }
    ],
    tools: [
      { name: 'Google Search', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Search the web using key phrases.' },
      { name: 'Extract Website Content', icon: Search, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Get markdown formatted page content.' },
      { name: 'Analyze & Compare', icon: Layout, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Generate a structured comparison of interaction patterns.' }
    ],
    runSteps: [
      '1. **Google Search**: Running search on target query...',
      'Retrieving top 10 search results from Google...',
      '2. **Extract Website Content**: Parsing target pages...',
      'Extracting clean text content and removing boilerplates...',
      '3. **Analyze & Compare**: Extracting interaction patterns...',
      'Compiling findings and structuring layout report...'
    ],
    runResult: `### Web Usability Research Report\n\n· **Objective**: Analyze checkout flow best practices for SaaS products.\n\n· **Key Findings**:\n  - **Single Page Checkout**: Reduces cart abandonment by up to 18.4% compared to multi-step setups.\n  - **Progressive Disclosure**: Best for complex configurations (disclosing details only when necessary).\n\n· **Friction Points Found**:\n  - Strict form validation rules without clear inline errors increase user cognitive load.\n  - Lack of a express payment method (like Apple Pay/Stripe Express) leads to dropoffs at checkout.\n\n· **Recommended Actions**:\n  - Implement express checkout options.\n  - Clean up styling to enforce clear visual hierarchy on pricing plans.`
  },
  meeting_prepper: {
    avatar: 'bg-emerald-600',
    initials: 'MP',
    triggers: [
      { id: 'trig-calendar', name: 'Google Calendar Sync', type: 'calendar', icon: Calendar, color: 'text-warm bg-warm/10 border-warm/20', desc: 'Fires 10 mins before sync workshops' },
      { id: 'trig-schedule', name: 'Schedule Trigger', type: 'schedule', icon: Clock, color: 'text-silver bg-white/5 border-white/10', desc: 'Runs every weekday at 8:00 AM' }
    ],
    tools: [
      { name: 'Fetch CRM Dossier', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Retrieve profile background and notes.' },
      { name: 'Google Calendar Fetch', icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Get upcoming event details and attendees.' },
      { name: 'Draft Workshop Briefing', icon: FileText, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Structure agenda, check items, and expectations.' }
    ],
    runSteps: [
      '1. **Google Calendar Fetch**: Checking calendar slots for next 24 hours...',
      'Found: Bolt Tech Brand Alignment Sync (3 participants)...',
      '2. **Fetch CRM Dossier**: Scanning profile histories for Bolt Tech...',
      'Retrieved: Project brief notes, past email feedback...',
      '3. **Draft Workshop Briefing**: Generating agenda briefing notes...',
      'Structuring prep dossier for meeting host...'
    ],
    runResult: `### Meeting Preparation Brief\n\n· **Event**: Bolt Tech Brand Alignment Sync · Tomorrow, 10:00 AM\n\n· **Attendees**:\n  - **Alex** (Client Developer): Main focus is Stripe integration and webhook latency.\n  - **Jane Studio** (Lead Designer): High interest in onboarding typography and layout.\n\n· **Meeting Goals**:\n  1. Review and sign-off on Bolt Tech Brand Guidelines v2.\n  2. Resolve stripe webhook delays blocking the subscription flow.\n\n· **Suggested Questions to Ask**:\n  - "What is the expected daily transaction volume for Stripe?"\n  - "Are there any layout adjustments required for the pricing cards?"`
  },
  email_assistant: {
    avatar: 'bg-purple-600',
    initials: 'EA',
    triggers: [
      { id: 'trig-gmail', name: 'Gmail Inbox Trigger', type: 'gmail', icon: Mail, color: 'text-ember bg-ember/10 border-ember/20', desc: 'Fires on email subject matching "Check-in"' }
    ],
    tools: [
      { name: 'Gmail Read', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Scan incoming message content and metadata.' },
      { name: 'Categorize Priority', icon: Star, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Analyze urgency and intent.' },
      { name: 'Send Gmail Draft', icon: Send, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Compose check-in or feedback reply.' }
    ],
    runSteps: [
      '1. **Gmail Read**: Checking unread messages matching subject criteria...',
      'Retrieved: Message from client (Subject: "Acme Corp Feedback Request")...',
      '2. **Categorize Priority**: Running sentiment analyzer...',
      'Result: High Priority (Neutral Sentiment, Urgent deadline request)...',
      '3. **Send Gmail Draft**: Creating draft response inside workspace...',
      'Draft composed: Review and click publish to send...'
    ],
    runResult: `### Email Assistant Summary\n\n· **Parsed Message**: Client Acme Corp is asking for updates on the logo wireframe design v2.\n\n· **Sentiment**: Urgent · Neutral.\n\n· **Generated Draft Reply**:\n  *Subject: Re: Acme Corp Feedback Request*\n  \n  "Hello Acme team,\n  \n  Thank you for reaching out. We are currently polishing the v2 wireframe design guidelines, specifically simplifying the onboarding layouts. We expect to share the complete brand package for review by tomorrow afternoon.\n  \n  Best regards,\n  Minerva Team"\n\n· **Action Item**: Review draft inside Gmail drafts folder and submit.`
  }
};

const renderInlineFormat = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="text-ivory font-bold">{part}</strong>;
    }
    const codeParts = part.split('`');
    if (codeParts.length > 1) {
      return codeParts.map((cp, cIdx) => {
        if (cIdx % 2 === 1) {
          return <code key={cIdx} className="bg-black/40 text-blue-300 font-mono px-1 py-0.5 rounded text-[10px]">{cp}</code>;
        }
        return cp;
      });
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3 font-sans text-xs text-silver leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-sm font-bold text-ivory mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-base font-bold text-ivory mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('· ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="pl-4 relative flex items-start gap-1.5 py-0.5">
              <span className="text-fog mt-1.5 shrink-0">•</span>
              <span className="flex-1">{renderInlineFormat(content)}</span>
            </div>
          );
        }
        if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ')) {
          const content = trimmed.substring(3);
          const num = trimmed.substring(0, 3);
          return (
            <div key={idx} className="pl-4 relative flex items-start gap-1.5 py-0.5">
              <span className="text-blue-400 font-bold shrink-0">{num}</span>
              <span className="flex-1">{renderInlineFormat(content)}</span>
            </div>
          );
        }
        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }
        return <p key={idx}>{renderInlineFormat(line)}</p>;
      })}
    </div>
  );
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div
      className="bg-[#7FA38A] h-full transition-all duration-300 rounded"
      ref={(node) => { if (node) node.style.width = `${pct}%`; }}
    />
  );
}

export default function AgentBuilder() {

  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;
  const { agents, updateAgent, getAgentKeys } = useAgents();
  const { tier } = useTier();
  const { collapsed } = useSidebar();
  const { t } = useLang();

  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'run' | 'evaluate'>('build');
  const [activeSubTab, setActiveSubTab] = useState<'prompt' | 'tools' | 'knowledge' | 'triggers' | 'alerts' | 'memory' | 'variables'>('prompt');
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activePreset, setActivePreset] = useState<'web_researcher' | 'meeting_prepper' | 'email_assistant'>('web_researcher');
  const [promptInput, setPromptInput] = useState('');
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executedLogs, setExecutedLogs] = useState<string[]>([]);
  const [runOutput, setRunOutput] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Modals Visibility
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [showAddMcpModal, setShowAddMcpModal] = useState(false);
  const [showAddTriggerModal, setShowAddTriggerModal] = useState(false);

  // Tools Subtab Workflow Diagram
  const [toolsWorkflow, setToolsWorkflow] = useState<string[]>([
    'Google Search',
    'Extract content from website',
    'Google Search',
    'Get LinkedIn Profile',
    'Google Search',
    'Google Search'
  ]);
  const [popularToolQuery, setPopularToolQuery] = useState('');

  // Tool Builder Subview states
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [toolViewMode, setToolViewMode] = useState<'build' | 'logs'>('build');

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

  // Triggers subtab state
  const [activeTriggers, setActiveTriggers] = useState<any[]>([
    { id: 'schedule-daily', name: 'Daily Morning Sync', type: 'schedule', status: 'active', desc: 'Runs every day at 6:00 AM' }
  ]);

  // Evaluate Tab Mock data
  const [isTestingSuite, setIsTestingSuite] = useState(false);
  const [testSuiteProgress, setTestSuiteProgress] = useState(0);
  const [testCases, setTestCases] = useState<any[]>([
    { id: 1, name: 'user_interview_transcript_alex.docx', expected: 'Extract 3 core design bottlenecks', status: 'success' },
    { id: 2, name: 'usability_test_notes_onboarding.pdf', expected: 'Identify redirect loops', status: 'success' },
    { id: 3, name: 'feedback_form_billing.json', expected: 'Calculate billing sentiment score', status: 'success' },
    { id: 4, name: 'empty_transcript_test.txt', expected: 'Gracefully raise empty input error', status: 'failed' }
  ]);

  // Mock Alerts list
  const [alerts] = useState<any[]>([
    { id: 1, type: 'warning', msg: 'API Rate Limit Warning — OpenAI quota at 84%', time: '2 mins ago' },
    { id: 2, type: 'error', msg: 'Extraction Failure: affinity_mapping_csv_1 contains unreadable formatting', time: '1 hour ago' },
    { id: 3, type: 'success', msg: 'Successful execution: 12 transcripts parsed, summary generated', time: 'Yesterday' }
  ]);

  // Mock Memory records
  const [memories, setMemories] = useState<string[]>([
    'User Preferences: Prefers bullet points and direct summaries.',
    'Workspace Context: Core studio domain is creative branding & design.',
    'Recent Meeting Details: Acme Corp kickoff completed on June 5th.'
  ]);
  const [newMemory, setNewMemory] = useState('');

  // Mock Variables list
  const [variables, setVariables] = useState<any[]>([
    { key: 'WORKSPACE_NAME', value: 'Uprising Studio' },
    { key: 'DEFAULT_LANG', value: 'en' },
    { key: 'CONFIDENCE_THRESHOLD', value: '0.90' }
  ]);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  // Run/Sandbox states
  const [pdfUrl, setPdfUrl] = useState('https://example.com/document.pdf');
  const [summaryLength, setSummaryLength] = useState('standard');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
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

        // Derive activePreset based on agent name or role
        const lowerName = found.name.toLowerCase();
        const lowerRole = found.role.toLowerCase();
        if (lowerName.includes('research') || lowerRole.includes('research')) {
          setActivePreset('web_researcher');
        } else if (lowerName.includes('prepper') || lowerName.includes('recru') || lowerRole.includes('hr') || lowerRole.includes('coordinator')) {
          setActivePreset('meeting_prepper');
        } else {
          setActivePreset('email_assistant');
        }

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
  const applyTemplate = (type: 'web_researcher' | 'meeting_prepper' | 'email_assistant') => {
    setActivePreset(type);
    if (type === 'web_researcher') {
      setName('Web Researcher');
      setRole('Web Researcher');
      setDescription('Search the web for top interaction patterns and summarize usability findings.');
      setGoal('Search the web for top interaction patterns and summarize usability findings.');
      setRules([
        'Always respond using markdown formatting.',
        'Extract insights from trusted blogs like Nielsen Norman Group.',
        'Provide structural page layouts in ASCII/Markdown.'
      ]);
    } else if (type === 'meeting_prepper') {
      setName('Meeting Prepper');
      setRole('Meeting Prepper');
      setDescription('Prepare dossiers and brief notes for participants of upcoming workshops.');
      setGoal('Prepare dossiers and brief notes for participants of upcoming workshops.');
      setRules([
        'Structure agenda, check items, and expected results.',
        'Include attendees backgrounds from CRM notes.'
      ]);
    } else if (type === 'email_assistant') {
      setName('Email Assistant');
      setRole('Email Assistant');
      setDescription('Draft and screen customer check-ins and proposals feedback.');
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

    const config = PRESET_CONFIGS[activePreset] || PRESET_CONFIGS.web_researcher;
    const steps = config.runSteps;

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setRunLogs(prev => [...prev, steps[i]]);
    }

    setIsRunning(false);
  };

  const handleStartExecution = async (customPrompt?: string) => {
    const inputPrompt = customPrompt !== undefined ? customPrompt : promptInput;
    if (!inputPrompt.trim() && customPrompt === undefined) {
      toast.error('Please enter a query or instructions first.');
      return;
    }
    
    setExecutionState('running');
    setCurrentStepIndex(0);
    setExecutedLogs([]);
    setCopiedText(false);
    
    if (customPrompt !== undefined) {
      setPromptInput(customPrompt);
    }

    const config = PRESET_CONFIGS[activePreset] || PRESET_CONFIGS.web_researcher;
    const steps = config.runSteps;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setExecutedLogs(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 850)); // Atmospheric slow transition
    }

    setExecutionState('completed');
    setRunOutput(config.runResult);
  };

  const handleResetExecution = () => {
    setExecutionState('idle');
    setPromptInput('');
    setCurrentStepIndex(-1);
    setExecutedLogs([]);
    setRunOutput('');
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(runOutput);
    setCopiedText(true);
    toast.success(t.app.agentBuilder.copied);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const toggleTriggerStatus = (id: string) => {
    setActiveTriggers(prev =>
      prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'idle' : 'active' } : t)
    );
    toast.success('Trigger configuration status updated.');
  };

  const runMockTestSuite = async () => {
    if (isTestingSuite) return;
    setIsTestingSuite(true);
    setTestSuiteProgress(0);

    for (let p = 10; p <= 100; p += 15) {
      await new Promise(r => setTimeout(r, 300));
      setTestSuiteProgress(Math.min(p, 100));
    }

    setTestCases(prev =>
      prev.map(t => t.id === 4 ? { ...t, status: 'success' } : t)
    );
    setIsTestingSuite(false);
    toast.success('Benchmark evaluation completed! All 4 test cases resolved successfully.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full select-none bg-[#0A0D14] font-sans">
      
      {/* Top Workspace Header Bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111522]/50 relative z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/app/agents')}
            className="p-1.5 hover:bg-white/5 rounded-lg border border-white/10 text-fog hover:text-silver transition-colors cursor-pointer"
            aria-label="Back to agents list"
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
                className="bg-transparent border-none text-xs font-bold text-ivory outline-none focus:bg-white/5 px-1 py-0.5 rounded transition-all"
                title="Agent Name"
                placeholder="Agent Name"
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

        {/* Center Build / Run / Evaluate Tabs (matching image copy 5.png) */}
        <div className="flex items-center bg-black/30 border border-white/5 rounded-lg p-0.5">
          <button
            onClick={() => { setActiveTab('build'); setSelectedToolId(null); }}
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
          <button
            onClick={() => setActiveTab('evaluate')}
            className={cn(
              "px-4 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'evaluate' ? "bg-white/10 text-ivory" : "text-fog hover:text-silver"
            )}
          >
            <Star size={10} /> Evaluate
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
            className="bg-[#7FA38A] text-midnight hover:bg-[#7FA38A]/90 rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer shadow-md"
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
        
        {/* Left Sidebar Menu */}
        <div className={cn(
          "shrink-0 bg-[#111522]/20 border-r border-white/5 p-2 flex flex-col justify-between transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          leftSidebarExpanded ? "w-52" : "w-14"
        )}>
          <div className="space-y-0.5">
            {[
              { id: 'prompt', label: 'Prompt', desc: 'Create guidelines for your agent', icon: Sparkles },
              { id: 'tools', label: 'Tools', desc: 'Used by agents to complete tasks', icon: Wrench },
              { id: 'knowledge', label: 'Knowledge', desc: 'Add your documents and data', icon: Database },
              { id: 'triggers', label: 'Triggers', desc: 'Run tasks on auto-pilot', icon: Cpu },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab('build');
                  setActiveSubTab(tab.id as any);
                  setSelectedToolId(null);
                }}
                className={cn(
                  "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer",
                  activeTab === 'build' && activeSubTab === tab.id
                    ? "text-[#7FA38A] bg-white/5 border border-white/5"
                    : "text-fog hover:text-silver hover:bg-white/3 border border-transparent"
                )}
              >
                <tab.icon size={13} className="mt-0.5 shrink-0" />
                {leftSidebarExpanded && (
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-none">{tab.label}</div>
                    <div className="text-[9px] text-fog mt-0.5 truncate">{tab.desc}</div>
                  </div>
                )}
              </button>
            ))}

            <div className="border-t border-white/5 my-2" />

            {[
              { id: 'alerts', label: 'Alerts', icon: Bell },
              { id: 'memory', label: 'Memory', icon: History },
              { id: 'variables', label: 'Variables', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab('build');
                  setActiveSubTab(tab.id as any);
                  setSelectedToolId(null);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-colors cursor-pointer",
                  activeTab === 'build' && activeSubTab === tab.id
                    ? "text-[#7FA38A] bg-white/5 border border-white/5"
                    : "text-fog hover:text-silver hover:bg-white/3 border border-transparent"
                )}
              >
                <tab.icon size={13} className="shrink-0" />
                {leftSidebarExpanded && (
                  <span className="text-[11px] font-bold leading-none">{tab.label}</span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 pt-2 border-t border-white/5">
            {leftSidebarExpanded && (
              <div className="px-2.5 py-1 text-[9px] font-bold text-fog tracking-wider uppercase">
                System
              </div>
            )}
            <button
              onClick={() => toast.info('Advanced settings opened.')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[10px] text-fog hover:text-silver cursor-pointer transition-colors"
            >
              <Settings size={12} className="shrink-0" />
              {leftSidebarExpanded && <span className="font-semibold">Advanced</span>}
            </button>
            <button
              onClick={() => toast.info('Help center opened.')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[10px] text-fog hover:text-silver cursor-pointer transition-colors"
            >
              <HelpCircle size={12} className="shrink-0" />
              {leftSidebarExpanded && <span className="font-semibold">Need help?</span>}
            </button>
            
            <button
              onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
              className="w-full flex items-center justify-end px-2 py-2 mt-1 text-fog hover:text-silver cursor-pointer"
            >
              {leftSidebarExpanded ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
            </button>
          </div>
        </div>

        {/* Center Panel */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-black/[0.05]">
          
          {/* Build Tab Content */}
          {activeTab === 'build' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Build - Prompt Subtab */}
              {activeSubTab === 'prompt' && (
                <div className="space-y-6">
                  {/* Agent Header Profile Block */}
                  <div className="flex items-start justify-between bg-[#111522]/40 border border-white/5 rounded-xl p-5 relative">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Bot size={24} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-sm font-bold text-ivory">{name || 'Untitled agent'}</h2>
                        <p className="text-[11px] text-fog leading-relaxed max-w-xl">{description || 'Turns transcripts into structured insights.'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toast.info('Refining prompts with AI model...')}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-ivory bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Sparkles size={11} className="text-[#7FA38A]" />
                        <span>Refine with AI</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('run')}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-ivory bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Play size={11} className="text-blue-400" />
                        <span>Test agent</span>
                      </button>
                    </div>
                  </div>

                  {/* Goal instructions panel */}
                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory">Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Write details on what you want your agent to accomplish..."
                        rows={2}
                        className="bg-black/30 border-white/5 text-xs text-silver rounded-xl resize-none focus:ring-1 focus:ring-[#7FA38A]/30"
                      />
                      {goal && (
                        <div className="bg-black/10 border border-white/3 rounded-lg p-3 space-y-1">
                          <div className="text-[10px] font-bold text-[#7FA38A] uppercase">Current Objective</div>
                          <p className="text-xs text-silver italic leading-relaxed">{goal}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tools badges panel */}
                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory">Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-[10px] text-fog leading-relaxed">Type &apos;/&apos; to mention tools in your instructions.</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.tools?.map((tool: string) => (
                          <div key={tool} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs text-blue-400 font-semibold">
                            <span>😎</span>
                            <span>{tool}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-black/20 border border-dashed border-white/5 p-3 rounded-lg text-[10px] text-fog italic flex items-center gap-2">
                        <span className="text-amber-500 font-bold">💡</span>
                        <span>You can also add comments like this that don&apos;t get sent to the agent.</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rules instructions panel */}
                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory flex items-center justify-between w-full">
                        <span>Rules</span>
                        <span className="text-[9px] text-[#7FA38A] lowercase font-normal italic">guidelines & guardrails</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-black/20 border border-dashed border-white/5 p-3 rounded-lg text-[10px] text-fog italic flex items-center gap-2">
                        <span className="text-blue-500 font-bold">💡</span>
                        <span>If your agent isn&apos;t working like you want it to, prompting is how you can guide it!</span>
                      </div>

                      {rules.length === 0 ? (
                        <p className="text-[11px] text-fog italic">No rules defined. Guide your agent by adding constraints.</p>
                      ) : (
                        <div className="space-y-2">
                          {rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-black/20 border border-white/5 px-3 py-1.5 rounded-lg text-xs text-silver">
                              <span className="flex items-center gap-2 font-mono text-xs">
                                <span className="text-fog">{idx + 1}.</span> {rule}
                              </span>
                              <button onClick={() => handleRemoveRule(idx)} className="text-fog hover:text-ember cursor-pointer" aria-label="Remove rule">
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
                          placeholder="e.g. Always respond using markdown formatting..."
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
                      {/* Web Researcher */}
                      <div className="rounded-xl border border-white/5 p-3.5 flex flex-col justify-between h-40 bg-gradient-to-br from-red-950/20 to-blue-950/20 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-ivory block">Web Researcher</span>
                          <span className="text-[10px] text-silver leading-relaxed line-clamp-2">Search the web and summarize usability findings.</span>
                        </div>
                        {/* Custom SVG node flow mapping */}
                        <div className="flex items-center gap-1.5 justify-center bg-black/40 py-2 px-2.5 rounded-lg border border-white/5">
                          <div className="h-5 w-5 rounded bg-red-500/10 flex items-center justify-center text-red-400">
                            <Globe size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Cpu size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-green-500/10 flex items-center justify-center text-green-400">
                            <Layout size={11} />
                          </div>
                        </div>
                        <button
                          onClick={() => applyTemplate('web_researcher')}
                          className="text-[10px] font-bold text-[#7FA38A] hover:underline self-start cursor-pointer mt-1"
                        >
                          Use template
                        </button>
                      </div>

                      {/* Meeting Prepper */}
                      <div className="rounded-xl border border-white/5 p-3.5 flex flex-col justify-between h-40 bg-gradient-to-br from-amber-950/20 to-orange-950/20 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-ivory block">Meeting Prepper</span>
                          <span className="text-[10px] text-silver leading-relaxed line-clamp-2">Prepare for meetings and send follow-ups.</span>
                        </div>
                        {/* Custom SVG node flow mapping */}
                        <div className="flex items-center gap-1.5 justify-center bg-black/40 py-2 px-2.5 rounded-lg border border-white/5">
                          <div className="h-5 w-5 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Calendar size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Bot size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <FileText size={11} />
                          </div>
                        </div>
                        <button
                          onClick={() => applyTemplate('meeting_prepper')}
                          className="text-[10px] font-bold text-[#7FA38A] hover:underline self-start cursor-pointer mt-1"
                        >
                          Use template
                        </button>
                      </div>

                      {/* Email Assistant */}
                      <div className="rounded-xl border border-white/5 p-3.5 flex flex-col justify-between h-40 bg-gradient-to-br from-purple-950/20 to-pink-950/20 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-ivory block">Email Assistant</span>
                          <span className="text-[10px] text-silver leading-relaxed line-clamp-2">Draft and respond to checkins professionally.</span>
                        </div>
                        {/* Custom SVG node flow mapping */}
                        <div className="flex items-center gap-1.5 justify-center bg-black/40 py-2 px-2.5 rounded-lg border border-white/5">
                          <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Mail size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                            <Star size={11} />
                          </div>
                          <ArrowRight size={8} className="text-fog" />
                          <div className="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Send size={11} />
                          </div>
                        </div>
                        <button
                          onClick={() => applyTemplate('email_assistant')}
                          className="text-[10px] font-bold text-[#7FA38A] hover:underline self-start cursor-pointer mt-1"
                        >
                          Use template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom API Keys Block */}
                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory flex items-center gap-1.5">
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
                    <h3 className="text-sm font-bold text-ivory">Knowledge</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Import data to teach your agents about new topics.
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
                          placeholder="Search knowledge tables..."
                          className="w-full pl-8 pr-3 bg-transparent border-none text-[11px] text-ivory placeholder-fog focus:ring-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-white/5">
                        <div className="grid grid-cols-3 text-[10px] font-bold text-fog pb-2 uppercase tracking-wider">
                          <span>Knowledge table</span>
                          <span>Type</span>
                          <span className="text-right">Actions</span>
                        </div>
                        {knowledgeTables
                          .filter(t => t.title.toLowerCase().includes(searchKnowledgeQuery.toLowerCase()))
                          .map((table) => (
                            <div key={table.id} className="grid grid-cols-3 items-center py-2.5 text-xs text-silver">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={13} className="text-[#7FA38A] shrink-0" />
                                <span className="font-mono truncate">{table.title}</span>
                                <span className="text-[9px] bg-[#7FA38A]/10 text-[#7FA38A] border border-[#7FA38A]/20 px-1.5 py-0.2 rounded font-bold">
                                  {table.status}
                                </span>
                              </div>
                              <span className="font-medium text-fog font-mono">{table.type}</span>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    setKnowledgeTables(prev => prev.filter(t => t.id !== table.id));
                                    toast.success('Knowledge table disconnected.');
                                  }}
                                  className="text-fog hover:text-ember p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                                  aria-label="Remove knowledge table"
                                >
                                  <X size={12} />
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
                      title="Upload knowledge source file"
                    />
                    <Upload size={22} className="text-fog mx-auto mb-3 group-hover:scale-105 transition-transform" />
                    <p className="text-xs text-silver font-semibold">
                      Drag & drop or <span className="text-blue-400 hover:underline">choose files</span> to upload.
                    </p>
                    <p className="text-[10px] text-fog mt-1">
                      Supported formats: .csv, .json, .pdf, .xlsx, .xls, .txt, .md, .docx, .pptx. Max 5 files per upload.
                    </p>
                  </div>

                  {/* Integration buttons grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Add Google Drive', icon: Globe, color: 'text-blue-400' },
                      { label: 'Add Sharepoint', icon: Network, color: 'text-green-400' },
                      { label: 'Add Notion', icon: Layers, color: 'text-purple-400' },
                      { label: 'Add existing knowledge', icon: Database, color: 'text-[#B89B6A]' },
                      { label: 'Import website', icon: Globe, color: 'text-cyan-400' },
                      { label: 'Blank table', icon: Grid, color: 'text-fog' },
                      { label: 'Markdown/Text', icon: FileText, color: 'text-pink-400' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={() => toast.info(`${btn.label} wizard activated.`)}
                        className="flex items-center gap-2 px-3 py-2 bg-[#111522] border border-white/5 rounded-lg text-[10px] font-bold text-silver hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <btn.icon size={11} className={btn.color} />
                        <span className="truncate">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Build - Tools Subtab (matching image copy 6.png) */}
              {activeSubTab === 'tools' && (
                <div className="space-y-6">
                  {selectedToolId ? (
                    /* Tool Builder Subview matching file5.png */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      
                      {/* Left specs sidebar */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedToolId(null)}
                            className="p-1 hover:bg-white/5 rounded text-fog hover:text-silver cursor-pointer"
                            aria-label="Back to tools list"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <h4 className="text-xs font-bold text-ivory">Back to tools list</h4>
                        </div>

                        <div className="bg-[#111522]/80 border border-white/5 rounded-xl p-4 space-y-4 text-xs">
                          <div>
                            <div className="text-[10px] font-bold text-fog uppercase">Tool Title</div>
                            <div className="text-ivory font-bold mt-1 text-xs">Summarize PDF and Extract Key Actions</div>
                          </div>
                          
                          <div className="border-t border-white/5 pt-3 space-y-2">
                            <div>
                              <div className="text-[10px] font-bold text-fog uppercase">Owner</div>
                              <div className="text-silver mt-0.5">Responsible party (if mentioned)</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-fog uppercase">Deadline</div>
                              <div className="text-silver mt-0.5">Specific dates or &quot;Not specified&quot;</div>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3">
                            <div className="text-[10px] font-bold text-fog uppercase mb-1">Structured Output</div>
                            <ul className="list-disc pl-4 space-y-1 text-silver text-[11px]">
                              <li>Summary text</li>
                              <li>List of key actions with full details</li>
                              <li>Action count breakdown by priority level</li>
                            </ul>
                          </div>

                          <div className="border-t border-white/5 pt-3">
                            <div className="text-[10px] font-bold text-fog uppercase mb-1">Tool Inputs</div>
                            <ul className="list-disc pl-4 space-y-1 text-silver text-[11px]">
                              <li>PDF File URL (required): The URL of the PDF to process</li>
                              <li>Summary Length (optional): brief, standard, or detailed</li>
                            </ul>
                          </div>

                          <div className="border-t border-white/5 pt-3">
                            <div className="text-[10px] font-bold text-fog uppercase mb-1">Assumptions Made</div>
                            <ul className="list-disc pl-4 space-y-1 text-silver text-[11px]">
                              <li>The PDF file is accessible via a public URL</li>
                              <li>The LLM will return structured JSON with summary and actions</li>
                              <li>GPT-4o or Claude 3.5 Sonnet utilized for high fidelity extraction</li>
                            </ul>
                          </div>

                          <button
                            onClick={handleRunTool}
                            className="w-full flex items-center justify-between bg-black/40 border border-white/5 px-3 py-2 rounded-lg text-silver hover:bg-white/5 hover:text-ivory text-[11px]"
                          >
                            <span className="font-semibold">Suggested next action</span>
                            <div className="flex items-center gap-1 text-[#7FA38A]">
                              <span>Run tool</span>
                              <ArrowRight size={12} />
                            </div>
                          </button>
                        </div>

                        {/* Ask Inventor component at the bottom left */}
                        <div className="bg-[#111522]/80 border border-[#7FA38A]/20 rounded-xl p-3.5 space-y-2">
                          <label className="text-[10px] font-bold text-[#7FA38A] uppercase">AI Inventor Builder</label>
                          <div className="flex gap-2 bg-black/30 border border-white/5 rounded-lg p-1">
                            <textarea
                              placeholder="Ask Inventor to build anything..."
                              rows={1}
                              className="bg-transparent border-none text-xs text-ivory placeholder-fog outline-none flex-1 resize-none py-1.5 px-2"
                              title="Ask Inventor to build anything"
                            />
                            <button
                              className="h-7 w-7 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 flex items-center justify-center cursor-pointer transition-colors self-end"
                              aria-label="Send prompt to AI Inventor"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right main builder area */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* SOP standard operating procedure panel */}
                        <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                          <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-[#B89B6A]" />
                              <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory">Standard Operating Procedure</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setToolViewMode('build')}
                                className={cn("px-2.5 py-1 rounded text-[10px] font-bold", toolViewMode === 'build' ? 'bg-white/10 text-ivory' : 'text-fog hover:text-silver')}
                              >
                                Build
                              </button>
                              <button
                                onClick={() => setToolViewMode('logs')}
                                className={cn("px-2.5 py-1 rounded text-[10px] font-bold", toolViewMode === 'logs' ? 'bg-white/10 text-ivory' : 'text-fog hover:text-silver')}
                              >
                                Logs
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            {toolViewMode === 'build' ? (
                              <div className="space-y-4 text-xs leading-relaxed text-silver font-sans select-text">
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-1">
                                  <div className="font-bold text-ivory">**Tool Purpose:**</div>
                                  <p className="text-fog">Extract text from a PDF file, generate a comprehensive summary, and identify all key actions that need to be completed.</p>
                                </div>

                                <div className="space-y-3 pl-1">
                                  <div className="font-bold text-ivory">**Main Workflow:**</div>
                                  
                                  <div className="space-y-1">
                                    <div className="font-bold text-silver">1. **Extract PDF Text**</div>
                                    <p className="text-fog pl-4">- Use the `file_to_text_llm_friendly` helper to convert PDF content to readable text.</p>
                                    <p className="text-fog pl-4">- Ensure text is formatted for LLM processing.</p>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="font-bold text-silver">2. **Generate Summary**</div>
                                    <p className="text-fog pl-4">- Use LLM to analyze the extracted text.</p>
                                    <p className="text-fog pl-4">- Create a concise summary capturing main points and context.</p>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="font-bold text-silver">3. **Extract Key Actions**</div>
                                    <p className="text-fog pl-4">- Use LLM to identify all actionable items from the document.</p>
                                    <p className="text-fog pl-4">- Categorize actions by priority, owner, or deadline if available.</p>
                                    <p className="text-fog pl-4">- Format actions as a structured list.</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 font-mono text-[10px] text-[#7FA38A] bg-black/30 p-3.5 rounded-lg border border-white/5 min-h-[200px]">
                                <div>[16:34:10] Initialization completed.</div>
                                <div>[16:34:11] Connected to model standard quota.</div>
                                <div>[16:34:15] Memory cache loaded.</div>
                                <div className="text-fog italic">No executions in this session yet.</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Execute Sandbox component inside tool */}
                        <Card className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                          <CardHeader>
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory">Summarize PDF and Extract Key Actions</CardTitle>
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
                                title="Summary Length"
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

                            {/* Execution Terminal */}
                            {runLogs.length > 0 && (
                              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 font-mono text-[9px] text-[#7FA38A] space-y-1 min-h-[120px] select-text">
                                <div className="text-fog mb-2 text-[8px] font-sans font-bold">Execution Logs</div>
                                {runLogs.map((log, idx) => (
                                  <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                    </div>
                  ) : (
                    /* Redesigned interactive visual Tools flow (matching image copy 6.png) */
                    <div className="space-y-8">
                      <div className="space-y-1 text-center max-w-xl mx-auto">
                        <h3 className="text-sm font-bold text-ivory">Tools</h3>
                        <p className="text-[11px] text-fog leading-relaxed">
                          Used by agents to complete tasks. Build your custom automation workflow by chaining tool execution steps.
                        </p>
                      </div>

                      {/* Visual nodes sequential diagram */}
                      <div className="flex flex-col items-center bg-black/30 p-6 rounded-xl border border-white/5 max-w-md mx-auto space-y-3">
                        {toolsWorkflow.length === 0 ? (
                          <div className="text-center py-6 text-silver text-xs italic">No tools connected to agent. Add a tool node to begin.</div>
                        ) : (
                          toolsWorkflow.map((nodeName, index) => (
                            <React.Fragment key={index}>
                              {index > 0 && (
                                <svg className="h-6 w-6 text-fog" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <polyline points="19 12 12 19 5 12" />
                                </svg>
                              )}
                              <div className="flex items-center justify-between w-full bg-[#111522] border border-white/8 rounded-xl p-3.5 hover:border-[#7FA38A]/20 transition-all group relative">
                                <div className="flex items-center gap-3">
                                  <div className="h-6 w-6 rounded bg-[#7FA38A]/10 border border-[#7FA38A]/20 flex items-center justify-center text-[#7FA38A]">
                                    <Zap size={12} />
                                  </div>
                                  <div className="text-left">
                            <div className="text-[9px] font-bold text-fog uppercase">Step {index + 1}</div>
                                    <div className="text-xs font-bold text-ivory mt-0.5">{nodeName}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setToolsWorkflow(prev => prev.filter((_, idx) => idx !== index));
                                    toast.success(`Removed ${nodeName} from workflow`);
                                  }}
                                  className="text-fog hover:text-ember opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5 cursor-pointer"
                                  aria-label={`Remove ${nodeName} step`}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </React.Fragment>
                          ))
                        )}
                      </div>

                      {/* Add Tool / Add MCP Actions */}
                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={() => setShowAddToolModal(true)}
                          className="bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-xs font-bold h-9 px-4 cursor-pointer flex items-center gap-1.5 shadow-md"
                        >
                          <Plus size={13} /> Add tool
                        </Button>
                        <Button
                          onClick={() => setShowAddMcpModal(true)}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-silver rounded-lg text-xs font-bold h-9 px-4 cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus size={13} /> Add MCP
                        </Button>
                      </div>

                      {/* Popular tools section at the bottom */}
                      <div className="border-t border-white/5 pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-ivory">or try popular tools:</h4>
                          <div className="relative max-w-xs bg-black/20 border border-white/5 rounded-lg overflow-hidden group h-7 flex items-center">
                            <Search className="absolute left-2 text-fog" size={11} />
                            <Input
                              value={popularToolQuery}
                              onChange={(e) => setPopularToolQuery(e.target.value)}
                              placeholder="Search popular tools..."
                              className="w-full pl-7 pr-3 bg-transparent border-none text-[10px] text-ivory placeholder-fog focus:ring-0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { name: 'Analyze CSV Data', category: 'data' },
                            { name: 'Extract Company Insights from Website', category: 'web' },
                            { name: 'Extract Data from PDF', category: 'pdf' },
                            { name: 'Extract Webpage Content', category: 'web' },
                            { name: 'Extract and Summarize LinkedIn Profile', category: 'linkedin' },
                            { name: 'Extract and Summarize Website Content', category: 'web' },
                            { name: 'Generate Image', category: 'media' },
                            { name: 'Get Email Content from Gmail', category: 'mail' },
                          ]
                            .filter(t => t.name.toLowerCase().includes(popularToolQuery.toLowerCase()))
                            .map((tool) => (
                              <button
                                key={tool.name}
                                onClick={() => {
                                  setToolsWorkflow(prev => [...prev, tool.name]);
                                  toast.success(`Added ${tool.name} to tools workflow!`);
                                }}
                                className="flex flex-col justify-between p-3 bg-[#111522] border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/[0.01] transition-all text-left h-24 cursor-pointer"
                              >
                                <span className="text-[10px] font-bold text-ivory leading-snug line-clamp-2">{tool.name}</span>
                                <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-fog font-mono font-bold uppercase self-start mt-2">{tool.category}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Build - Triggers Subtab (matching image copy 7.png) */}
              {activeSubTab === 'triggers' && (
                <div className="space-y-8">
                  <div className="space-y-1 text-center max-w-xl mx-auto">
                    <h3 className="text-sm font-bold text-ivory">Triggers</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Triggers allow your agent to work on auto-pilot.
                    </p>
                  </div>

                  {/* Radiating Star Connectors Visualization diagram matching image copy 7.png */}
                  <div className="relative h-64 w-full flex items-center justify-center bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                    {/* Visual connecting lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                      <line x1="25%" y1="12%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="75%" y1="12%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="12%" y1="50%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="88%" y1="50%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="50%" y1="85%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4" />
                    </svg>

                    {/* Outer radiating app nodes */}
                    <div className="absolute top-8 left-1/4 h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-bounce">
                      <Mail size={16} />
                    </div>
                    <div className="absolute top-8 right-1/4 h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-bounce [animation-delay:0.2s]">
                      <Globe size={16} />
                    </div>
                    <div className="absolute top-1/2 left-8 -translate-y-1/2 h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-bounce [animation-delay:0.4s]">
                      <MessageSquare size={16} />
                    </div>
                    <div className="absolute top-1/2 right-8 -translate-y-1/2 h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 animate-bounce [animation-delay:0.6s]">
                      <Layers size={16} />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 animate-bounce [animation-delay:0.8s]">
                      <Zap size={16} />
                    </div>

                    {/* Center platform with avatar */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-blue-600/10 border-2 border-blue-500/30 flex items-center justify-center shadow-lg animate-pulse">
                        <Bot size={32} className="text-blue-400" />
                      </div>
                      <div className="text-[9px] font-bold text-ivory mt-2 bg-blue-950/40 border border-blue-800/30 px-2 py-0.5 rounded-full select-none">
                        Agent Platform
                      </div>
                    </div>
                  </div>

                  {/* Title & Add Actions */}
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-ivory">Automate your Agent with Triggers</h4>
                      <p className="text-[10px] text-fog leading-relaxed">
                        Triggers let your Agent take action automatically when something happens in your apps
                      </p>
                    </div>

                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => setShowAddTriggerModal(true)}
                        className="bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-xs font-bold h-9 px-4 cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <Plus size={13} /> Add your first trigger
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddTriggerModal(true);
                          toast.info('Selecting Slack connector as default trigger setup.');
                        }}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-silver rounded-lg text-xs font-bold h-9 px-4 cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare size={13} className="text-purple-400 animate-pulse" /> Trigger in Slack
                      </Button>
                    </div>
                  </div>

                  {/* Active Triggers list */}
                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <h4 className="text-xs font-bold text-ivory">Active Connected Triggers</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTriggers.map((trig) => (
                        <Card key={trig.id} className="bg-[#111522]/80 border border-white/5 rounded-xl shadow-none">
                          <CardContent className="pt-5 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-9 w-9 rounded-lg flex items-center justify-center",
                                  trig.type === 'schedule' ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'
                                )}>
                                  {trig.type === 'schedule' ? <Clock size={16} /> : <MessageSquare size={16} />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-ivory">{trig.name}</h4>
                                  <p className="text-[10px] text-fog mt-0.5">{trig.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleTriggerStatus(trig.id)}
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded font-bold transition-colors cursor-pointer border",
                                  trig.status === 'active' ? "bg-[#7FA38A]/10 text-[#7FA38A] border-[#7FA38A]/20" : "bg-white/5 text-fog border-white/10"
                                )}
                              >
                                {trig.status === 'active' ? 'Enabled' : 'Disabled'}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Schedule messages card (matching image copy 7.png) */}
                  <div className="bg-[#111522]/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-ivory">Schedule messages</h4>
                      <p className="text-[10px] text-fog">Allow your agent to schedule future actions.</p>
                    </div>
                    <Button
                      onClick={() => router.push('/app/billing')}
                      className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg text-[10px] font-bold h-7 px-4 border border-purple-500/30"
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}

              {/* Build - Alerts Subtab */}
              {activeSubTab === 'alerts' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ivory">Alerts</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Monitor execution warnings, rate limits, or diagnostic messages.
                    </p>
                  </div>

                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardContent className="pt-4 divide-y divide-white/5">
                      {alerts.map((al) => (
                        <div key={al.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <AlertCircle size={14} className={cn(
                              al.type === 'error' ? 'text-rose-400' : al.type === 'warning' ? 'text-amber-400' : 'text-[#7FA38A]'
                            )} />
                            <span className="text-xs text-silver font-mono">{al.msg}</span>
                          </div>
                          <span className="text-[10px] text-fog font-medium">{al.time}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Build - Memory Subtab */}
              {activeSubTab === 'memory' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ivory">Agent Memory</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      View and edit the persistent memory/context stored by this agent across runs.
                    </p>
                  </div>

                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        {memories.map((mem, i) => (
                          <div key={i} className="flex items-center justify-between bg-black/20 border border-white/5 px-3 py-2 rounded-lg text-xs text-silver">
                            <span>{mem}</span>
                            <button
                              onClick={() => setMemories(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-fog hover:text-ember cursor-pointer"
                              aria-label="Remove memory"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          value={newMemory}
                          onChange={(e) => setNewMemory(e.target.value)}
                          placeholder="Add custom context/memory string..."
                          className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-8"
                        />
                        <Button
                          onClick={() => {
                            if (!newMemory.trim()) return;
                            setMemories(prev => [...prev, newMemory.trim()]);
                            setNewMemory('');
                            toast.success('Memory record added.');
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs text-silver h-8 px-3 cursor-pointer"
                        >
                          Add memory
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Build - Variables Subtab */}
              {activeSubTab === 'variables' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ivory">Agent Variables</h3>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Manage reusable key-value environment variables and templating parameters.
                    </p>
                  </div>

                  <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-[10px] font-bold text-fog uppercase border-b border-white/5 pb-1">
                          <span>Key</span>
                          <span>Value</span>
                        </div>
                        {variables.map((v, i) => (
                          <div key={i} className="grid grid-cols-2 items-center text-xs text-silver font-mono py-1">
                            <span className="text-blue-400">{v.key}</span>
                            <div className="flex items-center justify-between">
                              <span className="truncate">{v.value}</span>
                              <button
                                onClick={() => setVariables(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-fog hover:text-ember cursor-pointer"
                                aria-label={`Remove variable ${v.key}`}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <Input
                          value={newVarKey}
                          onChange={(e) => setNewVarKey(e.target.value)}
                          placeholder="VARIABLE_KEY"
                          className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-8"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={newVarVal}
                            onChange={(e) => setNewVarVal(e.target.value)}
                            placeholder="Value"
                            className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-8 flex-1"
                          />
                          <Button
                            onClick={() => {
                              if (!newVarKey.trim() || !newVarVal.trim()) return;
                              setVariables(prev => [...prev, { key: newVarKey.trim().toUpperCase(), value: newVarVal.trim() }]);
                              setNewVarKey('');
                              setNewVarVal('');
                              toast.success('Variable created.');
                            }}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs text-silver h-8 px-3 cursor-pointer"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          )}

          {/* Run Tab Content - Relevance AI Redesigned Prompt Console */}
          {activeTab === 'run' && (
            <div className="w-full">
              {executionState === 'idle' ? (
                <div className="max-w-xl mx-auto py-12 space-y-8">
                  
                  {/* Centered Identity Card */}
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full border border-white/10 flex items-center justify-center text-ivory text-lg font-bold shadow-lg bg-[#111522]/80">
                      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-base", PRESET_CONFIGS[activePreset]?.avatar || 'bg-blue-600')}>
                        {PRESET_CONFIGS[activePreset]?.initials || 'A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-lg font-bold text-ivory tracking-tight">{name || 'Agent'}</h1>
                      <p className="text-xs text-fog max-w-sm mx-auto">
                        {activePreset === 'web_researcher' && t.app.agentBuilder.helperTextWeb}
                        {activePreset === 'meeting_prepper' && t.app.agentBuilder.helperTextMeeting}
                        {activePreset === 'email_assistant' && t.app.agentBuilder.helperTextEmail}
                      </p>
                    </div>
                  </div>

                  {/* Prompt Card Box */}
                  <div className="bg-[#111522] border border-white/5 rounded-2xl p-4 shadow-xl relative focus-within:border-[#7FA38A]/30 transition-all duration-300">
                    <textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder={
                        activePreset === 'web_researcher' ? t.app.agentBuilder.promptPlaceholderWeb :
                        activePreset === 'meeting_prepper' ? t.app.agentBuilder.promptPlaceholderMeeting :
                        t.app.agentBuilder.promptPlaceholderEmail
                      }
                      rows={4}
                      className="w-full bg-transparent border-none text-xs text-silver outline-none resize-none focus:ring-0 placeholder:text-fog/60 leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleStartExecution();
                        }
                      }}
                    />
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            toast.info('File attachment is simulated.');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 text-[10px] text-silver hover:text-ivory transition-colors cursor-pointer"
                        >
                          <Plus size={11} className="text-[#7FA38A]" />
                          <span>{t.app.agentBuilder.attachFiles}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setMicActive(!micActive);
                            if (!micActive) {
                              toast.info('Voice prompt mode activated (simulated).');
                            }
                          }}
                          className={cn(
                            "p-2 rounded-full border transition-all cursor-pointer",
                            micActive 
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                              : "bg-white/2 border-white/5 text-fog hover:text-silver hover:bg-white/5"
                          )}
                          title="Voice input"
                        >
                          <Mic size={13} />
                        </button>

                        <button
                          onClick={() => handleStartExecution()}
                          className="h-8 w-8 rounded-full bg-ivory text-black flex items-center justify-center hover:bg-ivory/90 transition-all cursor-pointer shadow-md active:scale-95"
                          title="Run Agent"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Start Templates */}
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-bold text-fog uppercase tracking-wider text-center">
                      {t.app.agentBuilder.quickPromptsTitle}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activePreset === 'web_researcher' && (
                        <>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptWeb1)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptWeb1}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptWeb2)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptWeb2}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        </>
                      )}
                      {activePreset === 'meeting_prepper' && (
                        <>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptMeeting1)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptMeeting1}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptMeeting2)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptMeeting2}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        </>
                      )}
                      {activePreset === 'email_assistant' && (
                        <>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptEmail1)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptEmail1}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                          <div
                            onClick={() => handleStartExecution(t.app.agentBuilder.quickPromptEmail2)}
                            className="bg-[#111522] hover:bg-[#171C2A] border border-white/5 rounded-xl p-3.5 text-left text-xs text-silver hover:text-ivory transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="font-semibold pr-2">{t.app.agentBuilder.quickPromptEmail2}</span>
                            <ArrowRight size={12} className="text-fog group-hover:text-[#7FA38A] group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6 pb-12">
                  
                  {/* Top Status Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs", PRESET_CONFIGS[activePreset]?.avatar || 'bg-blue-600')}>
                        {PRESET_CONFIGS[activePreset]?.initials || 'A'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ivory">{name}</div>
                        <div className="text-[10px] text-fog mt-0.5 flex items-center gap-1.5">
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full animate-pulse",
                            executionState === 'running' ? "bg-[#7FA38A]" : "bg-blue-400 animate-none"
                          )} />
                          <span>
                            {executionState === 'running' ? t.app.agentBuilder.runStateRunning : t.app.agentBuilder.runStateCompleted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {executionState === 'completed' && (
                      <Button
                        onClick={handleResetExecution}
                        variant="outline"
                        size="sm"
                        className="border-white/10 hover:bg-white/5 text-[10px] font-bold text-silver hover:text-ivory h-7 cursor-pointer"
                      >
                        <RotateCcw size={11} className="mr-1.5" /> {t.app.agentBuilder.runAgain}
                      </Button>
                    )}
                  </div>

                  {/* Execution Pipeline Steps (Relevance AI style) */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-fog uppercase tracking-wider">
                      Execution Pipeline
                    </div>
                    
                    <div className="space-y-3">
                      {(PRESET_CONFIGS[activePreset]?.tools || []).map((tool, toolIdx) => {
                        // Determine status of this tool node based on current steps list
                        let status: 'pending' | 'running' | 'completed' = 'pending';
                        if (executionState === 'completed') {
                          status = 'completed';
                        } else {
                          const currentToolIdx = Math.floor(currentStepIndex / 2);
                          if (toolIdx < currentToolIdx) {
                            status = 'completed';
                          } else if (toolIdx === currentToolIdx) {
                            status = 'running';
                          }
                        }

                        // Collect step logs specific to this tool
                        const toolStepStart = toolIdx * 2;
                        const toolLogs = executedLogs.slice(toolStepStart, toolStepStart + 2);

                        return (
                          <div 
                            key={toolIdx}
                            className={cn(
                              "bg-[#111522] border rounded-xl p-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                              status === 'running' ? "border-[#7FA38A]/30 shadow-md scale-[1.01]" : "border-white/5 opacity-80",
                              status === 'pending' && "opacity-40"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 transition-colors duration-300",
                                  status === 'completed' ? "bg-[#7FA38A]/10 border-[#7FA38A]/30 text-[#7FA38A]" :
                                  status === 'running' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                                  "bg-white/2 border-white/5 text-fog"
                                )}>
                                  {status === 'completed' ? (
                                    <Check size={13} />
                                  ) : status === 'running' ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <tool.icon size={13} />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-ivory flex items-center gap-1.5">
                                    <span>{tool.name}</span>
                                    {status === 'running' && (
                                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.25 rounded-md font-mono font-normal tracking-wide animate-pulse uppercase">Active</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-fog mt-0.5">{tool.desc}</div>
                                </div>
                              </div>
                            </div>

                            {/* Inner Terminal Step logs for this node */}
                            {toolLogs.length > 0 && (
                              <div className="mt-3.5 bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-[9px] text-[#7FA38A]/95 space-y-1.5">
                                {toolLogs.map((log, lIdx) => (
                                  <div key={lIdx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                                ))}
                                {status === 'running' && (
                                  <span className="inline-block w-1 h-3 bg-[#7FA38A] animate-[pulse_0.8s_infinite] ml-1" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Premium Output Block */}
                  {executionState === 'completed' && (
                    <div className="space-y-3 pt-2">
                      <div className="text-[10px] font-bold text-fog uppercase tracking-wider">
                        Response Output
                      </div>

                      <div className="bg-[#111522] border border-[#7FA38A]/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-[#7FA38A]/3 blur-xl pointer-events-none rounded-full" />
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles size={13} className="text-[#7FA38A]" />
                            <span className="text-[10px] font-bold text-fog uppercase tracking-wider">Structured Markdown Result</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyOutput}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-ivory border border-white/10 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                            >
                              <Share2 size={11} />
                              <span>{copiedText ? t.app.agentBuilder.copied : t.app.agentBuilder.copyOutput}</span>
                            </button>
                          </div>
                        </div>

                        {/* Beautifully Rendered Markdown Text */}
                        <div className="max-w-none select-text">
                          {renderMarkdown(runOutput)}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Evaluate Tab Canvas */}
          {activeTab === 'evaluate' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ivory">Evaluate</h3>
                <p className="text-[11px] text-fog leading-relaxed">
                  Run automated benchmark suites and verify output conformity against rules.
                </p>
              </div>

              {/* Benchmark metrics scorecards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-[#111522]/80 border border-white/5 rounded-xl p-4 shadow-none space-y-2">
                  <div className="text-[9px] font-bold text-fog uppercase">Accuracy / Precision</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-ivory">98.2%</span>
                    <span className="text-[9px] bg-[#7FA38A]/10 text-[#7FA38A] border border-[#7FA38A]/20 px-2 py-0.5 rounded-full font-bold">optimal</span>
                  </div>
                  <div className="w-full bg-black/30 h-1 rounded overflow-hidden">
                    <div className="bg-[#7FA38A] h-full w-[98.2%]" />
                  </div>
                </Card>

                <Card className="bg-[#111522]/80 border border-white/5 rounded-xl p-4 shadow-none space-y-2">
                  <div className="text-[9px] font-bold text-fog uppercase">Avg. Response Latency</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-ivory">1.84s</span>
                    <span className="text-[9px] text-[#7FA38A] font-semibold">-0.12s delta</span>
                  </div>
                  <div className="w-full bg-black/30 h-1 rounded overflow-hidden">
                    <div className="bg-[#7FA38A] h-full w-[82%]" />
                  </div>
                </Card>

                <Card className="bg-[#111522]/80 border border-white/5 rounded-xl p-4 shadow-none space-y-2">
                  <div className="text-[9px] font-bold text-fog uppercase">Rule Compliance Index</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-ivory">100%</span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">verified</span>
                  </div>
                  <div className="w-full bg-black/30 h-1 rounded overflow-hidden">
                    <div className="bg-blue-500 h-full w-full" />
                  </div>
                </Card>
              </div>

              {/* Test cases list table */}
              <Card className="bg-[#111522]/85 border border-white/5 rounded-xl shadow-none">
                <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs uppercase tracking-wider font-bold text-ivory">Benchmark Evaluation Suite</CardTitle>
                  <Button
                    onClick={runMockTestSuite}
                    disabled={isTestingSuite}
                    className="bg-[#7FA38A] text-midnight hover:bg-[#7FA38A]/90 rounded-lg text-[10px] font-bold h-7 px-4"
                  >
                    {isTestingSuite ? (
                      <>
                        <Loader2 size={11} className="animate-spin mr-1" /> Evaluating...
                      </>
                    ) : (
                      'Run test cases'
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {isTestingSuite && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-[#7FA38A]">
                        <span>Running tests...</span>
                        <span>{testSuiteProgress}%</span>
                      </div>
                      <div className="w-full bg-black/30 h-1.5 rounded overflow-hidden">
                        <ProgressBar pct={testSuiteProgress} />
                      </div>

                    </div>
                  )}

                  <div className="divide-y divide-white/5">
                    <div className="grid grid-cols-4 text-[10px] font-bold text-fog pb-2 uppercase tracking-wider">
                      <span className="col-span-2">Test File / Input</span>
                      <span>Expected Output Target</span>
                      <span className="text-right">Execution Status</span>
                    </div>

                    {testCases.map((tc) => (
                      <div key={tc.id} className="grid grid-cols-4 items-center py-3 text-xs text-silver">
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <FileText size={13} className="text-blue-400 shrink-0" />
                          <span className="font-mono truncate">{tc.name}</span>
                        </div>
                        <span className="text-fog truncate">{tc.expected}</span>
                        <div className="flex justify-end">
                          <span className={cn(
                            "text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase",
                            tc.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          )}>
                            {tc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* Right collapsible options pane matching image copy 5.png */}
        {rightPanelOpen && !collapsed && (
          <div className="shrink-0 w-56 bg-[#111522]/30 border-l border-white/5 p-4 space-y-6 overflow-y-auto scrollbar-thin">
            
            {/* Triggers Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">{t.app.agentBuilder.triggersTitle}</span>
                <button
                  onClick={() => {
                    setActiveTab('build');
                    setActiveSubTab('triggers');
                    setSelectedToolId(null);
                  }}
                  className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5"
                >
                  <Plus size={8} /> Add
                </button>
              </div>

              {/* Dynamic triggers config per preset */}
              {activePreset === 'web_researcher' && (
                <div className="space-y-2.5">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-ivory flex items-center gap-1">
                        <Zap size={10} className="text-green-400" />
                        <span>Incoming Webhook</span>
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://api.minerva.io/v1/webhooks/wr_abc123');
                          toast.success('Webhook URL copied!');
                        }}
                        className="text-[#7FA38A] hover:text-[#7FA38A]/80 text-[8px] font-bold cursor-pointer"
                      >
                        {t.app.agentBuilder.webhookCopy}
                      </button>
                    </div>
                    <div className="font-mono text-[8px] text-fog select-all break-all bg-black/20 p-1.5 rounded border border-white/3">
                      https://api.minerva.io/v1/webhooks/wr_abc123
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center gap-2">
                    <MessageSquare size={11} className="text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-ivory">Slack channel trigger</div>
                      <div className="text-[8px] text-fog mt-0.5">Posts in #ux-research</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreset === 'meeting_prepper' && (
                <div className="space-y-2.5">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-ivory flex items-center gap-1">
                        <Calendar size={10} className="text-[#B89B6A]" />
                        <span>{t.app.agentBuilder.calendarSelect}</span>
                      </span>
                    </div>
                    
                    <select
                      defaultValue="work"
                      title="Select calendar"
                      className="w-full bg-black/50 border border-white/5 rounded px-1.5 py-1 text-[9px] text-silver outline-none"
                    >
                      <option value="work">Work Calendar</option>
                      <option value="bolt">Bolt Tech Syncs</option>
                    </select>

                    <label className="flex items-center gap-2 text-[8px] text-fog cursor-pointer select-none">
                      <input type="checkbox" defaultChecked title="Fires 10 mins before event" className="rounded border-white/5 bg-black/50 text-[#7FA38A] focus:ring-0 w-2.5 h-2.5 cursor-pointer" />
                      <span>Fires 10 mins before event</span>
                    </label>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center gap-2">
                    <Clock size={11} className="text-silver shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-ivory">Schedule Trigger</div>
                      <div className="text-[8px] text-fog mt-0.5">Every weekday at 8:00 AM</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreset === 'email_assistant' && (
                <div className="space-y-2.5">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-ivory flex items-center gap-1">
                        <Mail size={10} className="text-rose-400" />
                        <span>Gmail Inbox Monitor</span>
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-[8px] text-fog">{t.app.agentBuilder.subjectFilter}</div>
                      <input
                        type="text"
                        defaultValue="Acme Corp Feedback"
                        title="Subject Filter"
                        placeholder="Subject Filter"
                        className="w-full bg-black/50 border border-white/5 rounded px-1.5 py-1 text-[9px] text-silver outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[8px] text-fog cursor-pointer select-none">
                      <input type="checkbox" defaultChecked title="Auto-draft replies" className="rounded border-white/5 bg-black/50 text-[#7FA38A] focus:ring-0 w-2.5 h-2.5 cursor-pointer" />
                      <span>Auto-draft replies</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Tools Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">{t.app.agentBuilder.toolsTitle}</span>
                <button
                  onClick={() => {
                    setActiveTab('build');
                    setActiveSubTab('tools');
                    setSelectedToolId(null);
                  }}
                  className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5"
                >
                  <Plus size={8} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {(PRESET_CONFIGS[activePreset]?.tools || []).map((tool, tIdx) => (
                  <div
                    key={tIdx}
                    onClick={() => {
                      setActiveTab('build');
                      setActiveSubTab('tools');
                      setSelectedToolId(tool.name);
                    }}
                    className="flex items-center justify-between bg-black/20 hover:bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg text-[10px] text-silver font-semibold cursor-pointer transition-colors"
                  >
                    <span className="truncate flex-1 pr-1 font-mono flex items-center gap-1.5">
                      <tool.icon size={10} className="text-blue-400 shrink-0" />
                      <span className="truncate">{tool.name}</span>
                    </span>
                    <Wrench size={10} className="text-[#7FA38A] shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Knowledge</span>
                <button
                  onClick={() => {
                    setActiveTab('build');
                    setActiveSubTab('knowledge');
                    setSelectedToolId(null);
                  }}
                  className="text-[#7FA38A] hover:underline text-[9px] font-bold cursor-pointer flex items-center gap-0.5"
                >
                  <Plus size={8} /> Add
                </button>
              </div>
              
              <div className="border border-dashed border-white/10 rounded-lg p-3 text-center bg-black/20 hover:bg-white/[0.01] transition-colors relative">
                <input
                  type="file"
                  onChange={handleUploadFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={14} className="text-fog mx-auto mb-1" />
                <div className="text-[9px] text-silver font-bold">Drag & drop files</div>
                <div className="text-[8px] text-fog">Import custom files or tables.</div>
              </div>

              <div className="space-y-1">
                {knowledgeTables.slice(0, 3).map((tbl) => (
                  <div
                    key={tbl.id}
                    onClick={() => {
                      setActiveTab('build');
                      setActiveSubTab('knowledge');
                    }}
                    className="flex items-center gap-1.5 text-[9px] text-silver truncate bg-black/20 border border-white/3 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Database size={10} className="text-[#7FA38A] shrink-0" />
                    <span className="font-mono truncate">{tbl.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[10px] font-bold text-ivory uppercase tracking-wider">Variables</span>
              </div>
              <p className="text-[9px] text-fog leading-relaxed">
                Want to reuse values throughout your agent? Turn them into a variable with <code className="text-[#7FA38A] font-mono bg-white/5 px-1 py-0.5 rounded">{"Cmd + \\"}</code> that you can access with <code className="text-blue-400 font-mono">{"{{"}</code>.
              </p>
              <div className="space-y-1.5 pt-1">
                {variables.slice(0, 2).map((v, i) => (
                  <div key={i} className="flex justify-between text-[9px] text-silver font-mono bg-black/20 px-2 py-1 rounded border border-white/3">
                    <span className="text-blue-400 truncate">{v.key}</span>
                    <span className="text-fog truncate max-w-[80px]">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Inline Modal Dialogs */}
      {/* 1. Add Tool Modal */}
      {showAddToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111522] border border-white/8 rounded-xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ivory">Add new tool</h3>
              <button onClick={() => setShowAddToolModal(false)} className="text-fog hover:text-silver cursor-pointer" aria-label="Close dialog"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-fog uppercase">Select tool definition</label>
              <select
                id="add-tool-select"
                title="Select tool definition"
                className="w-full bg-black/30 border border-white/5 rounded-lg text-xs text-silver h-9 px-3 outline-none"
              >
                <option value="Analyze CSV Data">Analyze CSV Data</option>
                <option value="Extract Company Insights from Website">Extract Company Insights from Website</option>
                <option value="Generate Image">Generate Image</option>
                <option value="Get Email Content from Gmail">Get Email Content from Gmail</option>
                <option value="Custom API caller tool">Custom API caller tool</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowAddToolModal(false)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-silver rounded-lg text-xs px-4 h-8">Cancel</Button>
              <Button
                onClick={() => {
                  const selectEl = document.getElementById('add-tool-select') as HTMLSelectElement;
                  if (selectEl) {
                    setToolsWorkflow(prev => [...prev, selectEl.value]);
                    toast.success(`Added ${selectEl.value} to tools workflow!`);
                  }
                  setShowAddToolModal(false);
                }}
                className="bg-[#7FA38A] hover:bg-[#7FA38A]/90 text-midnight rounded-lg text-xs px-4 h-8"
              >
                Add to flow
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add MCP Modal */}
      {showAddMcpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111522] border border-white/8 rounded-xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ivory">Add MCP Server Connection</h3>
              <button onClick={() => setShowAddMcpModal(false)} className="text-fog hover:text-silver cursor-pointer" aria-label="Close dialog"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-fog uppercase">Server Name</label>
                <Input id="mcp-server-name" title="Server Name" placeholder="e.g. github-mcp" className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-fog uppercase">SSE Endpoint URL</label>
                <Input id="mcp-server-url" title="SSE Endpoint URL" placeholder="http://localhost:3001/sse" className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowAddMcpModal(false)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-silver rounded-lg text-xs px-4 h-8">Cancel</Button>
              <Button
                onClick={() => {
                  const nameEl = document.getElementById('mcp-server-name') as HTMLInputElement;
                  if (nameEl?.value) {
                    setToolsWorkflow(prev => [...prev, `MCP: ${nameEl.value}`]);
                    toast.success(`Successfully connected MCP server: ${nameEl.value}`);
                  }
                  setShowAddMcpModal(false);
                }}
                className="bg-[#7FA38A] hover:bg-[#7FA38A]/90 text-midnight rounded-lg text-xs px-4 h-8"
              >
                Connect Server
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Trigger Modal */}
      {showAddTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111522] border border-white/8 rounded-xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ivory">Add Event Trigger</h3>
              <button onClick={() => setShowAddTriggerModal(false)} className="text-fog hover:text-silver cursor-pointer" aria-label="Close dialog"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-fog uppercase">Trigger Name</label>
                <Input id="trig-name" title="Trigger Name" placeholder="e.g. New Ticket Slack Alert" className="bg-black/30 border-white/5 text-xs text-ivory rounded-lg h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-fog uppercase">Trigger Type</label>
                <select
                  id="trig-type"
                  title="Trigger Type"
                  className="w-full bg-black/30 border border-white/5 rounded-lg text-xs text-silver h-9 px-3 outline-none"
                >
                  <option value="slack">Slack Channel Activity</option>
                  <option value="webhook">Incoming HTTP Webhook</option>
                  <option value="schedule">Schedule Interval</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowAddTriggerModal(false)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-silver rounded-lg text-xs px-4 h-8">Cancel</Button>
              <Button
                onClick={() => {
                  const nameEl = document.getElementById('trig-name') as HTMLInputElement;
                  const typeEl = document.getElementById('trig-type') as HTMLSelectElement;
                  if (nameEl?.value) {
                    const newTrig = {
                      id: `trig-${Math.random()}`,
                      name: nameEl.value,
                      type: typeEl.value,
                      status: 'active',
                      desc: typeEl.value === 'slack' ? 'Fires on new messages' : typeEl.value === 'webhook' ? 'Fires on POST calls' : 'Fires on custom schedule'
                    };
                    setActiveTriggers(prev => [...prev, newTrig]);
                    toast.success(`Trigger connected: ${nameEl.value}`);
                  }
                  setShowAddTriggerModal(false);
                }}
                className="bg-[#7FA38A] hover:bg-[#7FA38A]/90 text-midnight rounded-lg text-xs px-4 h-8"
              >
                Save Trigger
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
