import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

const SYSTEM_PROMPT = `You are Hermes, the senior strategic proposal writer of Minerva OS. Your goal is to draft a professional, client-ready project proposal based on a scoping brief.

Output MUST be valid JSON only, conforming to this exact schema:
{
  "intro": "Professional introductory paragraph — positioning the studio, acknowledging the client challenge, stating the engagement intent.",
  "scope": "Bullet-pointed list of deliverables, ownership responsibilities, and explicit exclusions.",
  "timeline": "Phase-by-phase milestone plan with estimated durations and review gates.",
  "pricing": "Structured fee breakdown: line items, milestone payment schedule, deposit requirements.",
  "terms": "Payment terms, IP transfer conditions, revision policy, and cancellation clause."
}

Rules:
· Never use em dashes.
· Be direct, editorial, and professional.
· Tailor scope and timeline to the specific service type.
· If a budget is provided, structure pricing to fit within it.
· All sections should be substantive — minimum 3 bullet points for scope, 3 phases for timeline.`;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    void user;

    const { brief, clientCompany, serviceType, budget, workspaceId } = (await req.json()) as {
      brief?: string;
      clientCompany?: string;
      serviceType?: string;
      budget?: number;
      workspaceId?: string;
    };

    const company = clientCompany || 'Client Partner';
    const service = serviceType || 'creative services';
    const budgetLine = budget ? `\nBudget: $${budget.toLocaleString()} USD` : '';
    const briefLine = brief ? `\nAdditional brief: ${brief}` : '';

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        intro: `Uprising Studio is pleased to submit this ${service} proposal to ${company}. We are positioned to deliver a focused, high-quality engagement that addresses your objectives directly.`,
        scope: `· Full ${service} delivery from strategy through execution\n· Weekly progress check-ins and revision rounds\n· Final asset handoff with documentation`,
        timeline: `· Phase 1 (Week 1-2): Discovery and strategy alignment\n· Phase 2 (Week 3-5): Production and review cycles\n· Phase 3 (Week 6): Final delivery and handoff`,
        pricing: budget
          ? `· Project investment: $${budget.toLocaleString()} USD\n· Deposit: 50% on kickoff\n· Balance: 50% on final delivery`
          : `· Project investment: $12,000 USD\n· Deposit: 50% on kickoff ($6,000)\n· Balance: 50% on delivery ($6,000)`,
        terms: `Payment is due within 30 days of invoice. All work remains the property of the studio until payment is received in full. The client receives full IP rights upon final payment. Up to two rounds of revisions are included per phase.`,
      });
    }

    // Fetch workspace context for prompt caching
    let workspaceContext = '';
    if (workspaceId) {
      try {
        const supabase = await createClient();
        const { data: ws } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .maybeSingle();
        if (ws?.name) workspaceContext = `\nAgency: ${ws.name}`;
      } catch { /* non-critical */ }
    }

    const client = new Anthropic();
    const userMessage = `Service type: ${service}${budgetLine}${briefLine}
Client company: ${company}${workspaceContext}

Generate the complete proposal now.`;

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    const rawText = block.type === 'text' ? block.text : '';

    let parsed: { intro: string; scope: string; timeline: string; pricing: string; terms: string };
    try {
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      const jsonText = startIdx !== -1 && endIdx !== -1 ? rawText.substring(startIdx, endIdx + 1) : rawText;
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error('Invalid JSON from AI agent.');
    }

    return NextResponse.json({
      intro: parsed.intro || '',
      scope: parsed.scope || '',
      timeline: parsed.timeline || '',
      pricing: parsed.pricing || '',
      terms: parsed.terms || 'Payment due within 30 days of invoice. All work remains the property of the studio until payment is received in full.',
    });
  } catch (err) {
    console.error('[Proposal Draft API Error]:', err);
    return NextResponse.json({ error: 'Failed to draft proposal.' }, { status: 500 });
  }
}
