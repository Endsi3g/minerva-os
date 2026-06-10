'use client';

import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFolders, useAddFolder, useDeleteFolder } from '@/lib/hooks/useSupabase';
import { useLang } from '@/i18n';
import { Folder as FolderIcon, Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Folders() {
  const { workspace } = useWorkspace();
  const { t } = useLang();
  
  const workspaceId = workspace?.id || '';
  const folders = useFolders(workspaceId);
  const addFolder = useAddFolder();
  const deleteFolder = useDeleteFolder();

  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const f = t.app.folders;

  const filteredFolders = folders
    ? folders.filter(
        (fold) =>
          fold.name.toLowerCase().includes(query.toLowerCase()) ||
          (fold.description || '').toLowerCase().includes(query.toLowerCase()) ||
          (fold.owner || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;

    setIsSubmitting(true);
    try {
      await addFolder({
        workspaceId,
        name: name.trim(),
        description: description.trim(),
        owner: 'Alex Smith',
      });
      toast.success('Folder created successfully.');
      setName('');
      setDescription('');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteFolder(id);
      toast.success('Folder removed successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove folder.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {f?.title || 'Folders'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {f?.subtitle ||
              'Add and remove folders from your sidebar in the table below, and organize folders by dragging and dropping directly in the sidebar'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium px-4 py-2 text-sm flex items-center gap-1.5 cursor-pointer">
              <Plus size={16} />
              {f?.newFolder || 'New folder'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{f?.addFolderTitle || 'Create Folder'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label htmlFor="folder-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {f?.nameLabel || 'Name'}
                  </label>
                  <Input
                    id="folder-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SL Mobbin"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="folder-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {f?.descriptionLabel || 'Description'}
                  </label>
                  <Textarea
                    id="folder-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the folder contents..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  {f?.cancel || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                >
                  {f?.addFolderSubmit || 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredFolders.map((fold) => (
          <div
            key={fold.id}
            className="bg-surface border border-border shadow-card rounded-xl p-6 flex flex-col gap-4 relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised"
          >
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
              <FolderIcon size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-base leading-none">
                {fold.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] mt-1.5">
                {fold.description || 'No description provided.'}
              </p>
            </div>
          </div>
        ))}
        {filteredFolders.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-surface/50 text-center p-6">
            <FolderIcon size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {f?.emptyState || 'No folders found.'}
            </p>
          </div>
        )}
      </div>

      {/* Browse All Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">
          {f?.browseAll || 'Browse all'}
        </h2>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={f?.searchPlaceholder || 'Search by name, description, or owner'}
            className="pl-10 rounded-full bg-surface border border-border"
          />
        </div>

        {/* Rows Table */}
        <div className="border border-border rounded-xl bg-surface divide-y divide-border overflow-hidden">
          {filteredFolders.map((fold) => (
            <div
              key={fold.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/10"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                  <FolderIcon size={16} />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {fold.name}
                  </p>
                  {fold.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {fold.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <span className="text-xs text-muted-foreground font-medium">
                  {fold.owner || 'Alex Smith'}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handleRemove(fold.id)}
                  className="rounded-full text-xs font-semibold px-4 py-1.5 h-auto border border-border hover:bg-muted shrink-0 cursor-pointer"
                >
                  {f?.remove || 'Remove'}
                </Button>
              </div>
            </div>
          ))}
          {filteredFolders.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground bg-surface/50">
              No matching folders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
