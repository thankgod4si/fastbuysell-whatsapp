export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all messages ordered by recipient then sent_at DESC
  const { data, error } = await authClient
    .from('message_logs')
    .select('*, contacts(id, wa_name, name, status)')
    .eq('user_id', user.id)
    .order('recipient', { ascending: true })
    .order('sent_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // Get latest message per recipient (WhatsApp-style bubbling)
  const latestByRecipient = new Map()
  if (data) {
    for (const msg of data) {
      const key = msg.recipient
      if (!latestByRecipient.has(key)) {
        latestByRecipient.set(key, msg)
      }
    }
  }
  
  // Sort by sent_at DESC so newest conversations are on top
  const sorted = Array.from(latestByRecipient.values()).sort((a, b) => 
    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )
  
  return NextResponse.json(sorted)
}
