'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

const CATEGORY_COLORS: Record<string, string> = {
  Process: 'text-sage bg-sage/10',
  Client: 'text-warm bg-warm/10',
  Technical: 'text-silver bg-silver/10',
  Strategy: 'text-fog bg-fog/10',
  Finance: 'text-ember bg-ember/10',
};

const CATEGORIES = ['Process', 'Client', 'Technical', 'Strategy', 'Finance', 'Other'];

type Article = {
  _id: string;
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
};

function ArticleCard({
  article,
  onEdit,
  onDelete,
}: {
  article: Article;
  onEdit: (a: Article) => void;
  onDelete: (id: string) => void;
}) {
  const color = CATEGORY_COLORS[article.category] ?? 'text-fog bg-fog/10';
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 hover:border-white/15 transition-colors group relative cursor-pointer"
      onClick={() => onEdit(article)}
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete(article.id); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-5 w-5 flex items-center justify-center"
      >
        <X size={11} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', color)}>{article.category}</span>
      </div>
      <p className="text-sm font-medium text-ivory mb-1 line-clamp-1 pr-6">{article.title}</p>
      <p className="text-xs text-fog line-clamp-3 leading-relaxed">{article.content}</p>
      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-[10px] text-fog/70 bg-white/3 px-1.5 py-0.5 rounded-full">
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ModalState = 'closed' | 'new' | Article;

function ArticleModal({
  article,
  workspaceId,
  onClose,
  onSave,
}: {
  article: Article | null;
  workspaceId: string;
  onClose: () => void;
  onSave: (a: Article) => void;
}) {
  const { t } = useLang();
  const f = t.app.knowledgeBase.form;
  const isEdit = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [category, setCategory] = useState(article?.category ?? 'Process');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [saving, setSaving] = useState(false);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    try {
      if (isEdit && article) {
        const { data, error } = await supabase
          .from('knowledge_base')
          .update({ title, content, category, tags })
          .eq('id', article.id)
          .select()
          .single();
        if (!error && data) {
          onSave({ ...data, _id: data.id });
        }
      } else {
        const { data, error } = await supabase
          .from('knowledge_base')
          .insert({ workspace_id: workspaceId, title, content, category, tags })
          .select()
          .single();
        if (!error && data) {
          onSave({ ...data, _id: data.id });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-sm font-semibold text-ivory">{isEdit ? f.editTitle : f.newTitle}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={f.titlePlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={f.contentPlaceholder} rows={8}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={f.tagPlaceholder}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs text-ivory placeholder:text-fog outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[11px] text-fog bg-white/5 px-2 py-0.5 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-white/5">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function KnowledgeBase() {
  const { t } = useLang();
  const kb = t.app.knowledgeBase;

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>('closed');
  const [isSearchingSemantically, setIsSearchingSemantically] = useState(false);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadArticles() {
      let req = supabase.from('knowledge_base').select('*').eq('workspace_id', workspaceId);
      if (query.trim().length >= 3) {
        setIsSearchingSemantically(true);
        req = req.or(`title.ilike.%${query.trim()}%,content.ilike.%${query.trim()}%`);
      }
      const { data } = await req.order('created_at', { ascending: false });
      if (data) {
        setArticles(data.map(d => ({ ...d, _id: d.id })));
      }
      setIsSearchingSemantically(false);
    }
    const timer = setTimeout(loadArticles, query.trim().length >= 3 ? 300 : 0);
    return () => clearTimeout(timer);
  }, [workspaceId, query]);

  async function removeArticle(id: string) {
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (!error) {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  }

  const filtered = articles.filter(a => {
    return !activeCategory || a.category === activeCategory;
  });

  const categories = Array.from(new Set(articles.map(a => a.category)));

  function handleSaveArticle(savedArticle: Article) {
    setArticles(prev => {
      const exists = prev.some(a => a.id === savedArticle.id);
      if (exists) {
        return prev.map(a => a.id === savedArticle.id ? savedArticle : a);
      }
      return [savedArticle, ...prev];
    });
  }

  return (
    <>
      {modal !== 'closed' && workspaceId && (
        <ArticleModal
          article={modal === 'new' ? null : modal}
          workspaceId={workspaceId}
          onClose={() => setModal('closed')}
          onSave={handleSaveArticle}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{kb.title}</h1>
          <p className="text-sm text-fog mt-0.5">{kb.articleCount.replace('{{count}}', String(articles.length))}</p>
        </div>
        <Button size="sm" onClick={() => setModal('new')}>
          <Plus size={14} />
          {kb.addArticle}
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
          <Input className="pl-8" placeholder={kb.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
          {isSearchingSemantically && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-sage font-medium uppercase tracking-wider animate-pulse">
              AI Searching...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn('px-3 py-1 rounded-lg text-xs transition-colors', !activeCategory ? 'bg-sage/20 text-sage' : 'text-fog hover:text-ivory hover:bg-white/5')}
          >
            {kb.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={cn('px-3 py-1 rounded-lg text-xs transition-colors', activeCategory === cat ? 'bg-sage/20 text-sage' : 'text-fog hover:text-ivory hover:bg-white/5')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <BookOpen size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{query ? kb.noMatch.replace('{{query}}', query) : kb.noArticles}</p>
          {workspaceId && !query && (
            <Button size="sm" variant="outline" onClick={() => setModal('new')}>
              <Plus size={12} />{kb.addArticle}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={a => setModal(a)}
              onDelete={removeArticle}
            />
          ))}
        </div>
      )}
    </>
  );
}
