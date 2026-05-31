'use client';
import { useState } from 'react';
import { Search, Image, Video, FileText, Archive, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { FileType } from '@/lib/types';
import { toast } from 'sonner';

const TYPE_CONFIG: Record<FileType, { icon: React.ElementType; class: string; bg: string }> = {
  image:    { icon: Image,    class: 'text-[#7FA38A]',   bg: 'bg-[#7FA38A]/10'   },
  video:    { icon: Video,    class: 'text-[#B89B6A]',   bg: 'bg-[#B89B6A]/10'   },
  document: { icon: FileText, class: 'text-[#B8BDC7]',   bg: 'bg-[#B8BDC7]/10'   },
  archive:  { icon: Archive,  class: 'text-[#8A9099]',   bg: 'bg-[#8A9099]/10'   },
};

export default function PortalFiles() {
  const { isValid, files } = usePortalData();
  const [query, setQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(file: any) {
    if (!file.url) {
      toast.error('File URL not available.');
      return;
    }
    setDownloadingId(file.id || file._id);
    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${file.name} downloaded`);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (!isValid) return null;

  const filtered = files.filter((f: any) =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.project.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-normal"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
          >
            Files
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A9099' }}>
            {files.length} shared asset{files.length !== 1 ? 's' : ''} from Uprising Studio.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8A9099' }} />
        <input
          type="text"
          placeholder="Search files..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors duration-200"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F5F1E8',
            fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((file: any) => {
            const cfg = TYPE_CONFIG[file.type as FileType];
            const Icon = cfg.icon;
            return (
              <div
                key={file.id}
                className="rounded-[14px] border p-4 flex flex-col gap-3 transition-all duration-200 hover:border-white/12 group"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {/* Icon */}
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', cfg.bg)}>
                  <Icon size={17} className={cfg.class} />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate leading-snug"
                    style={{ color: '#F5F1E8' }}
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8A9099' }}>{file.project}</p>
                </div>

                {/* Meta + download */}
                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="text-[10px]" style={{ color: '#8A9099' }}>{file.size}</span>
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === (file.id || file._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-white/5 disabled:cursor-wait"
                    title="Download"
                    aria-label="Download file"
                  >
                    {downloadingId === (file.id || file._id)
                      ? <Loader2 size={12} className="animate-spin" style={{ color: '#B8BDC7' }} />
                      : <Download size={12} style={{ color: '#B8BDC7' }} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-sm" style={{ color: '#B8BDC7' }}>No files match "{query}"</p>
          <button
            onClick={() => setQuery('')}
            className="text-xs mt-2 transition-colors duration-200 hover:text-white/50"
            style={{ color: '#8A9099' }}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
