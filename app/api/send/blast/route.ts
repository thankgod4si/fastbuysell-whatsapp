export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { checkCanSend, deductCredits, trackSend } from '@/lib/usage'

export async function POST() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await checkCanSend(user.id)
  if (!check.allowed) {
    return NextResponse.json({
      error: check.reason,
      code: check.status === 'suspended' ? 'account_suspended' : 'no_credits',
    }, { status: 403 })
  }

  // Resolve user's own WA number — no platform fallback
  let userPhoneId: string | undefined
  const { data: waNum } = await supabase
    .from('wa_numbers')
    .select('phone_number_id')
    .eq('user_id', user.id)
    .eq('verified', true)
    .eq('is_default', true)
    .single()
  if (waNum?.phone_number_id) {
    userPhoneId = waNum.phone_number_id
  } else {
    const { data: prof } = await supabase
      .from('profiles').select('wa_phone_number_id, wa_verified').eq('id', user.id).single()
    if (prof?.wa_verified && prof.wa_phone_number_id) userPhoneId = prof.wa_phone_number_id
  }
  if (!userPhoneId) {
    return NextResponse.json({
      error: 'No WhatsApp number configured. Go to Settings to add and verify your number before blasting.',
      code: 'wa_number_not_configured',
    }, { status: 403 })
  }

  // Only blast contacts belonging to this user
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')
    .eq('user_id', user.id)

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No pending contacts' })
  }

  // Cap blast at available trial sends + paid credits. Active users can send all pending contacts.
  const available = check.status === 'active'
    ? contacts.length
    : Math.max(0, (check.remaining ?? 0) + (check.credits ?? 0))
  const toSend = contacts.slice(0, Math.min(available, contacts.length))

  let sent = 0
  const failed: string[] = []

  for (const contact of toSend) {
    console.log(`[blast] sending to ${contact.phone}`)
    const result = await sendInquiryTemplate(contact.phone, userPhoneId)

    if (!result.error) {
      await supabase
        .from('contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      sent++
    } else {
      console.error(`[blast] failed ${contact.phone}:`, JSON.stringify(result.error))
      failed.push(contact.phone)
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  if (sent > 0) {
    await Promise.all([
      trackSend(user.id, sent),
      (check.remaining ?? 0) <= 0 && check.credits && check.credits > 0 ? deductCredits(user.id, sent) : Promise.resolve(),
    ])
  }

  return NextResponse.json({ sent, failed })
}
