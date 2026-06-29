export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const channel = url.searchParams.get('channel')
  const contactId = url.searchParams.get('contactId')
  const leadId = url.searchParams.get('leadId')

  let query = authClient
    .from('message_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(200)

  if (channel) query = query.eq('channel', channel)
  if (contactId) query = query.eq('contact_id', contactId)
  if (leadId) query = query.eq('lead_id', leadId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
