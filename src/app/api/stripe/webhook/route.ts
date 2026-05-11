import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  // TODO: verify webhook signature and handle events
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  // switch (event.type) {
  //   case 'checkout.session.completed': { /* mark invoice as paid */ break; }
  //   case 'payment_intent.payment_failed': { /* notify agency */ break; }
  // }

  console.log('Stripe webhook received', body.slice(0, 80));

  return NextResponse.json({ received: true });
}
