import { supabase } from '@/lib/supabase'

// Twilio sends inbound SMS as form-urlencoded POST
export async function POST(request: Request) {
  const text = await request.text()
  const params = new URLSearchParams(text)

  const from = params.get('From') || ''
  const to = params.get('To') || ''
  const body = params.get('Body') || ''

  if (!from) return twiml()

  // Find which user owns this Twilio number
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('twilio_from_number', to)
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

  return twiml()
}

function twiml() {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
