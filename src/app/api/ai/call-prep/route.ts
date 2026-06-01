import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

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

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { callId } = (await req.json()) as { callId: string };
    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch user's workspace to validate ownership
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // 1. Fetch Call details — RLS on the server client enforces access,
    //    but we also verify the call belongs to the user's workspace.
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (profile && profile.workspace_id && call.workspace_id !== profile.workspace_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workspaceId = call.workspace_id;
    const title = call.title;
    const attendees = call.attendees || [];

    // 2. Perform semantic RAG search to feed to Claude
    let ragContext = '';
    try {
      const extractor = await getEmbedder();
      const output = await extractor(title, { pooling: 'mean', normalize: true });
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
        ragContext += '\n--- RELEVANT KNOWLEDGE BASE ---\n';
        kbArticles.forEach((art: any) => {
          ragContext += `· [${art.category}] ${art.title}: ${art.content}\n`;
        });
      }

      if (projects && projects.length > 0) {
        ragContext += '\n--- RELEVANT PROJECTS ---\n';
        projects.forEach((p: any) => {
          ragContext += `· Project: ${p.name} | Client: ${p.client_name} | Status: ${p.status}\n`;
        });
      }
    } catch (ragErr) {
      console.error('[Call Prep RAG error]:', ragErr);
    }

    // 3. Check for API key and handle fallback if missing
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockSummary = `[Demo Mode] Briefing for meeting: "${title}". Key objectives include aligning deliverables, reviewing timeline milestones, and determining next action items for attendees (${attendees.join(', ') || 'No attendees listed'}).`;
      const mockChecklist = [
        `Review client portal notes and recent projects matching "${title}"`,
        `Draft presentation agenda and key discussion milestones`,
        `Establish timelines and follow-up responsibilities for attendees`
      ];

      const checklistObj = mockChecklist.map(task => ({ task, completed: false }));

      const { error: updateError } = await supabase
        .from('calls')
        .update({
          summary: mockSummary,
          prep_checklist: checklistObj,
          status: 'prepped'
        })
        .eq('id', callId);

      if (updateError) throw updateError;

      return NextResponse.json({
        summary: mockSummary,
        prepChecklist: checklistObj,
        status: 'prepped'
      });
    }

    // 4. Invoke Claude for JSON response
    const client = new Anthropic();
    const systemPrompt = `You are Hermes, the strategic AI assistant of Minerva OS. Your goal is to synthesize a professional call preparation briefing and a target checklist for an upcoming meeting.
    
Output MUST be valid JSON only, conforming to the exact schema:
{
  "summary": "Meeting objectives, target goals, client context, and warnings about risks.",
  "checklist": ["Actionable preparation task 1", "Actionable preparation task 2", "Actionable preparation task 3"]
}

Personality: direct, editorial, direct, professional. Never use em dashes.
Use the supplied Live Workspace Context to customize the brief and checklist items to match ongoing projects and knowledge base documents.`;

    const userMessage = `Meeting Title: ${title}
Attendees: ${attendees.join(', ') || 'None'}
Live Workspace Context: ${ragContext || 'None'}`;

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        }
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    const rawText = block.type === 'text' ? block.text : '';

    // Parse JSON
    let parsed: { summary: string; checklist: string[] };
    try {
      // Find start and end of JSON block in case Claude returned markdown wrappers
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      const jsonText = startIdx !== -1 && endIdx !== -1 ? rawText.substring(startIdx, endIdx + 1) : rawText;
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Claude JSON response. Raw response:', rawText);
      throw new Error('Invalid JSON payload returned by AI agent.');
    }

    const summary = parsed.summary;
    const checklistObj = (parsed.checklist || []).map(task => ({ task, completed: false }));

    // 5. Update Database Call record
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        summary: summary,
        prep_checklist: checklistObj,
        status: 'prepped'
      })
      .eq('id', callId);

    if (updateError) throw updateError;

    return NextResponse.json({
      summary,
      prepChecklist: checklistObj,
      status: 'prepped'
    });
  } catch (err) {
    console.error('[Call Prep API Error]:', err);
    return NextResponse.json({ error: 'Failed to generate prep briefing.' }, { status: 500 });
  }
}
