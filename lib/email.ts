import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.EMAIL_FROM ?? 'Fast Buy & Sell <hello@fastbuyandsell.com>'

// ─── WhatsApp lead follow-up email (car-specific) ──────────────────────────

interface LeadEmailData {
  to: string
  name: string
  carMake: string
  carModel: string
  carYear: string
  price: string
}

function buildLeadHtml({ name, carMake, carModel, carYear, price }: LeadEmailData) {
  const formattedPrice = `€${Number(price).toLocaleString('de-DE')}`
  const car = `${carYear} ${carMake} ${carModel}`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:#16a34a;padding:32px 40px;">
  <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Fast Buy &amp; Sell</p>
  <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">European Vehicle Marketplace</p>
</td></tr>
<tr><td style="padding:36px 40px;">
  <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Hello <strong>${name}</strong>,</p>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Thank you for your interest in selling through <strong>Fast Buy &amp; Sell</strong>. We reviewed your submission and are ready to move forward.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:24px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Vehicle Submitted</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;width:45%;">Vehicle</td><td style="color:#111827;font-size:14px;font-weight:600;">${car}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;">Asking Price</td><td style="color:#16a34a;font-size:14px;font-weight:700;">${formattedPrice}</td></tr>
      </table>
    </td></tr>
  </table>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">A team member will contact you shortly. If you have questions, simply reply to this email.</p>
  <p style="margin:0 0 4px;color:#374151;font-size:15px;">Best regards,</p>
  <p style="margin:0;color:#111827;font-size:15px;font-weight:700;">The Fast Buy &amp; Sell Team</p>
</td></tr>
<tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;">
  <p style="margin:0;color:#9ca3af;font-size:12px;">You are receiving this because you expressed interest via WhatsApp. Reply &quot;Unsubscribe&quot; to opt out.</p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function sendLeadEmail(data: LeadEmailData) {
  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Re: Your ${data.carYear} ${data.carMake} ${data.carModel} — Fast Buy & Sell`,
    html: buildLeadHtml(data),
  })
}

// ─── Generic campaign email ─────────────────────────────────────────────────

interface CampaignEmailData {
  to: string
  name: string
  subject: string
  body: string
  replyTo: string
}

function buildCampaignHtml(name: string, body: string) {
  const personalized = body.replace(/\{\{name\}\}/g, name)
  const paragraphs = personalized
    .split('\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.7;">${p}</p>`)
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:#111827;padding:24px 40px;">
  <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Fast Buy &amp; Sell</p>
</td></tr>
<tr><td style="padding:36px 40px;">
  ${paragraphs}
</td></tr>
<tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;">
  <p style="margin:0;color:#9ca3af;font-size:12px;">You are receiving this email as part of an outreach campaign. Reply to this email to respond directly to our team.</p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function sendCampaignEmail({ to, name, subject, body, replyTo }: CampaignEmailData) {
  return resend.emails.send({
    from: FROM,
    to,
    replyTo: replyTo,
    subject,
    html: buildCampaignHtml(name, body),
  })
}
