import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

let pipelinePromise: any = null;

async function getEmbedder() {
  if (!pipelinePromise) {
    const { pipeline, env } = await import('@xenova/transformers');
    env.localModelPath = '';
    env.allowLocalModels = false;
    pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipelinePromise;
}

const HERMES_SYSTEM = `You are Hermes, the AI brain of Minerva OS, the operating system for elite creative agencies. You are sharp, professional, and knowledgeable about agency operations: CRM, project management, billing, approvals, and client relationships.

Your personality: direct, intelligent, and slightly editorial. You use precise language. You never use em dashes. You help agency owners, strategists, and project managers make better decisions faster.

You have access to the agency's live context below. When answering questions, reference specific data where relevant. When you detect a problem or opportunity, you proactively flag it with a brief note prefixed by "Note:".

Formatting rules:
· Use short paragraphs or bullet points (middot · not em dash)
· Keep responses under 200 words unless a detailed analysis is explicitly requested
· Use the middot character (·) for lists
· No markdown headers (##, ###) in responses
· Respond in the same language as the user's message (English or French)`;

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  let RAGContext = '';
  try {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage?.content) {
      const supabase = await createClient();
      const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
      const workspaceId = workspaces?.[0]?.id;

      if (workspaceId) {
        const extractor = await getEmbedder();
        const output = await extractor(lastUserMessage.content, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(output.data) as number[];

        const { data: kbArticles } = await supabase.rpc('match_knowledge_base', {
          query_embedding: queryEmbedding,
          match_threshold: 0.1,
          match_count: 3,
          filter_workspace_id: workspaceId,
        });

        const { data: projects } = await supabase.rpc('match_projects', {
          query_embedding: queryEmbedding,
          match_threshold: 0.1,
          match_count: 3,
          filter_workspace_id: workspaceId,
        });

        if (kbArticles && kbArticles.length > 0) {
          RAGContext += '\n--- SEMANTIC KNOWLEDGE BASE MATCHES ---\n';
          kbArticles.forEach((art: any) => {
            RAGContext += `· Category: ${art.category} | Title: ${art.title}\n  Content: ${art.content}\n`;
          });
        }

        if (projects && projects.length > 0) {
          RAGContext += '\n--- SEMANTIC PROJECT MATCHES ---\n';
          projects.forEach((p: any) => {
            RAGContext += `· Project Name: ${p.name} | Client: ${p.client_name} | Status: ${p.status}\n`;
          });
        }
      }
    }
  } catch (ragErr) {
    console.error('[Hermes RAG Failed]:', ragErr);
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

  const finalContext = [context, RAGContext].filter(Boolean).join('\n\n');
  const systemContent = finalContext
    ? `${HERMES_SYSTEM}\n\n--- LIVE WORKSPACE CONTEXT ---\n${finalContext}`
    : HERMES_SYSTEM;

  // 1. Try Anthropic if key is present
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
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
      if (content) {
        return NextResponse.json({ content });
      }
    } catch (err) {
      console.error('[Hermes Anthropic Failed, trying fallback]', err);
    }
  }

  // 2. Try OpenRouter fallback
  if (openRouterKey) {
    try {
      const openRouterMessages = [
        { role: 'system', content: systemContent },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ];

      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://minerva-os.com",
          "X-Title": "Minerva OS",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: openRouterMessages,
          max_tokens: 1024,
        })
      });

      if (orRes.ok) {
        const data = await orRes.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          return NextResponse.json({ content });
        }
      } else {
        const errText = await orRes.text();
        console.error('[Hermes OpenRouter Failed]:', errText);
      }
    } catch (orErr) {
      console.error('[Hermes OpenRouter Exception]:', orErr);
    }
  }

  // 3. Demomode / Mock fallback if all fails
  const lastMsg = messages[messages.length - 1].content.toLowerCase();
  let mockReply = "I'm Hermes, your AI co-pilot. I'm currently running in demo mode — configure your ANTHROPIC_API_KEY or OPENROUTER_API_KEY to activate full intelligence.";
  if (lastMsg.includes('project')) mockReply = "Your active projects are tracking well. No critical blockers detected this week.";
  if (lastMsg.includes('client')) mockReply = "Your top clients are performing above MRR target. I recommend a check-in with any client silent for 14+ days.";
  if (lastMsg.includes('invoice') || lastMsg.includes('billing')) mockReply = "2 invoices are currently overdue. I recommend sending a payment reminder to both contacts today.";
  if (RAGContext) {
    mockReply += `\n\n[Demo mode detected matches]: ${RAGContext}`;
  }
  return NextResponse.json({ content: mockReply });
}
