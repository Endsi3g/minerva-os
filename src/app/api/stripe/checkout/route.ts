import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { invoiceId, amount, clientEmail } = await req.json() as {
    invoiceId: string;
    amount: number;
    currency: string;
    clientEmail: string;
  };

  if (!invoiceId || !amount || !clientEmail) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // TODO: initialize Stripe client and create real checkout session
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({ ... });

  const mockSessionUrl = `https://checkout.stripe.com/pay/mock_${invoiceId}`;

  return NextResponse.json({ url: mockSessionUrl, sessionId: `cs_mock_${invoiceId}` });
}
