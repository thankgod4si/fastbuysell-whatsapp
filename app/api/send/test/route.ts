export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { checkCanSend } from '@/lib/usage'

const BASE = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const PLATFORM_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }

  // Use logged-in user's verified number if available
  let phoneId = PLATFORM_PHONE_ID
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (user) {
      const check = await checkCanSend(user.id)
      if (!check.allowed) {
        return NextResponse.json({
          error: check.reason,
          code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached',
        }, { status: 403 })
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('wa_phone_number_id, wa_verified')
        .eq('id', user.id)
        .single()
      if (profile?.wa_verified && profile.wa_phone_number_id) {
        phoneId = profile.wa_phone_number_id
      }
    }
  } catch { /* fall back to platform number */ }

  const res = await fetch(`${BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.trim().replace(/\s+/g, ''),
      type: 'text',
      text: {
        body: '👋 Hello from Fast Buy & Sell! This is a test message to confirm your WhatsApp connection is working.',
      },
    }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id })
}
