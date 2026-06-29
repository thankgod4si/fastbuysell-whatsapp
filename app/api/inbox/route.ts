export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all messages ordered by recipient then sent_at DESC
  // Temporarily remove user_id filter to debug
  const { data, error } = await authClient
    .from('message_logs')
    .select('*, contacts(id, wa_name, name, status)')
    .order('recipient', { ascending: true })
    .order('sent_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[inbox] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('[inbox] Total messages found:', data?.length)
  console.log('[inbox] User ID:', user.id)
  console.log('[inbox] Sample message:', data?.[0])
  
  // Filter by user_id after fetching to debug
  const userMessages = data?.filter(m => m.user_id === user.id) || []
  console.log('[inbox] Messages for user:', userMessages.length)
  
  // Get latest message per recipient (WhatsApp-style bubbling)
  const latestByRecipient = new Map()
  for (const msg of userMessages) {
    const key = msg.recipient
    if (!latestByRecipient.has(key)) {
      latestByRecipient.set(key, msg)
    }
  }
  
  // Sort by sent_at DESC so newest conversations are on top
  const sorted = Array.from(latestByRecipient.values()).sort((a, b) => 
    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )
  
  return NextResponse.json(sorted)
}
