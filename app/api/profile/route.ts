export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

const PROFILE_FIELDS = [
  'full_name',
  'reply_to_email',
  'resend_api_key',
  'email_from',
  'brevo_api_key',
  'brevo_sms_sender',
  'wa_phone_number',
  'wa_phone_number_id',
  'wa_display_name',
  'wa_verified',
  'subscription_status',
  'trial_sends_remaining',
  'messages_sent_total',
  'is_admin',
  'booking_flow_id',
  'business_display_name',
  'bank_name',
  'account_number',
  'account_name',
].join(',')

export async function GET() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? {})
}

export async function PATCH(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Only allow known fields — ignore anything else
  const allowed = [
    'full_name', 'reply_to_email',
    'resend_api_key', 'email_from',
    'brevo_api_key', 'brevo_sms_sender',
    'wa_phone_number', 'wa_phone_number_id', 'wa_display_name', 'wa_verified',
  ]
  const patch: Record<string, unknown> = { id: user.id }
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(patch)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
