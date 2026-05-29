import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { brief, clientCompany } = (await req.json()) as { brief: string; clientCompany?: string };
    if (!brief) {
      return NextResponse.json({ error: 'brief is required' }, { status: 400 });
    }

    const company = clientCompany || 'Client Partner';

    // 1. Check for API key and handle fallback if missing
    if (!process.env.ANTHROPIC_API_KEY) {
      const draftIntro = `Uprising Studio is pleased to submit this strategic partnership proposal to ${company}. Our goal is to address your core operational requirements by delivering custom, top-tier engineering and design solutions. This document details our planned execution, scope, and milestones.`;
      const draftScope = `Based on your brief: "${brief}", Uprising Studio will deliver:\n· Premium high-fidelity UI/UX design mockups in Figma\n· Component library structured for responsiveness and theme alignment\n· Complete assets handoff, documentation guidelines, and brand system assets`;
      const draftTimeline = `Project timeline (target 4-6 weeks):\n· Phase 1 (Week 1-2): Strategy alignment, discovery workshop, and interactive wireframes\n· Phase 2 (Week 3-4): Component design, high-fidelity layouts, and prototyping\n· Phase 3 (Week 5): Review iterations and refinement loops\n· Phase 4 (Week 6): Final assets handoff, guideline reports, and setup support`;
      const draftPricing = `Estimated Fee Structure:\n· Initial mobilization deposit: 50% ($7,500 USD)\n· Final deliverable sign-off: 50% ($7,500 USD)\n· Total Estimated Budget: $15,000 USD`;

      return NextResponse.json({
        intro: draftIntro,
        scope: draftScope,
        timeline: draftTimeline,
        pricing: draftPricing
      });
    }

    // 2. Invoke Anthropic Claude for JSON response
    const client = new Anthropic();
    const systemPrompt = `You are Hermes, the senior strategic proposal writer of Minerva OS. Your goal is to draft a professional project proposal based on a scoping brief.
    
Output MUST be valid JSON only, conforming to the exact schema:
{
  "intro": "A professional introductory paragraph establishing Uprising Studio's strategy for the client.",
  "scope": "Bullet points listing detailed, premium deliverables and scope of services.",
  "timeline": "Milestones timeline detailing project phases, weeks, and review schedules.",
  "pricing": "Structured fee breakdown, milestone payments, and deposit schedules."
}

Personality: direct, editorial, direct, professional. Never use em dashes.
Address the client company name if provided. Make the scope and timeline match the specific details of the scoping brief.`;

    const userMessage = `Scoping Brief: ${brief}
Client Company Name: ${company}`;

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1536,
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
    let parsed: { intro: string; scope: string; timeline: string; pricing: string };
    try {
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      const jsonText = startIdx !== -1 && endIdx !== -1 ? rawText.substring(startIdx, endIdx + 1) : rawText;
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Claude JSON proposal response. Raw response:', rawText);
      throw new Error('Invalid JSON payload returned by AI agent.');
    }

    return NextResponse.json({
      intro: parsed.intro || '',
      scope: parsed.scope || '',
      timeline: parsed.timeline || '',
      pricing: parsed.pricing || ''
    });
  } catch (err: any) {
    console.error('[AI Proposal Draft API Error]:', err);
    return NextResponse.json({ error: 'Failed to draft proposal: ' + err.message }, { status: 500 });
  }
}
