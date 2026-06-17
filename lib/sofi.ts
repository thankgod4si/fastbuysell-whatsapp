/**
 * lib/sofi.ts
 * 
 * Sofi (trysofi.co) payment integration for Echoes.
 * 
 * Sofi generates a payment link/checkout URL. The customer
 * pays, Sofi fires a webhook to /api/webhooks/sofi, which
 * confirms the booking and sends a WhatsApp confirmation.
 * 
 * If you have a dedicated virtual account API from Sofi,
 * swap generatePaymentLink() with that endpoint call.
 */

const SOFI_BASE_URL  = process.env.SOFI_API_BASE_URL ?? 'https://api.trysofi.co'
const SOFI_API_KEY   = process.env.SOFI_API_KEY!
const SOFI_WEBHOOK_SECRET = process.env.SOFI_WEBHOOK_SECRET!

export interface SofiPaymentPayload {
  amount: number              // in smallest currency unit (kobo for NGN, cents for EUR)
  currency: string            // 'NGN' | 'EUR' | 'USD'
  reference: string           // unique, we generate this
  customer_phone: string
  customer_name: string
  description: string
  metadata: {
    booking_session_id?: string
    business_id?: string
    service_name?: string
    booking_id?: string
    [key: string]: string | undefined
  }
  callback_url: string        // where Sofi sends the payment webhook
  redirect_url?: string       // optional: redirect user after payment
}

export interface SofiPaymentResponse {
  success: boolean
  payment_link?: string
  virtual_account?: {
    bank_name: string
    account_number: string
    account_name: string
    expires_at: string
  }
  reference: string
  error?: string
}

/**
 * Generate a unique payment reference for a booking session
 */
export function generateReference(sessionId: string): string {
  const short = sessionId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `ECHOES-${short}-${Date.now()}`
}

/**
 * Call Sofi API to create a payment request.
 * Returns a payment link OR virtual bank account details.
 * 
 * NOTE: Update the endpoint path below to match your actual Sofi API docs.
 * Common patterns: POST /v1/payments, POST /v1/checkout, POST /v1/virtual-accounts
 */
export async function generatePaymentLink(payload: SofiPaymentPayload): Promise<SofiPaymentResponse> {
  try {
    const res = await fetch(`${SOFI_BASE_URL}/v1/payments/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOFI_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Source': 'echoes-platform',
      },
      body: JSON.stringify({
        amount:       payload.amount,
        currency:     payload.currency,
        reference:    payload.reference,
        customer:     { phone: payload.customer_phone, name: payload.customer_name },
        description:  payload.description,
        metadata:     payload.metadata,
        callback_url: payload.callback_url,
        redirect_url: payload.redirect_url,
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[sofi] Payment creation failed:', data)
      return { success: false, reference: payload.reference, error: data.error ?? 'Payment creation failed' }
    }

    return {
      success:         true,
      payment_link:    data.payment_link ?? data.checkout_url ?? data.url,
      virtual_account: data.virtual_account,
      reference:       data.reference ?? payload.reference,
    }
  } catch (err) {
    console.error('[sofi] Network error:', err)
    return { success: false, reference: payload.reference, error: 'Network error connecting to payment provider' }
  }
}

/**
 * Verify a Sofi webhook signature to prevent fake payment notifications.
 * Sofi typically uses HMAC-SHA256 of the raw body with your webhook secret.
 * Adjust the header name and algo to match Sofi's actual docs.
 */
export async function verifySofiWebhook(rawBody: string, headers: Headers): Promise<boolean> {
  if (!SOFI_WEBHOOK_SECRET) {
    console.warn('[sofi] SOFI_WEBHOOK_SECRET not set — skipping signature verification in dev')
    return process.env.NODE_ENV === 'development'
  }

  const { createHmac } = await import('crypto')
  const signature = headers.get('x-sofi-signature') ?? headers.get('x-webhook-signature') ?? ''
  const expected  = createHmac('sha256', SOFI_WEBHOOK_SECRET).update(rawBody).digest('hex')
  const prefix    = 'sha256='

  const incoming = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature

  // Timing-safe comparison
  const { timingSafeEqual } = await import('crypto')
  try {
    return timingSafeEqual(Buffer.from(incoming, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

/**
 * Format payment message to send to customer via WhatsApp.
 * Adjust the message template to match Sofi's payment link format.
 */
export function formatPaymentMessage(params: {
  customerName: string
  serviceName: string
  amount: number
  currency: string
  appointmentDate: string
  appointmentTime: string
  paymentLink?: string
  virtualAccount?: SofiPaymentResponse['virtual_account']
  businessName: string
}): string {
  const { customerName, serviceName, amount, currency, appointmentDate, appointmentTime, paymentLink, virtualAccount, businessName } = params
  const sym: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
  const amountFormatted = `${sym[currency] ?? currency}${amount.toLocaleString()}`

  let paymentInfo = ''
  if (virtualAccount) {
    paymentInfo = `\n\n💳 *Pay via Bank Transfer:*\nBank: ${virtualAccount.bank_name}\nAccount: ${virtualAccount.account_number}\nName: ${virtualAccount.account_name}\nExpires: ${virtualAccount.expires_at}`
  } else if (paymentLink) {
    paymentInfo = `\n\n💳 *Pay here:* ${paymentLink}`
  }

  return `Hi ${customerName}! 🎉\n\nYour booking at *${businessName}* is almost confirmed:\n\n📋 Service: ${serviceName}\n📅 Date: ${appointmentDate}\n🕐 Time: ${appointmentTime}\n💰 Amount: ${amountFormatted}${paymentInfo}\n\nOnce payment is received, you'll get an instant confirmation. Questions? Just reply here! 😊`
}
