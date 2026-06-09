import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: { contactId: string } }) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get contact's phone
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, phone, wa_name, name, status, created_at')
    .eq('id', params.contactId)
    .eq('user_id', user.id)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Get all messages for this phone
  const { data: messages } = await supabase
    .from('message_logs')
    .select('id, direction, content, msg_type, status, channel, sent_at, delivered_at, read_at')
    .eq('recipient', contact.phone)
    .eq('user_id', user.id)
    .order('sent_at', { ascending: true })

  // Get the lead (if they filled the form)
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', contact.phone)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ contact, messages: messages ?? [], lead })
}
