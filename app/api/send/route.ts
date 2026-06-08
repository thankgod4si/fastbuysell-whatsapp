import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'

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

  // Use contact owner's verified number if available
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

  await Promise.all([
    supabase
      .from('contacts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', contactId),
    supabase.from('messages').insert({
      contact_id: contactId,
      phone: contact.phone,
      type: 'template',
      status: 'sent',
    }),
  ])

  return NextResponse.json({ success: true })
}
