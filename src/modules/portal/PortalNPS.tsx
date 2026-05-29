'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalNPS() {
  const { lang } = useLang();
  const { clientId, workspaceId, isValid } = usePortalData();

  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isValid) return null;

  async function handleSubmit() {
    if (!clientId || !workspaceId || score === null) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner un score' : 'Please select a score');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('nps_responses')
        .insert({
          workspace_id: workspaceId,
          client_id: clientId,
          score,
          reason: reason || null,
          suggestion: suggestion || null,
          trigger_event: 'manual',
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success(lang === 'fr' ? 'Merci pour vos commentaires !' : 'Thank you for your feedback!');
    } catch (e) {
      console.error(e);
      toast.error(lang === 'fr' ? 'Échec de la soumission.' : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-sage animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-ivory">
          {lang === 'fr' ? 'Merci pour vos commentaires !' : 'Thank you for your feedback!'}
        </h2>
        <p className="text-sm text-fog leading-relaxed">
          {lang === 'fr'
            ? 'Vos réponses nous aident à améliorer notre partenariat et nos livrables.'
            : 'Your responses help us improve our partnership and deliverables.'}
        </p>
      </div>
    );
  }

  const getScoreColor = (s: number) => {
    if (s <= 6) return 'hover:bg-ember/20 hover:text-ember hover:border-ember/40';
    if (s <= 8) return 'hover:bg-warm/20 hover:text-warm hover:border-warm/40';
    return 'hover:bg-sage/20 hover:text-sage hover:border-sage/40';
  };

  const getActiveScoreColor = (s: number) => {
    if (s <= 6) return 'bg-ember/20 text-ember border-ember/50';
    if (s <= 8) return 'bg-warm/20 text-warm border-warm/50';
    return 'bg-sage/20 text-sage border-sage/50';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-ivory">
          {lang === 'fr' ? 'Satisfaction Client' : 'Client Satisfaction'}
        </h1>
        <p className="text-sm text-fog mt-0.5">
          {lang === 'fr'
            ? 'Prenez un moment pour évaluer notre collaboration et nous aider à nous améliorer.'
            : 'Take a moment to rate our collaboration and help us improve.'}
        </p>
      </div>

      <div className="space-y-6 bg-midnight border border-white/5 p-6 rounded-2xl">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-silver">
            {lang === 'fr'
              ? 'Quelle est la probabilité que vous nous recommandiez à un collègue ?'
              : 'How likely are you to recommend us to a colleague?'}
          </Label>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }).map((_, idx) => {
              const active = score === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setScore(idx)}
                  className={`h-10 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    active
                      ? getActiveScoreColor(idx)
                      : `border-white/10 text-silver bg-[#111522] ${getScoreColor(idx)}`
                  }`}
                >
                  {idx}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-fog font-medium px-1">
            <span>{lang === 'fr' ? 'Pas du tout probable' : 'Not likely'}</span>
            <span>{lang === 'fr' ? 'Extrêmement probable' : 'Extremely likely'}</span>
          </div>
        </div>

        {score !== null && (
          <div className="space-y-4 pt-4 border-t border-white/5 animate-fadeIn">
            <div className="space-y-1.5">
              <Label className="text-xs text-silver">
                {lang === 'fr'
                  ? 'Quelle est la principale raison de cette note ? (optionnel)'
                  : 'What is the main reason for your rating? (optional)'}
              </Label>
              <textarea
                className="w-full min-h-[80px] text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage placeholder:text-fog"
                placeholder={lang === 'fr' ? 'Dites-nous ce que vous en pensez...' : 'Tell us what you think...'}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-silver">
                {lang === 'fr'
                  ? 'Avez-vous des suggestions d\'amélioration ? (optionnel)'
                  : 'Do you have any suggestions for improvement? (optional)'}
              </Label>
              <textarea
                className="w-full min-h-[80px] text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage placeholder:text-fog"
                placeholder={lang === 'fr' ? 'Comment pourrions-nous faire mieux ?' : 'How could we do better?'}
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {lang === 'fr' ? 'Soumettre' : 'Submit Feedback'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
