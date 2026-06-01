'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Upload, Image, Video, FileText, Archive, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { MOCK_FILES } from '@/lib/mock-data';
const IS_TEST = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === '1';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; class: string; bg: string }> = {
  image:    { icon: Image,    class: 'text-sage',   bg: 'bg-sage/10'   },
  video:    { icon: Video,    class: 'text-warm',   bg: 'bg-warm/10'   },
  document: { icon: FileText, class: 'text-silver', bg: 'bg-silver/10' },
  archive:  { icon: Archive,  class: 'text-fog',    bg: 'bg-fog/10'    },
  other:    { icon: FileText, class: 'text-fog',    bg: 'bg-fog/10'    },
};

function getFileType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
  if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.tar')) return 'archive';
  return 'other';
}

function FileCard({ file, onDelete }: { file: any; onDelete: () => void }) {
  const cfg = TYPE_CONFIG[file.type] || TYPE_CONFIG.other;
  const Icon = cfg.icon;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 hover:bg-dusk/30 transition-colors relative">
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded-md hover:bg-ember/10"
      >
        <Trash2 size={11} />
      </button>
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', cfg.bg)}>
        <Icon size={18} className={cfg.class} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ivory truncate leading-snug" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-fog mt-0.5 truncate">{file.type}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border">
        <span className="text-[10px] text-fog">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <span className="text-[10px] text-fog">
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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (IS_TEST) {
      setAssets(MOCK_FILES.map(f => ({ ...f, _id: f.id, url: null, mimeType: f.type, uploadedAt: f.uploadedDate })));
      return;
    }
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (IS_TEST) return;
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

  const filtered = assets.filter((a: any) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    if (IS_TEST) {
      setUploading(true);
      for (const file of Array.from(files)) {
        const fileType = getFileType(file);
        const mockId = `mock-${Date.now()}-${file.name}`;
        setAssets(prev => [
          {
            _id: mockId,
            id: mockId,
            name: file.name,
            type: fileType,
            size: file.size,
            url: null,
            mimeType: fileType,
            uploadedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setUploading(false);
      return;
    }
    if (!workspaceId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Upload simulation / directly add to assets metadata
        const fileType = getFileType(file);
        const { data, error } = await supabase
          .from('assets')
          .insert({
            workspace_id: workspaceId,
            name: file.name,
            type: fileType,
            size: file.size,
            url: `https://kcwdmufkyjsitsuxmqld.supabase.co/storage/v1/object/public/assets/${file.name}`,
          })
          .select()
          .single();

        if (!error && data) {
          setAssets(prev => [
            {
              ...data,
              _id: data.id,
              uploadedAt: data.uploaded_at,
            },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(id: string) {
    if (IS_TEST) {
      setAssets(prev => prev.filter(a => a._id !== id));
      return;
    }
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (!error) {
      setAssets(prev => prev.filter(a => a._id !== id));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{f.title}</h1>
          <p className="text-sm text-fog mt-0.5">{assets.length} {f.stats}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !workspaceId}
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

      {/* Drop zone when empty or as hint */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-4 mb-6 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-sage/50 bg-sage/5 text-sage'
            : 'border-white/5 text-fog hover:border-white/10'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-xs">Drop files here or click to upload</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        <Input
          className="pl-8"
          placeholder={f.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((asset: any) => (
            <FileCard
              key={asset._id}
              file={asset}
              onDelete={() => removeAsset(asset._id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-sm text-silver">{f.noFiles} {query ? `"${query}"` : ''}</p>
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-fog hover:text-silver transition-colors">
              {f.clearSearch}
            </button>
          )}
        </div>
      )}
    </>
  );
}
