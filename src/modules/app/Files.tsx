import { useState } from 'react';
import { Search, Upload, Image, Video, FileText, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_FILES } from '@/lib/mock-data';
import type { FileAsset, FileType } from '@/lib/types';

const TYPE_CONFIG: Record<FileType, { icon: React.ElementType; class: string; bg: string }> = {
  image:    { icon: Image,    class: 'text-sage',   bg: 'bg-sage/10'   },
  video:    { icon: Video,    class: 'text-warm',   bg: 'bg-warm/10'   },
  document: { icon: FileText, class: 'text-silver', bg: 'bg-silver/10' },
  archive:  { icon: Archive,  class: 'text-fog',    bg: 'bg-fog/10'    },
};

function FileCard({ file }: { file: FileAsset }) {
  const cfg = TYPE_CONFIG[file.type];
  const Icon = cfg.icon;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-white/15 hover:bg-dusk/30 transition-colors">
      {/* Icon */}
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', cfg.bg)}>
        <Icon size={18} className={cfg.class} />
      </div>

      {/* Name */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-ivory truncate leading-snug" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-fog mt-0.5 truncate">{file.project}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border">
        <span className="text-[10px] text-fog">{file.size}</span>
        <span className="text-[10px] text-fog">
          {new Date(file.uploadedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}

export default function Files() {
  const [files] = useState<FileAsset[]>(MOCK_FILES);
  const [query, setQuery] = useState('');

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.project.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Files</h1>
          <p className="text-sm text-fog mt-0.5">{files.length} assets</p>
        </div>
        <Button size="sm" variant="outline">
          <Upload size={14} />
          Upload
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        <Input
          className="pl-8"
          placeholder="Search files..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(file => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-sm text-silver">No files match "{query}"</p>
          <button onClick={() => setQuery('')} className="text-xs text-fog hover:text-silver transition-colors">
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
