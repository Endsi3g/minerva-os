import Anthropic from '@anthropic-ai/sdk';
import { validatePortalToken } from '@/lib/portal-auth';

const MODEL = 'claude-sonnet-4-6';

function buildSystemPrompt(ctx: {
  clientName: string;
  projects: string[];
  pendingApprovals: number;
  outstandingInvoices: string;
}) {
  return `You are a helpful assistant for ${ctx.clientName}'s client portal at Uprising Studio.

Context:
- Active projects: ${ctx.projects.join(', ') || 'none'}
- Pending approvals awaiting your review: ${ctx.pendingApprovals}
- Outstanding invoice balance: ${ctx.outstandingInvoices}

Help the client understand their project status, review deliverables, find files, and navigate the portal. Be concise and professional. Always answer in the language the client uses (English or French). Never reveal internal agency notes or pricing details beyond what is already visible in the portal. If you don't know something specific, say so rather than guessing.`;
}

function mockStream(message: string): ReadableStream {
  const words = `I can help you with that. ${message.length > 30 ? 'Your portal shows your current project status and activity.' : 'Please check the relevant section of your portal for details.'}`.split(' ');
  return new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(new TextEncoder().encode(word + ' '));
        await new Promise(r => setTimeout(r, 40));
      }
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  try {
    const { token, message, history = [] } = await request.json();

    if (!token || !message) {
      return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 });
    }

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(mockStream(message), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = buildSystemPrompt({
      clientName: 'Client',
      projects: [],
      pendingApprovals: 0,
      outstandingInvoices: '$0',
    });

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 512,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
        controller.close();
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (err: any) {
    console.error('Portal copilot error:', err);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
  }
}
