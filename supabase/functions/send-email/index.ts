import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic auth check using service role or custom token
    const authHeader = req.headers.get('Authorization')
    const secretKey = Deno.env.get("EMAIL_SYSTEM_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { to, subject, html, type, payload } = await req.json()

    let recipient = to
    let emailSubject = subject
    let emailHtml = html

    // If template type is provided, construct the email details
    if (type) {
      if (type === 'team_invitation') {
        recipient = payload.email
        emailSubject = `You have been invited to join Minerva OS`
        const inviteLink = `${Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000"}/invite/${payload.token}`
        emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>You have been invited!</h2>
            <p>You've been invited to join a workspace on Minerva OS.</p>
            <p>Click the link below to accept the invitation and join your team:</p>
            <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #7FA38A; color: #0A0D14; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a></p>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">If the button doesn't work, copy and paste this URL into your browser: <br>${inviteLink}</p>
          </div>
        `
      } else if (type === 'welcome_email') {
        recipient = payload.email
        emailSubject = `Welcome to Minerva OS!`
        emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Welcome to Minerva OS, ${payload.name}!</h2>
            <p>Thank you for completing the onboarding process. Your workspace is now fully set up and ready to go.</p>
            <p>You can manage your pipeline, invite your team, organize projects, track tasks, and send invoices all in one elegant, strategic operating system.</p>
            <p><a href="${Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000"}/app/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7FA38A; color: #0A0D14; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a></p>
          </div>
        `
      } else if (type === 'invoice_sent') {
        recipient = payload.client_email
        emailSubject = `New Invoice ${payload.invoice_number} from Minerva OS`
        emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>New Invoice Received</h2>
            <p>Hello,</p>
            <p>You have received a new invoice from your agency.</p>
            <p><strong>Invoice Number:</strong> ${payload.invoice_number}</p>
            <p><strong>Amount Due:</strong> $${payload.amount}</p>
            <p><strong>Due Date:</strong> ${payload.due_date}</p>
            <p>Please review and complete the payment.</p>
          </div>
        `
      } else if (type === 'risk_alert') {
        recipient = payload.owner_email
        emailSubject = `[CRITICAL] High Severity Risk Flag: ${payload.project_name}`
        emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-left: 4px solid #A86A6A;">
            <h2 style="color: #A86A6A;">High Severity Risk Flag Detected</h2>
            <p><strong>Project:</strong> ${payload.project_name}</p>
            <p><strong>Risk Type:</strong> ${payload.risk_type}</p>
            <p><strong>Summary:</strong> ${payload.summary}</p>
            <p><strong>Details:</strong> ${payload.details}</p>
            <p>Please review this issue in the Project Dashboard to mitigate immediately.</p>
          </div>
        `
      } else if (type === 'approval_request') {
        recipient = payload.client_email
        emailSubject = `Approval Required: ${payload.approval_name}`
        const portalLink = `${Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000"}/portal/${payload.client_token}`
        emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Approval Request</h2>
            <p>Hello,</p>
            <p>Your review is requested for the following deliverable:</p>
            <p><strong>Item:</strong> ${payload.approval_name}</p>
            <p><strong>Type:</strong> ${payload.approval_type}</p>
            <p>Please click the button below to view and approve it in the secure Client Portal:</p>
            <p><a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background-color: #7FA38A; color: #0A0D14; text-decoration: none; border-radius: 8px; font-weight: bold;">View Deliverable</a></p>
          </div>
        `
      }
    }

    if (!recipient) {
      throw new Error("Recipient ('to') is required.")
    }

    const emailResponse = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "Minerva OS <onboarding@resend.dev>",
      to: recipient,
      subject: emailSubject || "Notification from Minerva OS",
      html: emailHtml || `<p>No content provided</p>`,
    })

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
