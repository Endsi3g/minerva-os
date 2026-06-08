'use client';
import { useState, useEffect } from 'react';
import { FileText, GitPullRequest, LayoutDashboard, BookOpen, Search, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useWorkspaces } from '@/lib/hooks/useSupabase';
import type { MarketplaceItem, MarketplaceItemType } from '@/lib/types';

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

function mapDbItem(row: any): MarketplaceItem {
  return {
    id: row.id,
    type: row.type as MarketplaceItemType,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    usageCount: row.use_count ?? 0,
    isBuiltIn: row.is_built_in ?? false,
    createdBy: row.created_by ?? 'Minerva',
  };
}

/* ── MarketplaceCard ─────────────────────────────────────────────────────── */

function MarketplaceCard({ item, installed, installing, onInstall, onUninstall, t }: {
  item: MarketplaceItem;
  installed: boolean;
  installing: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  t: ReturnType<typeof useLang>['t'];
}) {
  const m = t.app.marketplace;
  const Icon = TYPE_ICON[item.type];
  const badge = TYPE_BADGE[item.type];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="bg-secondary/60 border border-border rounded-xl p-5 flex flex-col gap-3 font-sans"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div style={{ padding: 6, borderRadius: 8, backgroundColor: badge.bg }}>
            <Icon size={14} style={{ color: badge.color }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: badge.color, backgroundColor: badge.bg, borderRadius: 6, padding: '2px 7px' }}>
            {m.types[item.type]}
          </span>
          {item.isBuiltIn && (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-600/10 rounded-md px-2 py-0.5">
              {m.builtIn}
            </span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">{item.name}</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground bg-secondary/60 rounded-md px-2 py-0.5 capitalize">
            {m.categories[item.category]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {m.usage.replace('{{count}}', String(item.usageCount))}
          </span>
        </div>
        <button
          onClick={installed ? onUninstall : onInstall}
          disabled={installing}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all ${installing ? 'opacity-60 cursor-wait' : ''} ${installed ? 'border border-emerald-600/30 bg-emerald-600/10 text-emerald-600' : 'border border-border bg-transparent text-muted-foreground'}`}
        >
          {installing
            ? <Loader2 size={11} className="animate-spin" />
            : installed
              ? <CheckCircle2 size={12} />
              : null}
          {installing ? m.installing : installed ? m.installed : m.install}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Marketplace ─────────────────────────────────────────────────────────── */

export default function Marketplace() {
  const { t } = useLang();
  const m = t.app.marketplace;

  const workspaces = useWorkspaces();
  const workspaceId = (workspaces as any[])?.[0]?._id ?? null;

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'all' | MarketplaceItemType>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'builtin' | 'community'>('builtin');
  const [showContribute, setShowContribute] = useState(false);
  const [submitName, setSubmitName] = useState('');
  const [submitType, setSubmitType] = useState<MarketplaceItemType>('template');
  const [submitCategory, setSubmitCategory] = useState('onboarding');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load marketplace items and installs
  useEffect(() => {
    let active = true;
    supabase.from('marketplace_items').select('*').then(({ data }) => {
      if (active && data && data.length > 0) {
        setItems(data.map(mapDbItem));
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    supabase.from('workspace_installs').select('item_id').eq('workspace_id', workspaceId).then(({ data }) => {
      if (active && data) {
        setInstalledIds(new Set(data.map((r: any) => r.item_id)));
      }
    });
    return () => { active = false; };
  }, [workspaceId]);

  async function handleInstall(item: MarketplaceItem) {
    if (!workspaceId || installingId) return;
    setInstallingId(item.id);
    try {
      const now = new Date().toISOString();
      await supabase.from('workspace_installs').insert({
        id: `install-${item.id}-${workspaceId}`,
        workspace_id: workspaceId,
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        installed_at: now,
      });
      if (item.type === 'automation') {
        await supabase.from('workflows').insert({
          workspace_id: workspaceId,
          name: item.name,
          description: item.description,
          status: 'active',
          trigger: 'manual',
          created_at: now,
        });
      }
      setInstalledIds(prev => new Set([...prev, item.id]));
    } finally {
      setInstallingId(null);
    }
  }

  async function handleUninstall(item: MarketplaceItem) {
    if (!workspaceId || installingId) return;
    setInstallingId(item.id);
    try {
      await supabase
        .from('workspace_installs')
        .delete()
        .eq('item_id', item.id)
        .eq('workspace_id', workspaceId);
      setInstalledIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } finally {
      setInstallingId(null);
    }
  }

  async function handleContribute() {
    if (!submitName || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: submitName, type: submitType, category: submitCategory, description: submitDescription }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setSubmitName('');
        setSubmitDescription('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function closeContribute() {
    setShowContribute(false);
    setSubmitSuccess(false);
    setSubmitName('');
    setSubmitDescription('');
  }

  const filteredItems = items.filter(item => {
    const isCommunity = (item as any).is_community === true;
    if (activeTab === 'builtin' && isCommunity) return false;
    if (activeTab === 'community' && !isCommunity) return false;
    const matchesType = activeType === 'all' || item.type === activeType;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.tags.some(tag => tag.includes(q));
    return matchesType && matchesSearch;
  });

  const filtered = filteredItems;

  return (
    <div className="px-8 pt-8 pb-12 font-sans min-h-screen">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-playfair text-3xl font-bold text-foreground mb-1.5">
          {m.title}
        </h1>
        <p className="text-sm text-muted-foreground">{m.subtitle}</p>
      </div>

      {/* Tab switcher + Contribute button */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-secondary/60 border border-border rounded-[10px] p-1">
          {(['builtin', 'community'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-[7px] border-none cursor-pointer transition-all ${activeTab === tab ? 'bg-accent text-foreground' : 'bg-transparent text-muted-foreground'}`}
            >
              {tab === 'builtin' ? m.tabBuiltIn : m.tabCommunity}
            </button>
          ))}
        </div>
        {activeTab === 'community' && (
          <button
            onClick={() => setShowContribute(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg cursor-pointer border border-emerald-600/30 bg-emerald-600/8 text-emerald-600 transition-all"
          >
            <Upload size={12} />
            {m.contribute}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 bg-secondary/60 border border-border rounded-[10px] p-1">
          {FILTER_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`text-xs font-medium px-3 py-1.5 rounded-[7px] border-none cursor-pointer transition-all ${activeType === type ? 'bg-accent text-foreground' : 'bg-transparent text-muted-foreground'}`}
            >
              {type === 'all' ? m.all : m.types[type as MarketplaceItemType]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={m.searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded-[10px] text-foreground text-[13px] outline-none box-border"
          />
        </div>
      </div>

      {/* Contribute modal */}
      <AnimatePresence>
        {showContribute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-[10px] flex items-center justify-center p-6"
            onClick={closeContribute}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-7 w-full max-w-[480px] font-sans"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{m.contributeModal.title}</h2>
                  <p className="text-[13px] text-muted-foreground">{m.contributeModal.subtitle}</p>
                </div>
                <button onClick={closeContribute} className="bg-transparent border-none cursor-pointer text-muted-foreground p-1" aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={40} className="text-emerald-600 mb-3 mx-auto" />
                  <p className="text-[15px] font-semibold text-foreground mb-2">{m.contributeModal.successTitle}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{m.contributeModal.successBody}</p>
                  <button
                    onClick={closeContribute}
                    className="mt-5 text-[13px] font-medium px-5 py-2 rounded-lg cursor-pointer border border-border bg-transparent text-muted-foreground"
                  >
                    {m.contributeModal.cancel}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{m.contributeModal.nameLabel}</label>
                    <input
                      value={submitName}
                      onChange={e => setSubmitName(e.target.value)}
                      placeholder={m.contributeModal.namePlaceholder}
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-lg text-foreground text-[13px] outline-none box-border"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{m.contributeModal.typeLabel}</label>
                      <select
                        value={submitType}
                        onChange={e => setSubmitType(e.target.value as MarketplaceItemType)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-[13px] outline-none"
                      >
                        {(['template', 'automation', 'view', 'playbook'] as MarketplaceItemType[]).map(t => (
                          <option key={t} value={t}>{m.types[t]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{m.contributeModal.categoryLabel}</label>
                      <select
                        value={submitCategory}
                        onChange={e => setSubmitCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-[13px] outline-none"
                      >
                        {Object.entries(m.categories).map(([k, label]) => (
                          <option key={k} value={k}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{m.contributeModal.descriptionLabel}</label>
                    <textarea
                      value={submitDescription}
                      onChange={e => setSubmitDescription(e.target.value)}
                      placeholder={m.contributeModal.descriptionPlaceholder}
                      rows={3}
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-lg text-foreground text-[13px] outline-none resize-y box-border font-sans"
                    />
                  </div>
                  <div className="flex gap-2.5 justify-end mt-1">
                    <button
                      onClick={closeContribute}
                      className="text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-border bg-transparent text-muted-foreground"
                    >
                      {m.contributeModal.cancel}
                    </button>
                    <button
                      onClick={handleContribute}
                      disabled={!submitName || submitting}
                      className="flex items-center gap-1.5 text-[13px] font-medium px-4.5 py-2 rounded-lg border-none transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-foreground text-background"
                    >
                      {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                      {submitting ? m.contributeModal.submitting : m.contributeModal.submit}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {filtered.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
          className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } } }}
            >
              <MarketplaceCard
                item={item}
                installed={installedIds.has(item.id)}
                installing={installingId === item.id}
                onInstall={() => handleInstall(item)}
                onUninstall={() => handleUninstall(item)}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {activeTab === 'community' ? m.communityEmpty : m.empty}
        </div>
      )}
    </div>
  );
}
