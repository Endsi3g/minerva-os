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
      {/* Top row */}
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

      {/* Footer */}
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
          onClick={installed ? onUninstall : onInstall}
          disabled={installing}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 8,
            cursor: installing ? 'wait' : 'pointer',
            border: `1px solid ${installed ? 'rgba(127,163,138,0.30)' : 'rgba(255,255,255,0.10)'}`,
            backgroundColor: installed ? 'rgba(127,163,138,0.10)' : 'transparent',
            color: installed ? '#7FA38A' : '#B8BDC7',
            opacity: installing ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {installing
            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
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
    <div style={{ padding: '32px 32px 48px', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#F5F1E8', marginBottom: 6 }}>
          {m.title}
        </h1>
        <p style={{ fontSize: 14, color: '#8A9099' }}>{m.subtitle}</p>
      </div>

      {/* Tab switcher + Contribute button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 4 }}>
          {(['builtin', 'community'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: activeTab === tab ? '#F5F1E8' : '#8A9099',
                transition: 'all 0.18s ease',
              }}
            >
              {tab === 'builtin' ? m.tabBuiltIn : m.tabCommunity}
            </button>
          ))}
        </div>
        {activeTab === 'community' && (
          <button
            onClick={() => setShowContribute(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(127,163,138,0.30)',
              backgroundColor: 'rgba(127,163,138,0.08)',
              color: '#7FA38A',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload size={12} />
            {m.contribute}
          </button>
        )}
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

      {/* Contribute modal */}
      <AnimatePresence>
        {showContribute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              backgroundColor: 'rgba(10,13,20,0.80)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
            onClick={closeContribute}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{
                backgroundColor: '#111522',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 16,
                padding: 28,
                width: '100%',
                maxWidth: 480,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F5F1E8', marginBottom: 4 }}>{m.contributeModal.title}</h2>
                  <p style={{ fontSize: 13, color: '#8A9099' }}>{m.contributeModal.subtitle}</p>
                </div>
                <button onClick={closeContribute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A9099', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <CheckCircle2 size={40} style={{ color: '#7FA38A', marginBottom: 12 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F1E8', marginBottom: 8 }}>{m.contributeModal.successTitle}</p>
                  <p style={{ fontSize: 13, color: '#8A9099', lineHeight: 1.6 }}>{m.contributeModal.successBody}</p>
                  <button
                    onClick={closeContribute}
                    style={{ marginTop: 20, fontSize: 13, fontWeight: 500, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'transparent', color: '#B8BDC7' }}
                  >
                    {m.contributeModal.cancel}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#B8BDC7', display: 'block', marginBottom: 6 }}>{m.contributeModal.nameLabel}</label>
                    <input
                      value={submitName}
                      onChange={e => setSubmitName(e.target.value)}
                      placeholder={m.contributeModal.namePlaceholder}
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F5F1E8', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#B8BDC7', display: 'block', marginBottom: 6 }}>{m.contributeModal.typeLabel}</label>
                      <select
                        value={submitType}
                        onChange={e => setSubmitType(e.target.value as MarketplaceItemType)}
                        style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F5F1E8', fontSize: 13, outline: 'none' }}
                      >
                        {(['template', 'automation', 'view', 'playbook'] as MarketplaceItemType[]).map(t => (
                          <option key={t} value={t} style={{ backgroundColor: '#111522' }}>{m.types[t]}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#B8BDC7', display: 'block', marginBottom: 6 }}>{m.contributeModal.categoryLabel}</label>
                      <select
                        value={submitCategory}
                        onChange={e => setSubmitCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F5F1E8', fontSize: 13, outline: 'none' }}
                      >
                        {Object.entries(m.categories).map(([k, label]) => (
                          <option key={k} value={k} style={{ backgroundColor: '#111522' }}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#B8BDC7', display: 'block', marginBottom: 6 }}>{m.contributeModal.descriptionLabel}</label>
                    <textarea
                      value={submitDescription}
                      onChange={e => setSubmitDescription(e.target.value)}
                      placeholder={m.contributeModal.descriptionPlaceholder}
                      rows={3}
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F5F1E8', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={closeContribute}
                      style={{ fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.10)', backgroundColor: 'transparent', color: '#B8BDC7' }}
                    >
                      {m.contributeModal.cancel}
                    </button>
                    <button
                      onClick={handleContribute}
                      disabled={!submitName || submitting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 8, cursor: !submitName || submitting ? 'not-allowed' : 'pointer',
                        border: 'none',
                        backgroundColor: !submitName || submitting ? 'rgba(245,241,232,0.3)' : '#F5F1E8',
                        color: '#0A0D14',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {submitting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
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
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
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
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8A9099', fontSize: 14 }}>
          {activeTab === 'community' ? m.communityEmpty : m.empty}
        </div>
      )}
    </div>
  );
}
