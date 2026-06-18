export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { getTokenForPhoneNumberId } from '@/lib/meta-app'

const BASE = 'https://graph.facebook.com/v21.0'

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { method } = await request.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('wa_phone_number_id')
    .eq('id', user.id)
    .single()

  if (!profile?.wa_phone_number_id) {
    return NextResponse.json({ error: 'No phone number registered yet' }, { status: 400 })
  }

  const token = await getTokenForPhoneNumberId(profile.wa_phone_number_id)

  const res = await fetch(`${BASE}/${profile.wa_phone_number_id}/request_code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code_method: method || 'SMS', language: 'en_US' }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
