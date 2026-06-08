import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, trackSend } from '@/lib/usage'

const INVALID_NUMBER_CODES = [131026, 131047, 100, 470]

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!contact) return NextResponse.json({ sent: 0, message: 'Queue empty' })

  if (contact.user_id) {
    const check = await checkCanSend(contact.user_id)
    if (!check.allowed) {
      // Skip this user's contact — mark as failed so cron moves on
      await supabase
        .from('contacts')
        .update({ status: 'blacklisted' })
        .eq('id', contact.id)
      return NextResponse.json({ sent: 0, skipped: contact.phone, reason: check.reason })
    }
  }

  let phoneNumberId: string | undefined
  if (contact.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wa_phone_number_id, wa_verified')
      .eq('id', contact.user_id)
      .single()
    if (profile?.wa_verified && profile.wa_phone_number_id) {
      phoneNumberId = profile.wa_phone_number_id
    }
  }

  const result = await sendInquiryTemplate(contact.phone, phoneNumberId)

  if (result.error) {
    const code = result.error.code
    if (INVALID_NUMBER_CODES.includes(code)) {
      await supabase
        .from('contacts')
        .update({ status: 'blacklisted' })
        .eq('id', contact.id)
      return NextResponse.json({ sent: 0, blacklisted: contact.phone, reason: result.error.message })
    }
    return NextResponse.json({ sent: 0, error: result.error.message })
  }

  const wamid: string | undefined = result.messages?.[0]?.id

  await Promise.all([
    supabase
      .from('contacts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', contact.id),
    createMessageLog({
      contactId: contact.id,
      channel: 'whatsapp',
      externalId: wamid,
      recipient: contact.phone,
      userId: contact.user_id,
    }),
    contact.user_id ? trackSend(contact.user_id) : Promise.resolve(),
  ])

  return NextResponse.json({ sent: 1, phone: contact.phone })
}
