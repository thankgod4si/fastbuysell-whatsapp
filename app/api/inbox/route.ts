export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role key to bypass RLS on server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all messages for this user, ordered by recipient then sent_at DESC
  const { data, error } = await supabase
    .from('message_logs')
    .select('*, contacts(id, wa_name, name, status)')
    .eq('user_id', user.id)
    .order('recipient', { ascending: true })
    .order('sent_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[inbox] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Get latest message per recipient (WhatsApp-style bubbling)
  const latestByRecipient = new Map()
  for (const msg of data || []) {
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
