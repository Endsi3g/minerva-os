import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // Validate webhook secret if configured (recommended for production)
    const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.get('authorization');
      const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (provided !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace_id query parameter' },
        { status: 400 }
      );
    }

    // Verify the workspace exists before inserting any data
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 });
    }

    const payload = await req.json();

    // 1. Flexible Key Mapping Parser
    const company =
      payload.company ||
      payload.company_name ||
      payload.organization ||
      payload.org ||
      'Unknown Company';

    const contact =
      payload.contact ||
      payload.name ||
      payload.full_name ||
      payload.fullname ||
      [payload.first_name, payload.last_name].filter(Boolean).join(' ') ||
      'Unknown Contact';

    const email = payload.email || payload.mail || payload.contact_email || '';
    
    // Parse value (budget)
    const rawValue = payload.value || payload.budget || payload.amount || payload.price || 0;
    const value = parseFloat(rawValue) || 0;

    // Build notes from extra fields
    const notesInput = payload.notes || payload.description || payload.message || payload.comments || '';
    
    // Gather all fields not mapped above to append to notes
    const mappedKeys = [
      'company', 'company_name', 'organization', 'org',
      'contact', 'name', 'full_name', 'fullname', 'first_name', 'last_name',
      'email', 'mail', 'contact_email', 'value', 'budget', 'amount', 'price',
      'notes', 'description', 'message', 'comments'
    ];

    const extraDetails: string[] = [];
    for (const [key, val] of Object.entries(payload)) {
      if (!mappedKeys.includes(key)) {
        extraDetails.push(`${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
      }
    }

    let finalNotes = notesInput;
    if (extraDetails.length > 0) {
      finalNotes += (finalNotes ? '\n\n' : '') + '[Additional Form Submission Details]:\n' + extraDetails.join('\n');
    }

    // 2. AI Lead Qualification & Email Drafting
    let aiScore = 70;
    let aiSummary = '';
    let emailSubject = '';
    let emailBody = '';

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic();
        const systemPrompt = `You are Hermes, the AI Lead Strategist of Uprising Studio.
Your task is to analyze the incoming lead information and construct a strategic lead score (0-100), a short qualification summary, and a personalized follow-up email draft.

The strategic lead score (0-100) must reflect the lead value, organization description, and the relevance of their message to Uprising Studio.

Output MUST be valid JSON only, conforming to the exact schema:
{
  "score": number, // integer 0-100
  "summary": "Brief 1-2 sentence tactical assessment of the lead fit and budget.",
  "emailSubject": "Draft subject line for a personalized follow-up email",
  "emailBody": "Personalized, editorial, high-end follow-up email body text. Use professional and premium tone. Refer to details in the submission."
}

Rules:
- Never use em dashes (—). Use commas, periods, or middle dots (·) instead.
- Tone: Premium, Direct, Editorial Noir.
- Output ONLY valid JSON. No conversational wrapper text.`;

        const leadInfoContext = `
Company: ${company}
Contact Name: ${contact}
Email: ${email}
Estimated Budget/Value: $${value}
Lead Notes: ${finalNotes}
`;

        const response = await client.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: [
            {
              type: 'text',
              text: systemPrompt,
            }
          ],
          messages: [{ role: 'user', content: `Analyze this lead:\n${leadInfoContext}` }],
        });

        const block = response.content[0];
        const rawText = block.type === 'text' ? block.text : '';

        const startIdx = rawText.indexOf('{');
        const endIdx = rawText.lastIndexOf('}');
        const jsonText = startIdx !== -1 && endIdx !== -1 ? rawText.substring(startIdx, endIdx + 1) : rawText;
        const parsed = JSON.parse(jsonText);

        aiScore = Math.max(0, Math.min(100, parsed.score || 70));
        aiSummary = parsed.summary || 'Lead received and logged for review.';
        emailSubject = parsed.emailSubject || `Inquiry from Uprising Studio — ${company}`;
        emailBody = parsed.emailBody || '';
      } catch (aiErr) {
        console.error('[Lead AI Parser Error]:', aiErr);
        // Fall back to local mock generators below
      }
    }

    // Heuristics Fallback (if AI Key missing or failed)
    if (!aiSummary || !emailBody) {
      aiScore = value >= 30000 ? 90 : value >= 15000 ? 80 : value > 0 ? 65 : 50;
      aiSummary = `${contact} from ${company} submitted an external lead with an estimated value of $${value}. Budget fit is ${value >= 20000 ? 'excellent' : 'moderate'}.`;
      emailSubject = `Re: Partnership Inquiry — ${company}`;
      emailBody = `Hello ${contact},\n\nThank you for reaching out to Uprising Studio. We have received your inquiry regarding ${company} and your project value of $${value}.\n\nOur team is currently reviewing the details you shared: "${notesInput || 'No message provided.'}". We would love to schedule a brief 15-minute call to discuss how we can partner on your strategic design and engineering goals.\n\nCould you please let us know your availability for a call later this week?\n\nBest regards,\n\nOlivier G.\nUprising Studio`;
    }

    // 3. Database Insertion Sequence
    // Step A: Insert Client (with status 'lead')
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        company,
        contact,
        email,
        status: 'lead',
        monthly_value: 0,
      })
      .select()
      .single();

    if (clientError) {
      console.error('[Lead Webhook Client Error]:', clientError);
      // If table doesn't exist, we proceed in mock fallback mode to facilitate testing
      if (clientError.message.includes('schema cache') || clientError.message.includes('does not exist') || clientError.code === 'PGRST205') {
        console.warn('[Lead Webhook] Supabase clients table not found. Returning AI response mock data for testing.');
        return NextResponse.json({
          success: true,
          mocked: true,
          dealId: 'mock-deal-id',
          clientId: 'mock-client-id',
          draftId: 'mock-draft-id',
          score: aiScore,
          summary: aiSummary,
          emailSubject,
          emailBody,
          warning: 'Database tables missing. Running in mock fallback mode.'
        });
      }
      return NextResponse.json({ error: 'Failed to create client record.' }, { status: 500 });
    }

    // Step B: Insert Deal
    const { data: dealData, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        workspace_id: workspaceId,
        company,
        contact,
        email,
        value,
        stage: 'new_lead',
        notes: `${finalNotes}\n\n[Hermes AI Score: ${aiScore}/100]\n[Strategic Qualification]: ${aiSummary}`,
        last_contact: new Date().toISOString(),
      })
      .select()
      .single();

    if (dealError) {
      console.error('[Lead Webhook Deal Error]:', dealError);
      return NextResponse.json({ error: 'Failed to create deal record.' }, { status: 500 });
    }

    // Step C: Insert Email Draft
    const { data: draftData, error: draftError } = await supabaseAdmin
      .from('email_drafts')
      .insert({
        workspace_id: workspaceId,
        client_id: clientData.id,
        subject: emailSubject,
        body: emailBody,
        recipient_email: email,
        status: 'draft',
        source: 'AI CRM Agent',
      })
      .select()
      .single();

    if (draftError) {
      console.error('[Lead Webhook Email Draft Error]:', draftError);
      return NextResponse.json({ error: 'Failed to create email draft record.' }, { status: 500 });
    }

    // Log Activity
    await supabaseAdmin.from('activity').insert({
      workspace_id: workspaceId,
      username: 'Hermes AI',
      action_name: 'captured lead',
      target_name: `${company} (${contact})`,
      entity_type: 'deal',
    });

    return NextResponse.json({
      success: true,
      dealId: dealData.id,
      clientId: clientData.id,
      draftId: draftData.id,
      score: aiScore,
      summary: aiSummary,
    });
  } catch (err) {
    console.error('[Lead API Route Process Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
