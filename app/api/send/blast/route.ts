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

  // Only blast contacts belonging to this user
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')
    .eq('user_id', user.id)

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No pending contacts' })
  }

  // Cap blast at available credits so user can't overshoot
  const available = check.credits ?? 0
  const toSend = contacts.slice(0, available > 0 ? available : contacts.length)

  let sent = 0
  const failed: string[] = []

  for (const contact of toSend) {
    console.log(`[blast] sending to ${contact.phone}`)
    const result = await sendInquiryTemplate(contact.phone)

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
      deductCredits(user.id, sent),
    ])
  }

  return NextResponse.json({ sent, failed })
}
