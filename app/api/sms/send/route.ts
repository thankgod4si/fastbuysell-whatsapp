import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSms, DEFAULT_SMS_TEMPLATE } from '@/lib/sms'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function getSmsConfig(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('twilio_account_sid, twilio_auth_token, twilio_from_number')
    .eq('id', userId)
    .single()
  return {
    accountSid: data?.twilio_account_sid || undefined,
    authToken: data?.twilio_auth_token || undefined,
    from: data?.twilio_from_number || undefined,
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

  await supabase
    .from('contacts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', contactId)

  return NextResponse.json({ success: true, sid: result.sid })
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
      await supabase
        .from('contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      sent++
    } else {
      failed.push(contact.phone)
    }
    // Twilio rate limit: ~1 msg/sec on trial, ~100/sec on paid
    await new Promise(r => setTimeout(r, 50))
  }

  return NextResponse.json({ sent, failed })
}
