const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'portal@uprising.studio';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Uprising Studio';

interface EmailResult { ok: boolean; error?: string }

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.log(`[portal-email] No RESEND_API_KEY — skipping email to ${to}: ${subject}`);
    return { ok: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[portal-email] Resend error: ${err}`);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e: any) {
    console.warn('[portal-email] Resend fetch failed:', e);
    return { ok: false, error: String(e) };
  }
}

export interface DigestNotification {
  title: string;
  message: string;
  targetPath?: string;
  createdAt: string;
}

export async function sendPortalDigest(
  clientEmail: string,
  clientName: string,
  notifications: DigestNotification[],
  workspaceName: string,
  portalUrl: string,
): Promise<EmailResult> {
  const subject = `Your ${workspaceName} portal digest`;
  const items = notifications.map(n => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1e2333;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#F5F1E8;">${n.title}</p>
        <p style="margin:0;font-size:12px;color:#8A9099;">${n.message}</p>
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0A0D14;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7FA38A;margin:0 0 16px;">${workspaceName}</p>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#F5F1E8;">${clientName}</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#8A9099;">Here is your latest activity digest from your client portal.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e2333;">
        ${items}
      </table>
      <div style="margin-top:28px;text-align:center;">
        <a href="${portalUrl}" style="display:inline-block;padding:10px 24px;background-color:#F5F1E8;color:#0A0D14;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;">View Portal</a>
      </div>
      <p style="margin:28px 0 0;font-size:11px;color:#8A9099;text-align:center;">Powered by Minerva OS · ${workspaceName}</p>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail(clientEmail, subject, html);
}

export async function sendInstantNotification(
  clientEmail: string,
  title: string,
  message: string,
  targetUrl: string,
): Promise<EmailResult> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0A0D14;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;padding:0 20px;">
    <tr><td style="background-color:#111522;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
      <h2 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#F5F1E8;">${title}</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#8A9099;">${message}</p>
      <a href="${targetUrl}" style="display:inline-block;padding:10px 24px;background-color:#F5F1E8;color:#0A0D14;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;">View in Portal</a>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail(clientEmail, title, html);
}
