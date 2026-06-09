import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { sendTextMessage } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'

export async function POST(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, message } = await request.json()
  if (!contactId || !message?.trim()) {
    return NextResponse.json({ error: 'contactId and message required' }, { status: 400 })
  }

  const { data: contact } = await supabase
    .from('contacts').select('*').eq('id', contactId).eq('user_id', user.id).single()
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Resolve user's WA phone number ID
  let phoneNumberId: string | undefined
  const { data: waNum } = await supabase
    .from('wa_numbers').select('phone_number_id')
    .eq('user_id', user.id).eq('verified', true).eq('is_default', true).single()
  if (waNum?.phone_number_id) {
    phoneNumberId = waNum.phone_number_id
  } else {
    const { data: profile } = await supabase
      .from('profiles').select('wa_phone_number_id').eq('id', user.id).single()
    phoneNumberId = profile?.wa_phone_number_id ?? undefined
  }

  const result = await sendTextMessage(contact.phone, message.trim(), phoneNumberId)
  if ((result as { error?: { message?: string } }).error) {
    return NextResponse.json({ error: (result as { error: { message?: string } }).error.message ?? 'Send failed' }, { status: 500 })
  }

  const wamid = (result.messages as Array<{ id: string }>)?.[0]?.id

  await createMessageLog({
    contactId: contact.id,
    channel:   'whatsapp',
    externalId: wamid,
    recipient: contact.phone,
    userId:    user.id,
    direction: 'outbound',
    msgType:   'text',
    content:   message.trim(),
  })

  return NextResponse.json({ success: true })
}
