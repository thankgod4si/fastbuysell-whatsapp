import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, trackSend } from '@/lib/usage'

export async function POST(request: Request) {
  const { contactId } = await request.json()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  if (contact.status !== 'pending') {
    return NextResponse.json({ error: 'Message already sent to this contact' }, { status: 400 })
  }

  if (contact.user_id) {
    const check = await checkCanSend(contact.user_id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
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
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  const wamid: string | undefined = result.messages?.[0]?.id

  await Promise.all([
    supabase
      .from('contacts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', contactId),
    createMessageLog({
      contactId,
      channel: 'whatsapp',
      externalId: wamid,
      recipient: contact.phone,
      userId: contact.user_id,
    }),
    contact.user_id ? trackSend(contact.user_id) : Promise.resolve(),
  ])

  return NextResponse.json({ success: true })
}
