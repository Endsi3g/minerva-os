import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { isDemoMode, DEMO_WORKSPACE_ID } from '@/lib/demo';
import { MOCK_PROJECTS, MOCK_LEADS } from '@/lib/mock-data';

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

const HERMES_SYSTEM = `You are Lucifee a female cofounder, the AI brain of Minerva OS, the operating system for elite creative agencies. You are sharp, professional, and knowledgeable about agency operations: CRM, project management, billing, approvals, and client relationships but you also have a french canadian personnality and dialect while being able to speak english.

Your personality: direct, intelligent, and slightly editorial but alos friendly and constructive. You use precise language. You never use em dashes (—). You help agency owners, strategists, and project managers make better decisions faster.

You have access to the agency's live context (including CRM leads, project timelines, invoice statuses, approvals, and client portal activity). When answering, ground your insights in this specific workspace data. When you detect a bottleneck or opportunity (e.g., overdue invoices, stalled timelines, low client activity), you proactively flag it with a brief, high-impact note prefixed by "Note:".

Formatting Rules (CRITICAL):
· Use short, dense paragraphs or bullet points.
· Keep responses under 200 words unless a detailed analysis is explicitly requested.
· Use the middot character (·) for all lists and bullet points. Never use em dashes (—).
· Do not use markdown headers (##, ###) in your replies, to ensure seamless rendering within the compact chat sidebar.
· Dynamic Language Matching: Respond in the exact language used by the user (English or French).`;

