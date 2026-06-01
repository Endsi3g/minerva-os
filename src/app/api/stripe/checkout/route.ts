import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, amount, successUrl, cancelUrl } = await req.json() as {
      invoiceId: string;
      amount: number;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch invoice details and client email
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, client:clients(email, company)')
      .eq('id', invoiceId)
      .single();

    const clientEmail = (invoice as any)?.client?.email || '';
    const companyName = (invoice as any)?.client?.company || 'Client';

    const origin = req.nextUrl.origin;
    const finalSuccessUrl = origin + (successUrl || '/app/billing?success=true');
    const finalCancelUrl = origin + (cancelUrl || '/app/billing?cancelled=true');

    let sessionUrl = `https://checkout.stripe.com/pay/mock_${invoiceId}`;
    let sessionId = `cs_mock_${invoiceId}`;

    if (process.env.STRIPE_SECRET_KEY) {
      // Use native fetch to create Stripe Checkout session (avoiding npm package)
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `Invoice ${invoice?.invoice_number || invoiceId} - ${companyName}`,
          'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'success_url': finalSuccessUrl,
          'cancel_url': finalCancelUrl,
          'customer_email': clientEmail,
          'metadata[invoice_id]': invoiceId
        }).toString()
      });

      const stripeSession = await stripeRes.json();
      if (stripeSession.url) {
        sessionUrl = stripeSession.url;
        sessionId = stripeSession.id;
      } else {
        console.error('[Stripe API Error]:', stripeSession);
        return NextResponse.json({ error: 'Payment session creation failed.' }, { status: 500 });
      }
    }

    return NextResponse.json({ url: sessionUrl, sessionId });
  } catch (err) {
    console.error('[Stripe Checkout Handler Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
