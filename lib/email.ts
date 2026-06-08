import { Resend } from 'resend'

const DEFAULT_RESEND = new Resend(process.env.RESEND_API_KEY!)
const PLATFORM_FROM = process.env.EMAIL_FROM ?? 'Fast Buy & Sell <hello@trysofi.co>'

function client(apiKey?: string) {
  return apiKey ? new Resend(apiKey) : DEFAULT_RESEND
}

// ─── WhatsApp lead follow-up email ─────────────────────────────────────────

interface LeadEmailData {
  to: string
  name: string
  carMake: string
  carModel: string
  carYear: string
  price: string
  replyTo?: string
  apiKey?: string
  from?: string
}

function buildLeadHtml({ name, carMake, carModel, carYear, price }: LeadEmailData) {
  const formattedPrice = `€${Number(price).toLocaleString('en-GB')}`
  const car = `${carYear} ${carMake} ${carModel}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0 0 4px;color:#111827;font-size:18px;font-weight:700;">Fast Buy &amp; Sell</p>
  <p style="margin:0;color:#6b7280;font-size:13px;">European Vehicle Marketplace</p>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Thanks for sharing your vehicle details with us. We've received your enquiry and our team will be in touch shortly with an offer.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:24px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Vehicle</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;width:40%;">Vehicle</td>
          <td style="color:#111827;font-size:14px;font-weight:600;">${car}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;">Asking Price</td>
          <td style="color:#16a34a;font-size:14px;font-weight:700;">${formattedPrice}</td>
        </tr>
      </table>
    </td></tr>
  </table>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">If you have any questions, just reply to this email and we'll get back to you.</p>
  <p style="margin:0 0 4px;color:#374151;font-size:15px;">Best regards,</p>
  <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">The Fast Buy &amp; Sell Team</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">You received this email because you expressed interest in selling your vehicle via WhatsApp. To unsubscribe, reply with &quot;Unsubscribe&quot;.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function buildLeadText({ name, carMake, carModel, carYear, price }: LeadEmailData) {
  const formattedPrice = `€${Number(price).toLocaleString('en-GB')}`
  return `Hi ${name},

Thanks for sharing your vehicle details with us. We've received your enquiry and our team will be in touch shortly with an offer.

Your Vehicle: ${carYear} ${carMake} ${carModel}
Asking Price: ${formattedPrice}

If you have any questions, just reply to this email.

Best regards,
The Fast Buy & Sell Team

---
You received this email because you expressed interest in selling your vehicle via WhatsApp. Reply "Unsubscribe" to opt out.`
}

export async function sendLeadEmail(data: LeadEmailData) {
  return client(data.apiKey).emails.send({
    from: data.from || PLATFORM_FROM,
    to: data.to,
    ...(data.replyTo ? { replyTo: data.replyTo } : {}),
    subject: `Your vehicle enquiry – ${data.carYear} ${data.carMake} ${data.carModel}`,
    html: buildLeadHtml(data),
    text: buildLeadText(data),
  })
}

// ─── Generic campaign email ─────────────────────────────────────────────────

interface CampaignEmailData {
  to: string
  name: string
  subject: string
  body: string
  replyTo: string
  apiKey?: string
  from?: string
}

function buildCampaignHtml(name: string, body: string) {
  const personalized = body.replace(/\{\{name\}\}/g, name)
  const paragraphs = personalized
    .split('\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.7;">${p}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0;color:#111827;font-size:18px;font-weight:700;">Fast Buy &amp; Sell</p>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  ${paragraphs}
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">You received this email as part of a business outreach. Reply to this email to get in touch with our team directly.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function buildCampaignText(name: string, body: string) {
  return body.replace(/\{\{name\}\}/g, name)
}

export async function sendCampaignEmail({ to, name, subject, body, replyTo, apiKey, from }: CampaignEmailData) {
  return client(apiKey).emails.send({
    from: from || PLATFORM_FROM,
    to,
    replyTo,
    subject,
    html: buildCampaignHtml(name, body),
    text: buildCampaignText(name, body),
  })
}
