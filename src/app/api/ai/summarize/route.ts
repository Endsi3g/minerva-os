import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

type SummaryType = 'project_status' | 'client_brief' | 'risk_report';

const SYSTEM_PROMPTS: Record<SummaryType, string> = {
  project_status: `You are a senior project strategist at a creative agency. Given raw project data, produce a concise 2-3 sentence status summary for an internal agency audience. Focus on progress percentage, completed milestones, and the single most important blocker. Be direct, professional, and actionable. No markdown headers or bullet points — flowing prose only.`,
  client_brief: `You are a senior account strategist at a creative agency. Given raw client and project data, produce a concise 2-3 sentence client brief summary. Include the client's primary objective, the project scope, and a recommended immediate next step. Be direct and professional. No markdown headers or bullet points — flowing prose only.`,
  risk_report: `You are a risk analyst for a creative agency. Given raw project, invoice, approval, and pipeline data, produce a risk report. Format as a bullet list with severity labels: HIGH, MEDIUM, or LOW at the start of each bullet. Each bullet should identify the risk, quantify it where possible, and suggest a concrete action. Be concise and specific. Use the middot character (·) not em dashes.`,
};

const MOCK_SUMMARIES: Record<SummaryType, string> = {
  project_status: 'The project is progressing well with 68% of tasks completed. The design phase concluded ahead of schedule, and development is on track for the June 15 milestone. One blocker remains: client sign-off on the revised color palette is needed before the homepage build can proceed.',
  client_brief: 'Objectives: Redesign the e-commerce platform to improve conversion by 25%. Scope includes UX audit, visual redesign, and front-end implementation. Recommended next step: discovery workshop on 15 May to align on brand direction.',
  risk_report: '· HIGH: Invoice #INV-2024-008 is 12 days overdue · escalate to finance contact.\n· MEDIUM: "Brand Refresh" approval pending for 8 days · follow up with stakeholder.\n· LOW: Pipeline deal "Vertex Creative" stale in Qualified stage · schedule check-in call.',
};

export async function POST(req: NextRequest) {
  const { type, context } = await req.json() as { type: SummaryType; context: string };

  if (!type || !context) {
    return NextResponse.json({ error: 'type and context are required.' }, { status: 400 });
  }

  if (!SYSTEM_PROMPTS[type]) {
    return NextResponse.json({ error: 'Invalid summary type.' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ summary: MOCK_SUMMARIES[type], model: 'mock' });
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPTS[type],
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: context }],
    });

    const block = message.content[0];
    const summary = block.type === 'text' ? block.text : '';
    return NextResponse.json({ summary, model: message.model });
  } catch (err) {
    console.error('[AI summarize]', err);
    return NextResponse.json({ error: 'AI summarization failed.' }, { status: 500 });
  }
}
