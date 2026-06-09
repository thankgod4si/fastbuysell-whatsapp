import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  // Must be authenticated
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, pack, amount, credits, receipt, note } = await request.json()

  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    // Telegram not configured — still succeed (payment request already saved to DB)
    return NextResponse.json({ sent: false, reason: 'Telegram not configured' })
  }

  const lines = [
    `💰 *New Payment Request*`,
    ``,
    `👤 *Name:* ${name}`,
    `📧 *Email:* ${email}`,
    `📦 *Pack:* ${pack} — ${credits.toLocaleString()} credits`,
    `💵 *Amount:* ₦${amount.toLocaleString()}`,
    note ? `📝 *Note:* ${note}` : null,
    ``,
    `🧾 [View Receipt](${receipt})`,
    ``,
    `➡️ Add credits via admin panel after verifying.`,
  ].filter(Boolean).join('\n')

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    chatId,
      text:       lines,
      parse_mode: 'Markdown',
    }),
  })

  const data = await res.json()
  if (!data.ok) {
    console.error('[billing/notify] Telegram error:', data.description)
    return NextResponse.json({ sent: false, error: data.description })
  }

  return NextResponse.json({ sent: true })
}
