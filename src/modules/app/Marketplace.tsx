'use client';
import { useState } from 'react';
import { FileText, GitPullRequest, LayoutDashboard, BookOpen, Search, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '@/i18n';
import type { MarketplaceItem, MarketplaceItemType } from '@/lib/types';

/* ── Mock data ───────────────────────────────────────────────────────────── */

const MOCK_MARKETPLACE: MarketplaceItem[] = [
  { id: 'm1', type: 'template', name: 'Web Design Kickoff', description: 'Full project template with tasks, milestones, and approval flows for web design projects.', category: 'onboarding', tags: ['web', 'design', 'project'], usageCount: 142, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm2', type: 'template', name: 'Brand Identity Project', description: 'Logo, guidelines, and asset delivery template with client approval checkpoints.', category: 'delivery', tags: ['branding', 'design'], usageCount: 98, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm3', type: 'automation', name: 'Invoice Overdue Alert', description: 'Automatically notifies the finance team when an invoice becomes overdue by 3+ days.', category: 'finance', tags: ['invoice', 'alert', 'finance'], usageCount: 217, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm4', type: 'automation', name: 'Proposal Signed Kickoff', description: 'When a proposal is signed, automatically creates a project and assigns the onboarding checklist.', category: 'onboarding', tags: ['proposal', 'automation', 'project'], usageCount: 189, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm5', type: 'automation', name: 'Task Overdue Escalation', description: 'Escalates overdue tasks to the project manager after 48 hours with no update.', category: 'delivery', tags: ['tasks', 'escalation'], usageCount: 156, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm6', type: 'view', name: 'Client Health Dashboard', description: 'A portfolio-wide view showing health scores, invoice status, and project progress per client.', category: 'reporting', tags: ['health', 'client', 'dashboard'], usageCount: 73, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm7', type: 'view', name: 'Weekly Delivery Standup', description: 'Filtered view of tasks due this week grouped by project and assignee.', category: 'delivery', tags: ['standup', 'tasks', 'weekly'], usageCount: 91, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm8', type: 'playbook', name: 'Client Onboarding', description: 'Step-by-step onboarding process: discovery call, brief intake, contract signature, project setup.', category: 'onboarding', tags: ['onboarding', 'checklist', 'client'], usageCount: 134, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm9', type: 'playbook', name: 'Scope Change Management', description: 'Protocol for handling scope creep: detection, impact assessment, client communication, approval.', category: 'delivery', tags: ['scope', 'change', 'protocol'], usageCount: 67, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm10', type: 'playbook', name: 'Monthly Finance Review', description: 'Structured process for monthly P&L review, invoice reconciliation, and cash forecast update.', category: 'finance', tags: ['finance', 'monthly', 'review'], usageCount: 45, isBuiltIn: true, createdBy: 'Minerva' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const TYPE_ICON: Record<MarketplaceItemType, React.ElementType> = {
  template:   FileText,
  automation: GitPullRequest,
  view:       LayoutDashboard,
  playbook:   BookOpen,
};

const TYPE_BADGE: Record<MarketplaceItemType, { bg: string; color: string }> = {
  template:   { bg: 'rgba(184,155,106,0.12)', color: '#B89B6A' },
  automation: { bg: 'rgba(127,163,138,0.12)', color: '#7FA38A' },
  view:       { bg: 'rgba(184,189,199,0.12)', color: '#B8BDC7' },
  playbook:   { bg: 'rgba(216,221,230,0.12)', color: '#D8DDE6' },
};

const FILTER_TYPES: Array<'all' | MarketplaceItemType> = ['all', 'template', 'automation', 'view', 'playbook'];

/* ── MarketplaceCard ─────────────────────────────────────────────────────── */

function MarketplaceCard({ item, installed, onInstall, t }: {
  item: MarketplaceItem;
  installed: boolean;
  onInstall: () => void;
  t: ReturnType<typeof useLang>['t'];
}) {
  const m = t.app.marketplace;
  const Icon = TYPE_ICON[item.type];
  const badge = TYPE_BADGE[item.type];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top row: icon + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: 6, borderRadius: 8, backgroundColor: badge.bg }}>
            <Icon size={14} style={{ color: badge.color }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: badge.color, backgroundColor: badge.bg, borderRadius: 6, padding: '2px 7px' }}>
            {m.types[item.type]}
          </span>
          {item.isBuiltIn && (
            <span style={{ fontSize: 11, fontWeight: 500, color: '#7FA38A', backgroundColor: 'rgba(127,163,138,0.10)', borderRadius: 6, padding: '2px 7px' }}>
              {m.builtIn}
            </span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F1E8', marginBottom: 4 }}>{item.name}</p>
        <p style={{ fontSize: 12, color: '#8A9099', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>
      </div>

      {/* Footer: category + usage + install */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#8A9099', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '2px 7px', textTransform: 'capitalize' }}>
            {m.categories[item.category]}
          </span>
          <span style={{ fontSize: 11, color: '#8A9099' }}>
            {m.usage.replace('{{count}}', String(item.usageCount))}
          </span>
        </div>
        <button
          onClick={onInstall}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 8,
            cursor: installed ? 'default' : 'pointer',
            border: `1px solid ${installed ? 'rgba(127,163,138,0.30)' : 'rgba(255,255,255,0.10)'}`,
            backgroundColor: installed ? 'rgba(127,163,138,0.10)' : 'transparent',
            color: installed ? '#7FA38A' : '#B8BDC7',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!installed) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(127,163,138,0.10)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(127,163,138,0.30)'; (e.currentTarget as HTMLButtonElement).style.color = '#7FA38A'; } }}
          onMouseLeave={e => { if (!installed) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLButtonElement).style.color = '#B8BDC7'; } }}
        >
          {installed && <CheckCircle2 size={12} />}
          {installed ? m.installed : m.install}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Marketplace ─────────────────────────────────────────────────────────── */

export default function Marketplace() {
  const { t } = useLang();
  const m = t.app.marketplace;
  const [activeType, setActiveType] = useState<'all' | MarketplaceItemType>('all');
  const [search, setSearch] = useState('');
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  const filtered = MOCK_MARKETPLACE.filter(item => {
    const matchesType = activeType === 'all' || item.type === activeType;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.tags.some(tag => tag.includes(q));
    return matchesType && matchesSearch;
  });

  function toggleInstall(id: string) {
    setInstalled(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ padding: '32px 32px 48px', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#F5F1E8', marginBottom: 6 }}>
          {m.title}
        </h1>
        <p style={{ fontSize: 14, color: '#8A9099' }}>{m.subtitle}</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 4 }}>
          {FILTER_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: activeType === type ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: activeType === type ? '#F5F1E8' : '#8A9099',
                transition: 'all 0.18s ease',
              }}
            >
              {type === 'all' ? m.all : m.types[type as MarketplaceItemType]}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9099', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={m.searchPlaceholder}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
              color: '#F5F1E8', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
        >
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } } }}
            >
              <MarketplaceCard item={item} installed={installed.has(item.id)} onInstall={() => toggleInstall(item.id)} t={t} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8A9099', fontSize: 14 }}>
          {m.empty}
        </div>
      )}
    </div>
  );
}
