import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { isDemoMode } from '@/lib/demo';

// Sections visible per role
const ROLE_SECTIONS: Record<string, string[]> = {
  designer:        ['urgences', 'approbations'],
  pm:              ['urgences', 'derive', 'approbations'],
  project_manager: ['urgences', 'derive', 'approbations'],
  default:         ['urgences', 'derive', 'facturation', 'approbations'],
};

function sectionsForRole(role: string): string[] {
  return ROLE_SECTIONS[role] ?? ROLE_SECTIONS.default;
}

const MOCK_BRIEFING = (role: string, lang: string) => ({
  generatedAt: new Date().toISOString(),
  role,
  sections: [
    {
      type: 'urgences',
      title: lang === 'fr' ? 'Urgences' : 'Urgencies',
      emoji: '🔴',
      items: [
        { label: lang === 'fr' ? 'Projet Rebrand — délai dépassé de 3 jours' : 'Rebrand Project — deadline exceeded by 3 days', module: 'projects' },
        { label: lang === 'fr' ? 'Tâche "Maquettes V2" bloquée depuis 4 jours' : '"V2 Mockups" task blocked for 4 days', module: 'tasks' },
      ],
      ai_summary: lang === 'fr'
        ? '2 éléments nécessitent votre attention immédiate.'
        : '2 items require your immediate attention.',
    },
    ...sectionsForRole(role).includes('derive') ? [{
      type: 'derive',
      title: lang === 'fr' ? 'Projets en dérive' : 'Projects at Risk',
      emoji: '⚠️',
      items: [
        { label: lang === 'fr' ? 'Site E-Commerce — 85% du budget utilisé, 40% livré' : 'E-Commerce Site — 85% budget used, 40% delivered', module: 'projects' },
      ],
      ai_summary: lang === 'fr'
        ? '1 projet présente un risque de dépassement budgétaire.'
        : '1 project shows budget overrun risk.',
    }] : [],
    ...sectionsForRole(role).includes('facturation') ? [{
      type: 'facturation',
      title: lang === 'fr' ? 'Facturation' : 'Billing',
      emoji: '💰',
      items: [
        { label: lang === 'fr' ? 'Facture #INV-2024 — Acme Inc. — échéance dans 3 jours ($4,500)' : 'Invoice #INV-2024 — Acme Inc. — due in 3 days ($4,500)', module: 'invoices' },
      ],
      ai_summary: lang === 'fr'
        ? '$4,500 à encaisser cette semaine.'
        : '$4,500 to collect this week.',
    }] : [],
    ...sectionsForRole(role).includes('approbations') ? [{
      type: 'approbations',
      title: lang === 'fr' ? 'Approbations' : 'Stalled Approvals',
      emoji: '⏳',
      items: [
        { label: lang === 'fr' ? '"Identité de marque v3" — en attente depuis 2 jours' : '"Brand Identity v3" — awaiting response for 2 days', module: 'approvals' },
        { label: lang === 'fr' ? '"Homepage Design" — en attente depuis 5 jours' : '"Homepage Design" — awaiting response for 5 days', module: 'approvals' },
      ],
      ai_summary: lang === 'fr'
        ? '2 approbations bloquent la livraison client.'
        : '2 approvals are blocking client delivery.',
    }] : [],
  ].filter(s => sectionsForRole(role).includes(s.type)),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId, userRole = 'owner', lang = 'en' } = (await req.json()) as {
      workspaceId: string;
      userRole?: string;
      lang?: string;
    };

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!isDemoMode()) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.workspace_id && profile.workspace_id !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Return mock if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(MOCK_BRIEFING(userRole, lang));
    }

    const supabase = await createClient();
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
    const ago48h = new Date(now.getTime() - 48 * 3600000).toISOString();
    const in14Days = new Date(now.getTime() + 14 * 86400000).toISOString();

    const [{ data: tasks }, { data: approvals }, { data: invoices }, { data: projects }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, due_date, project_id')
        .eq('workspace_id', workspaceId)
        .neq('status', 'completed')
        .neq('status', 'done')
        .lt('due_date', now.toISOString())
        .order('due_date', { ascending: true })
        .limit(10),
      supabase
        .from('approvals')
        .select('id, title, status, updated_at, project_id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .lt('updated_at', ago48h)
        .order('updated_at', { ascending: true })
        .limit(10),
      supabase
        .from('invoices')
        .select('id, number, status, amount, due_date, client_id')
        .eq('workspace_id', workspaceId)
        .in('status', ['draft', 'sent'])
        .lte('due_date', in7Days)
        .order('due_date', { ascending: true })
        .limit(10),
      supabase
        .from('projects')
        .select('id, name, status, end_date, budget, workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .lte('end_date', in14Days)
        .order('end_date', { ascending: true })
        .limit(10),
    ]);

    const visibleSections = sectionsForRole(userRole);

    const contextLines = [
      `Overdue tasks: ${(tasks ?? []).length} — ${(tasks ?? []).map((t: any) => `"${t.title}" (due ${t.due_date?.split('T')[0]})`).join(', ') || 'none'}`,
      `Stalled approvals (>48h pending): ${(approvals ?? []).length} — ${(approvals ?? []).map((a: any) => `"${a.title}"`).join(', ') || 'none'}`,
      `Invoices due within 7 days: ${(invoices ?? []).length} — ${(invoices ?? []).map((i: any) => `#${i.number} $${i.amount} (due ${i.due_date?.split('T')[0]})`).join(', ') || 'none'}`,
      `Projects at risk (deadline <14d): ${(projects ?? []).length} — ${(projects ?? []).map((p: any) => `"${p.name}" (ends ${p.end_date?.split('T')[0]})`).join(', ') || 'none'}`,
      `User role: ${userRole}`,
      `Visible sections: ${visibleSections.join(', ')}`,
    ].join('\n');

    const systemPrompt = lang === 'fr'
      ? 'Tu es Hermes, l\'assistant IA de Minerva OS. Génère un briefing quotidien structuré en JSON. Sois concis, actionnable et direct.'
      : 'You are Hermes, Minerva OS AI assistant. Generate a structured daily briefing in JSON. Be concise, actionable, and direct.';

    const userPrompt = `Workspace data:
${contextLines}

Return a JSON object with this exact structure (no other text):
{
  "generatedAt": "${now.toISOString()}",
  "role": "${userRole}",
  "sections": [
    {
      "type": "urgences|derive|facturation|approbations",
      "title": "string",
      "emoji": "string",
      "items": [{"label": "string", "module": "projects|tasks|invoices|approvals"}],
      "ai_summary": "one sentence max"
    }
  ]
}

Only include sections: ${visibleSections.join(', ')}.
If a section has no data, include it with empty items array.
Items should be specific (include names, amounts, dates). Max 3 items per section.`;

    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    let briefing;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      briefing = match ? JSON.parse(match[0]) : MOCK_BRIEFING(userRole, lang);
    } catch {
      briefing = MOCK_BRIEFING(userRole, lang);
    }

    return NextResponse.json(briefing);
  } catch (err) {
    console.error('[ai/daily-briefing]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
