import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function verifyStripeSignature(body: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.trim().startsWith('t='));
    const signaturePart = parts.find(p => p.trim().startsWith('v1='));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];

    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get('stripe-signature');
    const bodyText = await req.text();

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set. Rejecting unsigned request.');
      return NextResponse.json({ error: 'Webhook not configured.' }, { status: 403 });
    }

    const isValid = verifyStripeSignature(bodyText, sig, webhookSecret);
    if (!isValid) {
      console.warn('[webhook] Stripe signature verification failed.');
      return NextResponse.json({ error: 'Invalid stripe-signature.' }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const eventType = payload.type;

    if (eventType === 'checkout.session.completed') {
      const session = payload.data.object;
      const invoiceId = session.metadata?.invoice_id;

      if (invoiceId) {
        const supabase = await createClient();

        // Mark invoice as paid
        const { error } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', invoiceId);

        if (error) {
          console.error('[webhook] Failed to update invoice status:', error);
          return NextResponse.json({ error: 'Database update failed.' }, { status: 500 });
        }

        console.log(`[webhook] Invoice ${invoiceId} marked as paid successfully.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook] Process error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
