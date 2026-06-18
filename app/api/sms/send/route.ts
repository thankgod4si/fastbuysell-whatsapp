export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSms, DEFAULT_SMS_TEMPLATE } from '@/lib/sms'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createMessageLog } from '@/lib/message-log'

async function getSmsConfig(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('brevo_api_key, brevo_sms_sender')
    .eq('id', userId)
    .single()
  return {
    apiKey: data?.brevo_api_key || undefined,
    sender: data?.brevo_sms_sender || undefined,
  }
}

// Send to one contact
export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, message } = await request.json()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', user.id)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const config = await getSmsConfig(user.id)
  const result = await sendSms(contact.phone, message || DEFAULT_SMS_TEMPLATE, config)

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Send failed' }, { status: 500 })
  }

  await Promise.all([
    supabase.from('contacts').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', contactId),
    createMessageLog({ contactId, channel: 'sms', externalId: result.messageId, recipient: contact.phone, userId: user.id }),
  ])

  return NextResponse.json({ success: true, messageId: result.messageId })
}

// Bulk send all pending SMS contacts
export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const message = url.searchParams.get('message') || DEFAULT_SMS_TEMPLATE

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .eq('channel', 'sms')
    .eq('status', 'pending')

  if (!contacts?.length) return NextResponse.json({ sent: 0, message: 'No pending SMS contacts' })

  const config = await getSmsConfig(user.id)
  let sent = 0
  const failed: string[] = []

  for (const contact of contacts) {
    const result = await sendSms(contact.phone, message, config)
    if (result.ok) {
      await Promise.all([
        supabase.from('contacts').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', contact.id),
        createMessageLog({ contactId: contact.id, channel: 'sms', externalId: result.messageId, recipient: contact.phone, userId: user.id }),
      ])
      sent++
    } else {
      failed.push(contact.phone)
    }
    await new Promise(r => setTimeout(r, 50))
  }

  return NextResponse.json({ sent, failed })
}
