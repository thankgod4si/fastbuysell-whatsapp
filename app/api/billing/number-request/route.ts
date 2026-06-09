import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receipt_url, note } = await request.json()
  if (!receipt_url) return NextResponse.json({ error: 'receipt_url required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  await supabase.from('number_requests').insert({
    user_id:     user.id,
    amount_naira: 15000,
    receipt_url,
    note:        note ?? null,
    status:      'pending',
  })

  // Telegram notification
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (token && chatId) {
    const lines = [
      `📱 *New Number Request*`,
      ``,
      `👤 *Name:* ${profile?.full_name ?? ''}`,
      `📧 *Email:* ${user.email}`,
      `💵 *Amount:* ₦15,000`,
      note ? `📝 *Note:* ${note}` : null,
      ``,
      `🧾 [View Receipt](${receipt_url})`,
      ``,
      `➡️ Go to Admin → Numbers to assign their number.`,
    ].filter(Boolean).join('\n')

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'Markdown' }),
    }).catch(() => null)
  }

  return NextResponse.json({ success: true })
}
