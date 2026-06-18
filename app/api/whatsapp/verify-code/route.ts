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

  const { code } = await request.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('wa_phone_number_id')
    .eq('id', user.id)
    .single()

  if (!profile?.wa_phone_number_id) {
    return NextResponse.json({ error: 'No phone number registered yet' }, { status: 400 })
  }

  const token = await getTokenForPhoneNumberId(profile.wa_phone_number_id)

  const res = await fetch(`${BASE}/${profile.wa_phone_number_id}/verify_code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  // Mark verified in both tables
  await Promise.all([
    supabase.from('profiles')
      .update({ wa_verified: true })
      .eq('id', user.id),
    supabase.from('wa_numbers')
      .update({ verified: true, is_default: true })
      .eq('phone_number_id', profile.wa_phone_number_id)
      .eq('user_id', user.id),
  ])

  return NextResponse.json({ success: true })
}
