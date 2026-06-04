import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { requireAuth } from '@/lib/auth/requireAuth';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  const { title, clientName, studioName, totalAmount, sections, date } = await req.json() as {
    title: string;
    clientName: string;
    studioName?: string;
    totalAmount: number;
    sections: Array<{ type: string; content: string }>;
    date?: string;
  };

  if (!title || !sections) {
    return NextResponse.json({ error: 'title and sections required' }, { status: 400 });
  }

  const docDate = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const element = createElement(ProposalDocument, {
    title,
    clientName: clientName || 'Client',
    studioName: studioName || 'Uprising Studio',
    totalAmount: totalAmount || 0,
    sections,
    date: docDate,
  });

  const buffer = await renderToBuffer(element);

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const filename = `proposal-${slug}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
