'use client';
import { useState, useEffect } from 'react';
import { Plus, Ticket } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function PortalTickets() {
  const { lang } = useLang();
  const { clientId, workspaceId, isValid, tickets, token, refresh } = usePortalData();

  const [clientTickets, setClientTickets] = useState<any[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'question',
  });

  useEffect(() => {
    if (tickets) {
      setClientTickets(tickets);
    }
  }, [tickets]);

  if (!isValid) return null;

  async function handleSubmit() {
    if (!clientId || !workspaceId || !token) return;
    if (!form.subject || !form.description) {
      toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill all required fields');
      return;
    }
    try {
      const res = await fetch('/api/portal/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          subject: form.subject,
          description: form.description,
          priority: form.priority,
          category: form.category,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(lang === 'fr' ? 'Ticket soumis avec succès' : 'Request submitted successfully');
        setSheetOpen(false);
        setForm({
          subject: '',
          description: '',
          priority: 'medium',
          category: 'question',
        });
        refresh();
      } else {
        throw new Error(data.error || 'Failed to submit ticket');
      }
    } catch (e) {
      console.error(e);
      toast.error(lang === 'fr' ? "Erreur lors de la soumission" : "Failed to submit request");
    }
  }

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    open:        { label: lang === 'fr' ? 'Ouvert' : 'Open', class: 'text-warm bg-warm/10 border-warm/20' },
    in_progress: { label: lang === 'fr' ? 'En cours' : 'In Progress', class: 'text-sage bg-sage/10 border-sage/20' },
    resolved:    { label: lang === 'fr' ? 'Résolu' : 'Resolved', class: 'text-silver bg-white/5 border-white/10' },
    closed:      { label: lang === 'fr' ? 'Fermé' : 'Closed', class: 'text-fog bg-white/5 border-transparent' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">
            {lang === 'fr' ? 'Support Client' : 'Support Hub'}
          </h1>
          <p className="text-sm text-fog mt-0.5">
            {lang === 'fr' ? 'Suivez vos demandes et contactez notre équipe.' : 'Manage support tickets and request assistance.'}
          </p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus size={14} className="mr-1" />
          {lang === 'fr' ? 'Nouvelle Demande' : 'New Request'}
        </Button>
      </div>

      <div className="space-y-3">
        {clientTickets.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-white/5 bg-midnight/50 flex flex-col items-center justify-center">
            <Ticket className="h-10 w-10 text-fog/30 mb-3" />
            <p className="text-sm text-silver font-medium">
              {lang === 'fr' ? 'Aucune demande en cours' : 'No active requests'}
            </p>
            <p className="text-xs text-fog mt-1">
              {lang === 'fr' ? 'Soumettez un ticket si vous rencontrez un problème.' : 'Submit a request if you need help with anything.'}
            </p>
          </div>
        ) : (
          clientTickets.map((ticket: any) => {
            const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            return (
              <div
                key={ticket._id}
                className="rounded-xl border border-white/5 bg-midnight p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${sc.class}`}>
                      {sc.label}
                    </span>
                    <span className="text-[10px] text-fog font-medium capitalize">
                      {ticket.category} · {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ivory">{ticket.subject}</h3>
                  <p className="text-xs text-silver max-w-xl">{ticket.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{lang === 'fr' ? 'Nouvelle Demande' : 'New Request'}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{lang === 'fr' ? 'Sujet' : 'Subject'}</Label>
              <Input
                placeholder={lang === 'fr' ? 'Décrivez brièvement le sujet' : 'Brief summary of the issue'}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{lang === 'fr' ? 'Description' : 'Description'}</Label>
              <textarea
                className="w-full min-h-[100px] text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage placeholder:text-fog"
                placeholder={lang === 'fr' ? 'Décrivez votre demande en détail...' : 'Provide more details about your request...'}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{lang === 'fr' ? 'Catégorie' : 'Category'}</Label>
              <Select
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">{lang === 'fr' ? 'Bug / Problème' : 'Bug / Issue'}</SelectItem>
                  <SelectItem value="feature">{lang === 'fr' ? 'Fonctionnalité' : 'Feature'}</SelectItem>
                  <SelectItem value="question">{lang === 'fr' ? 'Question' : 'Question'}</SelectItem>
                  <SelectItem value="billing">{lang === 'fr' ? 'Facturation' : 'Billing'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{lang === 'fr' ? 'Priorité' : 'Priority'}</Label>
              <Select
                value={form.priority}
                onValueChange={v => setForm(f => ({ ...f, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{lang === 'fr' ? 'Basse' : 'Low'}</SelectItem>
                  <SelectItem value="medium">{lang === 'fr' ? 'Moyenne' : 'Medium'}</SelectItem>
                  <SelectItem value="high">{lang === 'fr' ? 'Haute' : 'High'}</SelectItem>
                  <SelectItem value="urgent">{lang === 'fr' ? 'Urgente' : 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            {lang === 'fr' ? 'Soumettre' : 'Submit'}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
