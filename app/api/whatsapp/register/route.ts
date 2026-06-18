export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { pickMetaApp } from '@/lib/meta-app'

const BASE = 'https://graph.facebook.com/v21.0'

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cc, phone_number, display_name, pin } = await request.json()

  if (!cc || !phone_number || !display_name || !pin) {
    return NextResponse.json({ error: 'Country code, phone number, display name and PIN are required' }, { status: 400 })
  }

  // Pick least-loaded Meta app — fall back to env var if none in DB yet
  const app = await pickMetaApp()
  const wabaId = app?.waba_id ?? process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!
  const token  = app?.access_token ?? process.env.WHATSAPP_ACCESS_TOKEN!

  const res = await fetch(`${BASE}/${wabaId}/phone_numbers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cc, phone_number, verified_name: display_name, pin }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  const phoneNumberId: string = data.id
  const fullPhone = `+${cc}${phone_number}`

  // Save to profiles (primary number)
  await supabase.from('profiles').upsert({
    id: user.id,
    wa_phone_number_id: phoneNumberId,
    wa_phone_number:    fullPhone,
    wa_display_name:    display_name,
    wa_verified:        false,
  })

  // Save to wa_numbers table with meta_app link
  await supabase.from('wa_numbers').upsert({
    user_id:        user.id,
    phone_number_id: phoneNumberId,
    phone_number:   fullPhone,
    display_name,
    verified:       false,
    is_default:     true,
    meta_app_id:    app?.id ?? null,
  }, { onConflict: 'phone_number_id' })

  return NextResponse.json({ phone_number_id: phoneNumberId })
}
