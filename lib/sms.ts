const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms'

interface SmsConfig {
  apiKey?: string
  sender?: string
}

function resolveConfig(override?: SmsConfig) {
  return {
    apiKey: override?.apiKey || process.env.BREVO_API_KEY!,
    sender: override?.sender || process.env.BREVO_SMS_SENDER || 'FastBuySell',
  }
}

export async function sendSms(to: string, content: string, config?: SmsConfig) {
  const { apiKey, sender } = resolveConfig(config)

  const res = await fetch(BREVO_SMS_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sender, recipient: to, content }),
  })

  const data = await res.json()
  return {
    ok: res.ok,
    messageId: data.messageId as string | undefined,
    error: data.message as string | undefined,
  }
}

export const DEFAULT_SMS_TEMPLATE =
  'Hi, this is Fast Buy & Sell – we buy used cars across Europe. ' +
  "Want a quick offer on your vehicle? Reply YES and we'll be in touch. " +
  'Reply STOP to opt out.'
