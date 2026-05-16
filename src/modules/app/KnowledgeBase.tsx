'use client';
import { useState } from 'react';
import { Plus, Search, BookOpen, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const CATEGORY_COLORS: Record<string, string> = {
  Process: 'text-sage bg-sage/10',
  Client: 'text-warm bg-warm/10',
  Technical: 'text-silver bg-silver/10',
  Strategy: 'text-fog bg-fog/10',
  Finance: 'text-ember bg-ember/10',
};

function ArticleCard({ article, onEdit, onDelete }: { article: any; onEdit: (a: any) => void; onDelete: (id: string) => void }) {
  const color = CATEGORY_COLORS[article.category] ?? 'text-fog bg-fog/10';
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 hover:border-white/15 transition-colors group relative cursor-pointer"
      onClick={() => onEdit(article)}
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete(article._id); }}
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
          {article.tags.slice(0, 4).map((tag: string) => (
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

const CATEGORIES = ['Process', 'Client', 'Technical', 'Strategy', 'Finance', 'Other'];

function ArticleModal({ article, workspaceId, onClose }: { article: any | null; workspaceId: any; onClose: () => void }) {
  const addArticle = useMutation(api.knowledgeBase.add);
  const updateArticle = useMutation(api.knowledgeBase.update);
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
    if (isEdit) {
      await updateArticle({ id: article._id, title, content, category, tags });
    } else {
      await addArticle({ workspaceId, title, content, category, tags });
    }
    onClose();
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
          <h2 className="text-sm font-semibold text-ivory">{isEdit ? 'Edit article' : 'New article'}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title"
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write content here..." rows={8}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag (Enter to add)"
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
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">Cancel</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>Save article</Button>
        </div>
      </form>
    </div>
  );
}

export default function KnowledgeBase() {


  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const articles = useQuery(api.knowledgeBase.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const removeArticle = useMutation(api.knowledgeBase.remove);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<any | null | 'new'>('closed');

  const filtered = (articles as any[]).filter(a => {
    const matchQuery = !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.content.toLowerCase().includes(query.toLowerCase()) || a.tags?.some((tag: string) => tag.includes(query.toLowerCase()));
    const matchCat = !activeCategory || a.category === activeCategory;
    return matchQuery && matchCat;
  });

  const categories = Array.from(new Set((articles as any[]).map(a => a.category)));

  return (
    <>
      {modalArticle !== 'closed' && workspaceId && (
        <ArticleModal
          article={modalArticle === 'new' ? null : modalArticle}
          workspaceId={workspaceId}
          onClose={() => setModalArticle('closed')}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Knowledge Base</h1>
          <p className="text-sm text-fog mt-0.5">{(articles as any[]).length} articles</p>
        </div>
        <Button size="sm" onClick={() => setModalArticle('new')} disabled={!workspaceId}>
          <Plus size={14} />
          New article
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
          <Input className="pl-8" placeholder="Search articles, tags..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn('px-3 py-1 rounded-lg text-xs transition-colors', !activeCategory ? 'bg-sage/20 text-sage' : 'text-fog hover:text-ivory hover:bg-white/5')}
          >
            All
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
          <p className="text-sm text-fog">{query ? `No articles match "${query}"` : 'No articles yet. Add your first knowledge base entry.'}</p>
          {workspaceId && !query && (
            <Button size="sm" variant="outline" onClick={() => setModalArticle('new')}>
              <Plus size={12} />New article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((article: any) => (
            <ArticleCard
              key={article._id}
              article={article}
              onEdit={a => setModalArticle(a)}
              onDelete={id => removeArticle({ id: id as any })}
            />
          ))}
        </div>
      )}
    </>
  );
}