function formatWorkspaceContext(
  activeProjects: any[] | null,
  recentRiskFlags: any[] | null,
  deals: any[] | null,
): string {
  let contextStr = '';

  if (activeProjects && activeProjects.length > 0) {
    contextStr += '\n--- ACTIVE PROJECTS ---\n';
    activeProjects.forEach(p => {
      const budgetVal = p.budget ? ` | Budget: $${p.budget}` : '';
      contextStr += `· Project: ${p.name} (Client: ${p.client_name || p.client || 'N/A'})${budgetVal} | Due: ${p.due_date || p.dueDate}\n`;
    });
  }

  if (recentRiskFlags && recentRiskFlags.length > 0) {
    contextStr += '\n--- RECENT RISK FLAGS ---\n';
    recentRiskFlags.forEach(rf => {
      contextStr += `· [${rf.severity.toUpperCase()}] ${rf.summary} | Status: ${rf.status} (Type: ${rf.type})\n`;
    });
  }

  if (deals && deals.length > 0) {
    const stages = { new_lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
    const values = { new_lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
    deals.forEach(d => {
      const stage = d.stage as keyof typeof stages;
      if (stages[stage] !== undefined) {
        stages[stage] += 1;
        values[stage] += Number(d.value || 0);
      }
    });

    contextStr += '\n--- PIPELINE SUMMARY ---\n';
    Object.keys(stages).forEach(stage => {
      const s = stage as keyof typeof stages;
      if (stages[s] > 0) {
        contextStr += `· Stage: ${s} | Count: ${stages[s]} | Total Value: $${values[s]}\n`;
      }
    });
  }

  return contextStr;
}

async function persistMessages(
  threadId: string | undefined,
  userMessage: string,
  assistantContent: string,
  workspaceId: string,
): Promise<string> {
  try {
    const supabase = await createClient();
    let resolvedThreadId = threadId;

    if (!resolvedThreadId) {
      // Find the first agent or default to seeded Hermes orchestrator UUID to prevent foreign key errors
      let agentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (agent) {
        agentId = agent.id;
      }

      const { data: thread } = await supabase
        .from('agent_threads')
        .insert({ workspace_id: workspaceId, agent_id: agentId, title: userMessage.slice(0, 80), status: 'active' })
        .select('id')
        .single();
      resolvedThreadId = thread?.id;
    }

    if (resolvedThreadId) {
      // Save messages. Role is 'agent' to match database check constraints
      await supabase.from('agent_messages').insert([
        { thread_id: resolvedThreadId, role: 'user', content: userMessage, workspace_id: workspaceId },
        { thread_id: resolvedThreadId, role: 'agent', content: assistantContent, workspace_id: workspaceId },
      ]);
    }

    return resolvedThreadId ?? '';
  } catch (err) {
    console.error('[Hermes Persist Failed]:', err);
    return threadId ?? '';
  }
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { messages, context, thread_id } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context?: string;
    thread_id?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  let RAGContext = '';
  let workspaceId: string | undefined;
  let dynamicContext = '';

  try {
    if (isDemoMode()) {
      workspaceId = DEMO_WORKSPACE_ID;
      // Gather context from mock data
      const activeProjects = MOCK_PROJECTS.filter(p => p.status === 'active');
      const recentRiskFlags = [
        { severity: 'high', summary: 'Scope creep on Stratum branding', status: 'active', type: 'scope' },
        { severity: 'medium', summary: 'Logo approval pending for 5+ days', status: 'active', type: 'approval' }
      ];
      dynamicContext = formatWorkspaceContext(activeProjects, recentRiskFlags, MOCK_LEADS);
    } else {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      workspaceId = profile?.workspace_id;

      if (workspaceId) {
        // 1. Gather dynamic workspace context
        const [projectsRes, riskRes, dealsRes] = await Promise.all([
          supabase.from('projects').select('name, status, due_date, budget').eq('workspace_id', workspaceId).eq('status', 'active'),
          supabase.from('risk_flags').select('type, severity, summary, status').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
          supabase.from('deals').select('stage, value').eq('workspace_id', workspaceId)
        ]);

        dynamicContext = formatWorkspaceContext(projectsRes.data, riskRes.data, dealsRes.data);

        // 2. RAG Semantic Search
        if (lastUserMessage?.content) {
          const extractor = await getEmbedder();
          const output = await extractor(lastUserMessage.content, { pooling: 'mean', normalize: true });
          const queryEmbedding = Array.from(output.data) as number[];

          const { data: kbArticles } = await supabase.rpc('match_knowledge_base', {
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
        }
      }
    }
  } catch (err) {
    console.error('[Hermes Context/RAG Failed]:', err);
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

  const finalContext = [context, dynamicContext, RAGContext].filter(Boolean).join('\n\n');
  const systemContent = finalContext
    ? `${HERMES_SYSTEM}\n\n--- LIVE WORKSPACE CONTEXT ---\n${finalContext}`
    : HERMES_SYSTEM;

  async function streamMockResponse(text: string) {
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        // Split by words to animate typing effect smoothly
        const words = text.split(/(\s+)/);
        for (const word of words) {
          controller.enqueue(encoder.encode(word));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        if (lastUserMessage && workspaceId) {
          await persistMessages(thread_id, lastUserMessage.content, text, workspaceId);
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }

  // 1. Try Anthropic Streaming if key is present
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const stream = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemContent,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          let fullText = '';
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text;
                fullText += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            if (lastUserMessage && workspaceId) {
              await persistMessages(thread_id, lastUserMessage.content, fullText, workspaceId);
            }
          } catch (err) {
            console.error('[Anthropic Stream Error]:', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } catch (err) {
      console.error('[Hermes Anthropic Failed, trying fallback]', err);
    }
  }

  // 2. Try OpenRouter Streaming fallback
  if (openRouterKey) {
    try {
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
          messages: [
            { role: 'system', content: systemContent },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          max_tokens: 1024,
          stream: true,
        })
      });

      if (orRes.ok) {
        const readableStream = new ReadableStream({
          async start(controller) {
            const reader = orRes.body?.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = '';
            let fullText = '';

            try {
              while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const cleaned = line.trim();
                  if (cleaned.startsWith('data: ')) {
                    const dataStr = cleaned.slice(6);
                    if (dataStr === '[DONE]') continue;
                    try {
                      const parsed = JSON.parse(dataStr);
                      const text = parsed.choices?.[0]?.delta?.content || '';
                      if (text) {
                        fullText += text;
                        controller.enqueue(encoder.encode(text));
                      }
                    } catch {
                      // ignore empty/partial JSON lines
                    }
                  }
                }
              }
              if (lastUserMessage && workspaceId) {
                await persistMessages(thread_id, lastUserMessage.content, fullText, workspaceId);
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          }
        });

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
    } catch (orErr) {
      console.error('[Hermes OpenRouter Exception]:', orErr);
    }
  }

  // 3. Demo mode / mock fallback
  const lastMsg = messages[messages.length - 1].content.toLowerCase();
  let mockReply = "I'm Hermes, your AI co-pilot. I'm currently running in demo mode — configure your ANTHROPIC_API_KEY or OPENROUTER_API_KEY to activate full intelligence.";
  if (lastMsg.includes('project')) mockReply = "Your active projects are tracking well. No critical blockers detected this week.";
  if (lastMsg.includes('client')) mockReply = "Your top clients are performing above MRR target. I recommend a check-in with any client silent for 14+ days.";
  if (lastMsg.includes('invoice') || lastMsg.includes('billing')) mockReply = "2 invoices are currently overdue. I recommend sending a payment reminder to both contacts today.";
  if (RAGContext) {
    mockReply += `\n\n[Demo mode detected matches]: ${RAGContext}`;
  }

  return streamMockResponse(mockReply);
}

