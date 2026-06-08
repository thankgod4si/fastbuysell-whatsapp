import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

const BASE = 'https://graph.facebook.com/v21.0'
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cc, phone_number, display_name, pin } = await request.json()

  if (!cc || !phone_number || !display_name || !pin) {
    return NextResponse.json({ error: 'Country code, phone number, display name and PIN are required' }, { status: 400 })
  }

  const res = await fetch(`${BASE}/${WABA_ID}/phone_numbers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cc, phone_number, verified_name: display_name, pin }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      wa_phone_number_id: data.id,
      wa_phone_number: `+${cc}${phone_number}`,
      wa_display_name: display_name,
      wa_verified: false,
      updated_at: new Date().toISOString(),
    })

  return NextResponse.json({ phone_number_id: data.id })
}
