import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const HERMES_SYSTEM = `You are Hermes, the AI brain of Minerva OS — the operating system for elite creative agencies. You are sharp, professional, and knowledgeable about agency operations: CRM, project management, billing, approvals, and client relationships.

Your personality: direct, intelligent, and slightly editorial. You use precise language. You never use em dashes. You help agency owners, strategists, and project managers make better decisions faster.

You have access to the agency's live context below. When answering questions, reference specific data where relevant. When you detect a problem or opportunity, you proactively flag it with a brief note prefixed by "Note:".

Formatting rules:
- Use short paragraphs or bullet points (middot · not em dash)
- Keep responses under 200 words unless a detailed analysis is explicitly requested
- Use the middot character (·) for lists
- No markdown headers (##, ###) in responses
- Respond in the same language as the user's message (English or French)`;

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const lastMsg = messages[messages.length - 1].content.toLowerCase();
    let mockReply = "I'm Hermes, your AI co-pilot. I'm currently running in demo mode — configure your ANTHROPIC_API_KEY to activate full intelligence.";
    if (lastMsg.includes('project')) mockReply = "Your active projects are tracking well. No critical blockers detected this week.";
    if (lastMsg.includes('client')) mockReply = "Your top clients are performing above MRR target. I recommend a check-in with any client silent for 14+ days.";
    if (lastMsg.includes('invoice') || lastMsg.includes('billing')) mockReply = "2 invoices are currently overdue. I recommend sending a payment reminder to both contacts today.";
    return NextResponse.json({ content: mockReply });
  }

  try {
    const client = new Anthropic();

    const systemContent = context
      ? `${HERMES_SYSTEM}\n\n--- LIVE WORKSPACE CONTEXT ---\n${context}`
      : HERMES_SYSTEM;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemContent,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const block = response.content[0];
    const content = block.type === 'text' ? block.text : '';
    return NextResponse.json({ content });
  } catch (err) {
    console.error('[Hermes chat]', err);
    return NextResponse.json({ error: 'AI chat failed.' }, { status: 500 });
  }
}
