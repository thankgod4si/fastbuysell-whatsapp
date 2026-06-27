export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone_number_id, phone_number, display_name } = await request.json()

  if (!phone_number_id || !phone_number || !display_name) {
    return NextResponse.json({ error: 'Phone number ID, phone number, and display name are required' }, { status: 400 })
  }

  // Save to wa_numbers table
  const { error } = await supabase.from('wa_numbers').insert({
    user_id: user.id,
    phone_number_id: phone_number_id,
    phone_number: phone_number,
    display_name: display_name,
    verified: true,
    is_default: true,
    meta_app_id: null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Update profile with this number
  await supabase.from('profiles').update({
    wa_phone_number_id: phone_number_id,
    wa_phone_number: phone_number,
    wa_display_name: display_name,
    wa_verified: true,
  }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
