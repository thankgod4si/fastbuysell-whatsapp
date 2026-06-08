import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'

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
  ])

  return NextResponse.json({ success: true })
}
