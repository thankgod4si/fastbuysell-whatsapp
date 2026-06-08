const BASE = 'https://api.twilio.com/2010-04-01/Accounts'

interface SmsConfig {
  accountSid?: string
  authToken?: string
  from?: string
}

function basicAuth(accountSid: string, authToken: string) {
  return 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
}

function resolveConfig(override?: SmsConfig) {
  return {
    accountSid: override?.accountSid || process.env.TWILIO_ACCOUNT_SID!,
    authToken: override?.authToken || process.env.TWILIO_AUTH_TOKEN!,
    from: override?.from || process.env.TWILIO_FROM_NUMBER!,
  }
}

export async function sendSms(to: string, body: string, config?: SmsConfig) {
  const { accountSid, authToken, from } = resolveConfig(config)

  const res = await fetch(`${BASE}/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })

  const data = await res.json()
  return { ok: res.ok, sid: data.sid as string | undefined, error: data.message as string | undefined }
}

export const DEFAULT_SMS_TEMPLATE =
  'Hi, this is Fast Buy & Sell – we buy used cars across Europe. ' +
  "Want a quick offer on your vehicle? Reply YES and we'll be in touch. " +
  'Reply STOP to opt out.'
