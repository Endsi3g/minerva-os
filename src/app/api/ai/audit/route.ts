import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = (await req.json()) as { workspaceId: string };
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch all data for the workspace to build the audit context
    const [
      { data: projects },
      { data: tasks },
      { data: invoices },
      { data: timeEntries },
      { data: finances }
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('workspace_id', workspaceId),
      supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
      supabase.from('invoices').select('*').eq('workspace_id', workspaceId),
      supabase.from('time_entries').select('*').eq('workspace_id', workspaceId),
      supabase.from('finances').select('*').eq('workspace_id', workspaceId)
    ]);

    const activeProjects = (projects || []).filter(p => p.status === 'active');
    const completedProjects = (projects || []).filter(p => p.status === 'completed');
    const openTasks = (tasks || []).filter(t => t.status !== 'done');
    const overdueInvoices = (invoices || []).filter(i => i.status === 'overdue');
    const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
    const totalExpenses = (finances || []).filter(f => f.type === 'expense').reduce((sum, f) => sum + Number(f.amount), 0);
    const totalIncome = (finances || []).filter(f => f.type === 'income').reduce((sum, f) => sum + Number(f.amount), 0);
    const totalTimeLogged = (timeEntries || []).reduce((sum, e) => sum + Number(e.duration), 0) / 60; // hours

    // 2. Build mock audit report if Anthropic key is missing, utilizing the actual database counts
    if (!process.env.ANTHROPIC_API_KEY) {
      let healthScore = 95;
      const findings: any[] = [];

      if (overdueInvoices.length > 0) {
        healthScore -= 15;
        findings.push({
          title: 'Outstanding Client Receivables',
          description: `There are currently ${overdueInvoices.length} overdue invoices in this workspace.`,
          severity: 'high',
          impact: 'Constrains operational cashflow margins.'
        });
      }

      const today = new Date();
      const pastDueProjects = activeProjects.filter(p => new Date(p.due_date) < today);
      if (pastDueProjects.length > 0) {
        healthScore -= 10;
        findings.push({
          title: 'Timeline Slippage Warning',
          description: `${pastDueProjects.length} active projects are past their due dates, including "${pastDueProjects[0].name}".`,
          severity: 'high',
          impact: 'Risks client satisfaction and delays final project deliverable approval.'
        });
      }

      if (openTasks.length > 15) {
        healthScore -= 5;
        findings.push({
          title: 'High Team Operational Load',
          description: `There are ${openTasks.length} open/active tasks remaining in the project backlog.`,
          severity: 'medium',
          impact: 'May create delivery bottlenecks if tasks are not prioritized.'
        });
      }

      if (totalExpenses > totalIncome * 0.7 && totalIncome > 0) {
        healthScore -= 10;
        findings.push({
          title: 'Elevated Expense Ratios',
          description: `Operating expenses ($${totalExpenses.toFixed(0)}) have consumed over 70% of total invoice income.`,
          severity: 'medium',
          impact: 'Compresses net agency profitability.'
        });
      }

      let recommendations = 'Audit complete. ';
      if (healthScore < 80) {
        recommendations += 'Prioritize collecting outstanding invoice payments, restructure team capacity for past due milestones, and re-negotiate high operating costs.';
      } else {
        recommendations += 'Operational health is strong. Maintain the current pipeline execution, monitor task velocities, and prepare for scaling client volume.';
      }

      // Ensure healthScore stays between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));

      return NextResponse.json({
        healthScore,
        findings,
        recommendations
      });
    }

    // 3. Format audit data context for Claude
    const operationalContext = `
Active Projects: ${activeProjects.length}
Completed Projects: ${completedProjects.length}
Open Tasks Backlog: ${openTasks.length}
Overdue Invoices: ${overdueInvoices.length} (Total amount: $${overdueInvoices.reduce((s, i) => s + Number(i.amount), 0)})
Paid Invoices: ${paidInvoices.length}
Total Income MTD: $${totalIncome}
Total Expenses MTD: $${totalExpenses}
Total Client Time Tracked: ${totalTimeLogged.toFixed(1)} hours
`;

    // 4. Invoke Anthropic Claude
    const client = new Anthropic();
    const systemPrompt = `You are Hermes, the AI Strategic Auditor of Minerva OS. Your task is to evaluate the agency operational metrics and construct a comprehensive strategic audit.
    
Output MUST be valid JSON only, conforming to the exact schema:
{
  "healthScore": number, // an integer score from 0 to 100
  "findings": [
    {
      "title": "Title of the operational finding",
      "description": "Detailed description of the warning or risk.",
      "severity": "high" | "medium",
      "impact": "What is the strategic or margin impact of this finding?"
    }
  ],
  "recommendations": "Executive summary paragraph of recommended strategic adjustments."
}

Personality: direct, intelligent, analytical. Never use em dashes.`;

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1536,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        }
      ],
      messages: [{ role: 'user', content: `Workspace Operational Data: ${operationalContext}` }],
    });

    const block = response.content[0];
    const rawText = block.type === 'text' ? block.text : '';

    // Parse JSON
    let parsed: { healthScore: number; findings: any[]; recommendations: string };
    try {
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      const jsonText = startIdx !== -1 && endIdx !== -1 ? rawText.substring(startIdx, endIdx + 1) : rawText;
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Claude JSON response. Raw response:', rawText);
      throw new Error('Invalid JSON payload returned by AI auditor.');
    }

    return NextResponse.json({
      healthScore: Math.max(0, Math.min(100, parsed.healthScore || 100)),
      findings: parsed.findings || [],
      recommendations: parsed.recommendations
    });
  } catch (err: any) {
    console.error('[AI Audit API Error]:', err);
    return NextResponse.json({ error: 'Failed to run strategic audit: ' + err.message }, { status: 500 });
  }
}
