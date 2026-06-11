'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Upload, Image, Video, FileText, Archive, Loader2, Trash2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { key: 'all',      label: 'All Files' },
  { key: 'image',    label: 'Images' },
  { key: 'video',    label: 'Videos' },
  { key: 'document', label: 'Documents' },
  { key: 'archive',  label: 'Archives' },
  { key: 'other',    label: 'Other' },
] as const;
type Category = typeof CATEGORIES[number]['key'];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  image:    { icon: Image,    color: 'text-primary',         bg: 'bg-primary/10' },
  video:    { icon: Video,    color: 'text-warning',         bg: 'bg-warning/10' },
  document: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  archive:  { icon: Archive,  color: 'text-muted-foreground', bg: 'bg-muted' },
  other:    { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
};

function getFileType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
  if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.tar')) return 'archive';
  return 'other';
}

function FileCard({ file, onDelete }: { file: any; onDelete: () => void }) {
  const cfg = TYPE_CONFIG[file.type] ?? TYPE_CONFIG.other;
  const Icon = cfg.icon;
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 group hover:shadow-raised transition-all relative">
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all h-6 w-6 flex items-center justify-center rounded-md hover:bg-destructive/10"
      >
        <Trash2 size={11} />
      </button>
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', cfg.bg)}>
        <Icon size={18} className={cfg.color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate leading-snug" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate capitalize">{file.type}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border">
        <span className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(file.uploadedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}

export default function Files() {
  const { t } = useLang();
  const f = t.app.files;

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [uploading, setUploading] = useState(false);
  const [fullscreenDrag, setFullscreenDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadAssets() {
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('uploaded_at', { ascending: false });
      if (data) {
        setAssets(data.map(a => ({
          ...a,
          _id: a.id,
          uploadedAt: a.uploaded_at,
        })));
      }
    }
    loadAssets();
  }, [workspaceId]);

  /* ── Full-screen drag detection ─────────────────────────────────────── */
  const handleWindowDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setFullscreenDrag(true);
  }, []);

  const handleWindowDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setFullscreenDrag(false);
  }, []);

  const handleWindowDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleWindowDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setFullscreenDrag(false);
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleWindowDragEnter, handleWindowDragLeave, handleWindowDragOver, handleWindowDrop]);

  const filtered = assets.filter(a => {
    const matchesQuery = a.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' || a.type === category;
    return matchesQuery && matchesCategory;
  });

  async function handleFiles(files: FileList | null) {
    if (!files || !workspaceId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileType = getFileType(file);
        const { data, error } = await supabase
          .from('assets')
          .insert({
            workspace_id: workspaceId,
            name: file.name,
            type: fileType,
            size: file.size,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${file.name}`,
          })
          .select()
          .single();

        if (!error && data) {
          setAssets(prev => [{ ...data, _id: data.id, uploadedAt: data.uploaded_at }, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(id: string) {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (!error) setAssets(prev => prev.filter(a => a._id !== id));
  }

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.key] = cat.key === 'all'
      ? assets.length
      : assets.filter(a => a.type === cat.key).length;
    return acc;
  }, {});

  return (
    <>
      {/* ── Full-screen drop overlay ─────────────────────────────────────── */}
      {fullscreenDrag && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none"
          style={{
            backgroundColor: 'rgba(var(--primary-rgb, 127,163,138), 0.08)',
            backdropFilter: 'blur(4px)',
            border: '3px dashed var(--primary)',
          }}
        >
          <div className="rounded-2xl bg-surface border border-border shadow-float px-10 py-8 flex flex-col items-center gap-3 pointer-events-none">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload size={26} className="text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">Release to add them to your File Vault</p>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{f.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{assets.length} {f.stats}</p>
        </div>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !workspaceId}
          className="gap-2"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading...' : f.upload}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              category === cat.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {cat.label}
            <span className={cn(
              'text-[10px] rounded-full px-1.5 py-0.5 font-semibold',
              category === cat.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {categoryCounts[cat.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8"
          placeholder={f.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* ── File grid ───────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(asset => (
            <FileCard
              key={asset._id}
              file={asset}
              onDelete={() => removeAsset(asset._id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-24 text-center gap-3 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <FolderOpen size={22} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {query ? `No files match "${query}"` : 'No files yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {query ? 'Try a different search term' : 'Drag and drop files here, or click to upload'}
            </p>
          </div>
          {query && (
            <button onClick={e => { e.stopPropagation(); setQuery(''); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {f.clearSearch}
            </button>
          )}
        </div>
      )}
    </>
  );
}
