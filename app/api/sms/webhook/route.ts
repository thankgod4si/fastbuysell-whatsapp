export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Brevo sends inbound SMS as JSON POST
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({}, { status: 200 })

  const from: string = payload.sender || ''
  const to: string = payload.recipient || ''
  const body: string = payload.text || ''

  if (!from) return NextResponse.json({}, { status: 200 })

  // Find which user owns this sender number
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('brevo_sms_sender', to)
    .single()

  const userId = profile?.id ?? null

  // Mark existing contact as replied
  const q = supabase.from('contacts').update({ status: 'replied' }).eq('phone', from).eq('channel', 'sms')
  await (userId ? q.eq('user_id', userId) : q)

  const bodyLower = body.trim().toLowerCase()
  const isOptIn = bodyLower === 'yes' || bodyLower === 'y' || bodyLower === 'ja'

  if (isOptIn) {
    await supabase.from('contacts').upsert(
      { phone: from, channel: 'sms', status: 'replied', user_id: userId },
      { onConflict: 'phone,user_id' }
    )
    await supabase.from('leads').insert({
      phone: from,
      full_name: 'SMS Opt-In',
      email: '',
      car_make: '',
      car_model: '',
      car_year: '',
      mileage: '',
      asking_price: '',
      previous_owners: '',
      condition: `Replied: "${body}"`,
      status: 'new',
      source: 'sms',
      user_id: userId,
    })
  }

  return NextResponse.json({ status: 'ok' })
}
