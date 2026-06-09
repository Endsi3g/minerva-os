'use client';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, BookOpen, Tag, X, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const CATEGORY_CLASSES: Record<string, string> = {
  Process: 'text-success bg-success/10 border border-success/20',
  Client: 'text-warning bg-warning/10 border border-warning/20',
  Technical: 'text-primary bg-primary-soft border border-primary-soft-border',
  Strategy: 'text-muted-foreground bg-secondary/80 border border-border',
  Finance: 'text-danger bg-danger/10 border border-danger/20',
  Other: 'text-muted-foreground bg-secondary/80 border border-border',
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
  const badgeClass = CATEGORY_CLASSES[article.category] ?? CATEGORY_CLASSES.Other;
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 hover:bg-surface-alt/60 transition-all group relative cursor-pointer shadow-card"
      onClick={() => onEdit(article)}
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete(article.id); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10"
        aria-label="Delete Article"
      >
        <X size={11} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', badgeClass)}>{article.category}</span>
      </div>
      <h3 className="text-xs font-semibold text-foreground mb-1 line-clamp-1 pr-6">{article.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{article.content}</p>
      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded-full">
              <Tag size={8} />
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
      let embedding: number[] | null = null;
      try {
        const embedRes = await fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `${title} ${content}` }),
        });
        const embedData = await embedRes.json();
        if (embedData.embedding) {
          embedding = embedData.embedding;
        }
      } catch (err) {
        console.error('Failed to generate embedding:', err);
      }

      if (isEdit && article) {
        const { data, error } = await supabase
          .from('knowledge_base')
          .update({ title, content, category, tags, ...(embedding ? { embedding } : {}) })
          .eq('id', article.id)
          .select()
          .single();
        if (!error && data) {
          onSave({ ...data, _id: data.id });
        }
      } else {
        const { data, error } = await supabase
          .from('knowledge_base')
          .insert({ workspace_id: workspaceId, title, content, category, tags, ...(embedding ? { embedding } : {}) })
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl flex flex-col max-h-[90vh] bg-surface border border-border shadow-raised"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <h2 className="text-sm font-semibold text-foreground">{isEdit ? f.editTitle : f.newTitle}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog"><X size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3 bg-surface">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={f.titlePlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            title="Category"
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none bg-background border border-border focus:border-primary">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={f.contentPlaceholder} rows={8}
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20" />
          <div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={f.tagPlaceholder}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20" />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} aria-label={`Remove tag ${tag}`} className="cursor-pointer"><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-border bg-surface-alt">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
      <Skeleton className="h-4 w-16 bg-secondary/60 rounded-full" />
      <Skeleton className="h-4 w-3/4 bg-secondary/60" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full bg-secondary/60" />
        <Skeleton className="h-3 w-5/6 bg-secondary/60" />
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { t } = useLang();
  const kb = t.app.knowledgeBase;

  const [workspaces, setWorkspaces] = useState<any[] | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>('closed');
  const [isSearchingSemantically, setIsSearchingSemantically] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
      else setWorkspaces([]);
    });
  }, []);

  const workspaceId = workspaces?.[0]?.id;

  async function handleFiles(files: FileList | null) {
    if (!files || !workspaceId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const extension = file.name.split('.').pop() || '';
        const title = file.name;
        const category = 'Other';
        const tags = ['file', extension.toLowerCase()];
        const content = `Ce document (${file.name}) a été importé dans la base de connaissances. Taille : ${(file.size / 1024).toFixed(1)} KB.`;

        let embedding: number[] | null = null;
        try {
          const embedRes = await fetch('/api/ai/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `${title} ${content}` }),
          });
          const embedData = await embedRes.json();
          if (embedData.embedding) {
            embedding = embedData.embedding;
          }
        } catch (err) {
          console.error('Failed to generate embedding:', err);
        }

        const { data, error } = await supabase
          .from('knowledge_base')
          .insert({
            workspace_id: workspaceId,
            title,
            content,
            category,
            tags,
            ...(embedding ? { embedding } : {}),
          })
          .select()
          .single();

        if (!error && data) {
          setArticles(prev => prev ? [{ ...data, _id: data.id }, ...prev] : [{ ...data, _id: data.id }]);
        }
      }
      toast.success('Fichier(s) téléversé(s) avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du téléversement.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    async function loadArticles() {
      if (query.trim().length >= 3) {
        setIsSearchingSemantically(true);
        try {
          const embedRes = await fetch('/api/ai/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: query.trim() }),
          });
          const embedData = await embedRes.json();
          if (embedData.embedding && active) {
            const { data, error } = await supabase.rpc('match_knowledge_base', {
              query_embedding: embedData.embedding,
              match_threshold: 0.1,
              match_count: 9,
              filter_workspace_id: workspaceId,
            });
            if (!error && data && active) {
              setArticles(data.map((d: any) => ({ ...d, _id: d.id })));
              setIsSearchingSemantically(false);
              return;
            }
          }
        } catch (err) {
          console.error('RAG Search failed:', err);
        }
      }

      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data && active) {
        setArticles(data.map(d => ({ ...d, _id: d.id })));
      } else if (active) {
        setArticles([]);
      }
      if (active) {
        setIsSearchingSemantically(false);
      }
    }
    const timer = setTimeout(loadArticles, query.trim().length >= 3 ? 400 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [workspaceId, query]);

  async function removeArticle(id: string) {
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (!error) {
      setArticles(prev => prev ? prev.filter(a => a.id !== id) : null);
    }
  }

  const filtered = articles
    ? articles.filter(a => {
        return !activeCategory || a.category === activeCategory;
      })
    : [];

  const categories = articles
    ? Array.from(new Set(articles.map(a => a.category)))
    : [];

  async function handleSaveArticle(savedArticle: Article) {
    setArticles(prev => {
      if (!prev) return [savedArticle];
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

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-5 border-b border-border">
        <div className="space-y-1">
          <TextAnimate text={kb.title} type="calmInUp" className="text-2xl font-semibold text-foreground tracking-tight" />
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            {kb.description}
          </p>
          <p className="text-[10px] text-subtle-foreground font-medium pt-1">
            {articles ? kb.articleCount.replace('{{count}}', String(articles.length)) : '...'}
          </p>
        </div>
        <Button size="sm" onClick={() => setModal('new')} className="self-start sm:self-auto rounded-full px-4 font-semibold shrink-0 cursor-pointer">
          <Plus size={14} />
          {kb.addArticle}
        </Button>
      </div>

      {/* Centered Search and Category Hero Section */}
      <div className="flex flex-col items-center text-center justify-center max-w-xl mx-auto mt-6 mb-8 gap-4">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input 
            className="pl-9 pr-24 h-10 text-xs rounded-xl border-border shadow-sm text-center bg-surface" 
            placeholder={kb.searchPlaceholder} 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
          />
          {isSearchingSemantically && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-primary font-medium uppercase tracking-wider animate-pulse">
              AI Searching...
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer',
              !activeCategory 
                ? 'bg-primary-soft text-primary font-medium border border-primary-soft-border' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            {kb.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer',
                activeCategory === cat 
                  ? 'bg-primary-soft text-primary font-medium border border-primary-soft-border' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone when articles exist (compact upload bar) */}
      {articles !== null && articles.length > 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border border-dashed rounded-xl p-3.5 mb-6 text-center transition-all duration-200 cursor-pointer text-xs bg-surface hover:bg-surface-alt/50 shadow-card",
            dragOver
              ? "border-primary bg-primary-soft/50 text-primary scale-[1.005]"
              : "border-border text-muted-foreground hover:border-primary/20"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <span className="flex items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            ) : (
              <Upload size={13} className="text-primary shrink-0" />
            )}
            <span className="font-medium">
              {uploading ? "Importation..." : kb.uploadTitle}
            </span>
            <span className="text-[10px] text-muted-foreground">· {kb.uploadSubtitle}</span>
          </span>
        </div>
      )}

      {articles === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
          {/* File Upload Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer shadow-card flex flex-col items-center justify-center gap-3 bg-surface hover:bg-surface-alt/50 min-h-[260px]",
              dragOver
                ? "border-primary bg-primary-soft/50 text-primary scale-[1.01]"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-1" />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-1 animate-fadeIn">
                <Upload size={20} />
              </div>
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {uploading ? "Importation en cours..." : kb.uploadTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {kb.uploadSubtitle}
              </p>
            </div>
          </div>

          {/* Standard Empty State / Call to Action */}
          <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-surface border border-border rounded-2xl shadow-card min-h-[260px]">
            <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-1">
              <BookOpen size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {query ? kb.noResultsTitle : kb.emptyTitle}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                {query ? kb.noMatch.replace('{{query}}', query) : kb.noArticles}
              </p>
            </div>
            {workspaceId && !query && (
              <Button size="xs" variant="outline" onClick={() => setModal('new')} className="mt-2 cursor-pointer rounded-full px-4 font-semibold">
                <Plus size={12} />
                {kb.addArticle}
              </Button>
            )}
          </div>
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
