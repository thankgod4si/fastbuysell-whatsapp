import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireAdmin() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — list all number requests
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('number_requests')
    .select('*, profiles!number_requests_user_id_fkey(full_name, wa_phone_number)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.user_id as string))]
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(uid)
    if (u?.email) emailMap[uid] = u.email
  }

  return NextResponse.json((data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    email:        emailMap[r.user_id as string] ?? '',
    full_name:    (r.profiles as Record<string, string> | null)?.full_name ?? null,
    current_wa:   (r.profiles as Record<string, string> | null)?.wa_phone_number ?? null,
  })))
}

// POST — assign a number to a user
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { request_id, user_id, phone_number_id, phone_number, display_name } = await request.json()
  if (!request_id || !user_id || !phone_number_id || !phone_number) {
    return NextResponse.json({ error: 'request_id, user_id, phone_number_id, phone_number required' }, { status: 400 })
  }

  // Save to wa_numbers and update profile
  await supabase.from('wa_numbers').upsert({
    user_id, phone_number_id, phone_number,
    display_name: display_name ?? null,
    verified: true, is_default: true,
  }, { onConflict: 'phone_number_id' })

  await supabase.from('profiles').update({
    wa_phone_number_id: phone_number_id,
    wa_phone_number:    phone_number,
    wa_display_name:    display_name ?? null,
    wa_verified:        true,
    notification:       `Your WhatsApp number ${phone_number} is now active! You can start blasting.`,
  }).eq('id', user_id)

  await supabase.from('number_requests').update({ status: 'fulfilled' }).eq('id', request_id)

  // Notify user via Telegram (to admin chat, referencing user) + try WhatsApp
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (token && chatId) {
    const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(user_id)
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Number assigned!\n\n👤 ${u?.email}\n📱 ${phone_number}\n🆔 ${phone_number_id}\n\nUser has been notified in-app.`,
      }),
    }).catch(() => null)
  }

  return NextResponse.json({ success: true })
}

// PATCH — reject / update status
export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { request_id, status } = await request.json()
  await supabase.from('number_requests').update({ status }).eq('id', request_id)
  return NextResponse.json({ success: true })
}
