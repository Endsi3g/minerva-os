'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Image, Video, FileText, Archive, Download, Folder, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { FileType, DocumentFolder } from '@/lib/types';
import React from 'react';
import { useLang } from '@/i18n';

const TYPE_CONFIG: Record<FileType, { icon: React.ElementType; class: string; bg: string }> = {
  image:    { icon: Image,    class: 'text-[#7FA38A]', bg: 'bg-[#7FA38A]/10' },
  video:    { icon: Video,    class: 'text-[#B89B6A]', bg: 'bg-[#B89B6A]/10' },
  document: { icon: FileText, class: 'text-[#B8BDC7]', bg: 'bg-[#B8BDC7]/10' },
  archive:  { icon: Archive,  class: 'text-[#8A9099]', bg: 'bg-[#8A9099]/10' },
};

const FOLDERS: DocumentFolder[] = [
  'proposals_contracts',
  'deliverables_assets',
  'invoices_finance',
  'references_briefs',
];

function inferFolder(file: any): DocumentFolder {
  const name = (file.name || '').toLowerCase();
  if (name.includes('proposal') || name.includes('contract') || name.includes('agreement')) return 'proposals_contracts';
  if (name.includes('invoice') || name.includes('facture') || file.type === 'invoice') return 'invoices_finance';
  if (name.includes('brief') || name.includes('reference') || name.includes('spec') || name.includes('guidelines')) return 'references_briefs';
  return 'deliverables_assets';
}

function getFileFolder(file: any): DocumentFolder {
  return file.folder || inferFolder(file);
}

export default function PortalFiles() {
  const { t, lang } = useLang();
  const pf = t.portal.files;
  const { isValid, files, token } = usePortalData();
  const [activeFolder, setActiveFolder] = useState<DocumentFolder | null>(null);
  const [query, setQuery] = useState('');

  if (!isValid) return null;

  const folderLabelMap: Record<DocumentFolder, string> = {
    proposals_contracts: pf.folders.proposalsContracts,
    deliverables_assets: pf.folders.deliverablesAssets,
    invoices_finance: pf.folders.invoicesFinance,
    references_briefs: pf.folders.referencesBriefs,
  };

  const folderCounts = FOLDERS.reduce<Record<DocumentFolder, number>>((acc, f) => {
    acc[f] = files.filter((file: any) => getFileFolder(file) === f).length;
    return acc;
  }, {} as Record<DocumentFolder, number>);

  const visibleFiles = files.filter((f: any) => {
    const matchFolder = !activeFolder || getFileFolder(f) === activeFolder;
    const matchQuery = f.name.toLowerCase().includes(query.toLowerCase());
    return matchFolder && matchQuery;
  });

  async function handleDownload(file: any) {
    if (!token) return;
    try {
      await fetch('/api/portal/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, event: 'file_downloaded', metadata: { fileId: file.id, name: file.name, url: file.url } }),
      });
    } catch (err) {
      console.error('Error logging file download:', err);
    }
    window.open(file.url, '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-normal"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
          >
            {pf.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A9099' }}>
            {activeFolder ? (
              <button
                onClick={() => setActiveFolder(null)}
                className="hover:underline transition-colors"
                style={{ color: '#7FA38A' }}
              >
                {pf.backToFolders}
              </button>
            ) : pf.subtitle}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      {activeFolder && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8A9099' }}>
          <button onClick={() => setActiveFolder(null)} className="hover:text-white/60 transition-colors cursor-pointer">
            {pf.title}
          </button>
          <ChevronRight size={12} />
          <span style={{ color: '#F5F1E8' }}>{folderLabelMap[activeFolder as DocumentFolder]}</span>
        </div>
      )}

      {/* Folder cards — shown when no folder selected */}
      {!activeFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FOLDERS.map((folder, i) => (
            <motion.button
              key={folder}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              onClick={() => setActiveFolder(folder)}
              className="rounded-[14px] border p-4 text-left transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5 group cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <Folder
                size={20}
                className="mb-3"
                style={{ color: 'rgba(184,189,199,0.5)' }}
              />
              <p className="text-xs font-medium leading-snug" style={{ color: '#F5F1E8' }}>
                {folderLabelMap[folder]}
              </p>
              <p className="text-[10px] mt-1" style={{ color: '#8A9099' }}>
                {pf.folderCount.replace('{{count}}', String(folderCounts[folder]))}
              </p>
            </motion.button>
          ))}
        </div>
      )}

      {/* Search — shown when folder is selected */}
      {activeFolder && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8A9099' }} />
          <input
            type="text"
            placeholder={t.app.files.searchPlaceholder}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#F5F1E8',
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>
      )}

      {/* File grid */}
      {activeFolder && (
        visibleFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleFiles.map((file: any) => {
              const cfg = TYPE_CONFIG[file.type as FileType] || TYPE_CONFIG.document;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[14px] border p-4 flex flex-col gap-3 transition-all duration-200 hover:border-white/12 group"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', cfg.bg)}>
                    <Icon size={17} className={cfg.class} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-snug" style={{ color: '#F5F1E8' }} title={file.name}>
                      {file.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px]" style={{ color: '#8A9099' }}>{file.size}</span>
                    <button
                      onClick={() => handleDownload(file)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                      title={lang === 'fr' ? 'Télécharger' : 'Download'}
                      aria-label="Download file"
                    >
                      <Download size={12} style={{ color: '#B8BDC7' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#8A9099' }}>
              {query
                ? `${t.app.files.noFiles} "${query}"`
                : (lang === 'fr' ? 'Aucun fichier dans ce dossier.' : 'No files in this folder.')}
            </p>
            {query && (
              <button onClick={() => setQuery('')} className="text-xs mt-2 hover:underline cursor-pointer" style={{ color: '#7FA38A' }}>
                {t.app.clients.clearSearch}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
