import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MODEL = 'claude-sonnet-4-6';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mockSummary(clientName: string): string {
  return `This month has been productive for ${clientName}. Your brand identity project is progressing well with key deliverables ready for review. One invoice is outstanding and a proposal is awaiting your signature. The team is on track for the scheduled milestones.`;
}

export async function POST(request: Request) {
  try {
    const { token, data: portalData } = await request.json();

    if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { client_id: clientId, workspace_id: workspaceId } = authResult.tokenData!;
    const month = currentMonth();
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data: cached } = await supabaseAdmin
          .from('portal_summaries')
          .select('summary, created_at')
          .eq('client_id', clientId)
          .eq('month', month)
          .maybeSingle();

        if (cached) {
          return NextResponse.json({ summary: cached.summary, generatedAt: cached.created_at, cached: true });
        }
      } catch (e) {
        console.warn('Supabase summary cache check failed:', e);
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      const clientName = portalData?.client?.company || 'your team';
      return NextResponse.json({ summary: mockSummary(clientName), generatedAt: new Date().toISOString(), cached: false });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contextLines = [
      `Client: ${portalData?.client?.company || 'Client'}`,
      `Active projects: ${portalData?.projects?.filter((p: any) => p.status === 'active').length || 0}`,
      `Pending approvals: ${portalData?.approvals?.filter((a: any) => a.status === 'pending').length || 0}`,
      `Outstanding invoices: $${portalData?.invoices?.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.amount || 0), 0) || 0}`,
      `Unsigned proposals: ${portalData?.proposals?.filter((p: any) => p.status === 'sent').length || 0}`,
    ].join('\n');

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [{
        type: 'text',
        text: 'You are writing a concise, professional monthly executive summary for a client portal. Write 2-3 sentences in a warm but professional tone. Focus on progress, key actions needed, and momentum. No bullet points.',
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{ role: 'user', content: `Write the monthly summary for ${month} based on:\n${contextLines}` }],
    });

    const summary = msg.content[0].type === 'text' ? msg.content[0].text : mockSummary(portalData?.client?.company || 'Client');
    const generatedAt = new Date().toISOString();

    if (hasCredentials) {
      try {
        await supabaseAdmin.from('portal_summaries').upsert({
          workspace_id: workspaceId,
          client_id: clientId,
          month,
          summary,
        }, { onConflict: 'client_id,month' });
      } catch (e) {
        console.warn('Supabase summary cache write failed:', e);
      }
    }

    return NextResponse.json({ summary, generatedAt, cached: false });
  } catch (err: any) {
    console.error('Portal summary error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
