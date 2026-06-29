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

  // Temporarily remove user_id filter to debug
  let query = authClient
    .from('message_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(200)

  if (channel) query = query.eq('channel', channel)
  if (contactId) query = query.eq('contact_id', contactId)
  if (leadId) query = query.eq('lead_id', leadId)

  const { data, error } = await query
  if (error) {
    console.error('[logs] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[logs] Total messages found:', data?.length)
  console.log('[logs] User ID:', user.id)
  console.log('[logs] Sample message:', data?.[0])
  
  // Filter by user_id after fetching to debug
  const userMessages = data?.filter(m => m.user_id === user.id) || []
  console.log('[logs] Messages for user:', userMessages.length)

  return NextResponse.json(userMessages)
}
