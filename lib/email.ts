import { Resend } from 'resend'

const PLATFORM_FROM = process.env.EMAIL_FROM ?? 'Fast Buy & Sell <hello@trysofi.co>'

function client(apiKey?: string) {
  return new Resend(apiKey ?? process.env.RESEND_API_KEY!)
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
  return `Hi ${name},

Thanks for sharing your vehicle details with us. We've received your enquiry and our team will be in touch shortly with an offer.

Your Vehicle: ${car}
Asking Price: ${formattedPrice}

If you have any questions, just reply to this email.

Best regards,
The Team`
}

function buildLeadText({ name, carMake, carModel, carYear, price }: LeadEmailData) {
  const formattedPrice = `€${Number(price).toLocaleString('en-GB')}`
  return `Hi ${name},

Thanks for sharing your vehicle details with us. We've received your enquiry and our team will be in touch shortly with an offer.

Your Vehicle: ${carYear} ${carMake} ${carModel}
Asking Price: ${formattedPrice}

If you have any questions, just reply to this email.

Best regards,
The Team`
}

export async function sendLeadEmail(data: LeadEmailData) {
  return client(data.apiKey).emails.send({
    from: data.from || PLATFORM_FROM,
    to: data.to,
    ...(data.replyTo ? { replyTo: data.replyTo } : {}),
    subject: `Your vehicle enquiry – ${data.carYear} ${data.carMake} ${data.carModel}`,
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
  return personalized
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
    text: buildCampaignText(name, body),
  })
}
