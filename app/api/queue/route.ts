import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get contacts with pending message status
  const { data, error } = await serviceClient
    .from('message_logs')
    .select(`
      contact_id,
      recipient,
      content,
      created_at,
      contacts (
        id,
        phone,
        name,
        wa_name,
        profile_picture_url,
        status
      )
    `)
    .eq('status', 'pending')
    .eq('direction', 'outbound')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by contact_id to get unique contacts with their latest pending message
  const contactMap = new Map()
  for (const item of data || []) {
    if (!contactMap.has(item.contact_id)) {
      contactMap.set(item.contact_id, {
        ...item.contacts,
        message_content: item.content,
        queued_at: item.created_at,
        message_id: item.contact_id // using contact_id as reference
      })
    }
  }

  const queuedContacts = Array.from(contactMap.values())

  return NextResponse.json(queuedContacts)
}
