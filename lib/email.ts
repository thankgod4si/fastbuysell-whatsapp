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
  const formattedPrice = `€${Number(price).toLocaleString('de-DE')}`
  const car = `${carYear} ${carMake} ${carModel}`
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0 0 4px;color:#111827;font-size:18px;font-weight:700;">Fast Buy &amp; Sell</p>
  <p style="margin:0;color:#6b7280;font-size:13px;">European Vehicle Marketplace</p>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Hallo <strong>${name}</strong>,</p>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">wir haben Ihre Fahrzeugdaten erhalten und melden uns in Kürze mit einem Angebot bei Ihnen.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:24px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Ihr Fahrzeug</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;width:40%;">Fahrzeug</td>
          <td style="color:#111827;font-size:14px;font-weight:600;">${car}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;">Verkaufspreis</td>
          <td style="color:#16a34a;font-size:14px;font-weight:700;">${formattedPrice}</td>
        </tr>
      </table>
    </td></tr>
  </table>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
  <p style="margin:0 0 4px;color:#374151;font-size:15px;">Mit freundlichen Grüßen,</p>
  <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">Das Fast Buy &amp; Sell Team</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">Sie erhalten diese E-Mail, weil Sie über WhatsApp Interesse an einem Fahrzeugankauf gezeigt haben. Um sich abzumelden, antworten Sie mit &quot;Abmelden&quot;.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function buildLeadText({ name, carMake, carModel, carYear, price }: LeadEmailData) {
  const formattedPrice = `€${Number(price).toLocaleString('de-DE')}`
  return `Hallo ${name},

wir haben Ihre Fahrzeugdaten erhalten und melden uns in Kürze mit einem Angebot bei Ihnen.

Ihr Fahrzeug: ${carYear} ${carMake} ${carModel}
Verkaufspreis: ${formattedPrice}

Bei Fragen antworten Sie einfach auf diese E-Mail.

Mit freundlichen Grüßen,
Das Fast Buy & Sell Team

---
Sie erhalten diese E-Mail, weil Sie über WhatsApp Interesse gezeigt haben. Um sich abzumelden, antworten Sie mit "Abmelden".`
}

export async function sendLeadEmail(data: LeadEmailData) {
  return client(data.apiKey).emails.send({
    from: data.from || PLATFORM_FROM,
    to: data.to,
    ...(data.replyTo ? { replyTo: data.replyTo } : {}),
    subject: `Ihre Fahrzeuganfrage – ${data.carYear} ${data.carMake} ${data.carModel}`,
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
<html lang="de">
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
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">Sie erhalten diese E-Mail als Teil einer Geschäftskontaktaufnahme. Antworten Sie auf diese E-Mail, um direkt mit unserem Team in Kontakt zu treten.</p>
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
