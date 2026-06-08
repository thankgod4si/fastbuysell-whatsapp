import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendFlowMessage } from '@/lib/whatsapp'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value
    const message = value?.messages?.[0]
    if (!message) return NextResponse.json({ status: 'ok' })

    const from: string = message.from
    // The business phone number ID that received the message
    const businessPhoneNumberId: string | undefined = value?.metadata?.phone_number_id

    // Resolve which user owns this phone number
    let userId: string | null = null
    if (businessPhoneNumberId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wa_phone_number_id', businessPhoneNumberId)
        .single()
      userId = profile?.id ?? null
    }

    // Template quick reply button clicked
    if (message.type === 'button') {
      const payload: string = message.button?.payload ?? ''

      if (payload === 'INTERESTED') {
        // Send flow from the same number that sent the template
        await sendFlowMessage(from, businessPhoneNumberId)

        const q = supabase.from('contacts').update({ status: 'replied' }).eq('phone', from)
        if (userId) q.eq('user_id', userId)
        await q
      }

      if (payload === 'OPT_OUT') {
        const q = supabase.from('contacts').update({ status: 'blacklisted' }).eq('phone', from)
        if (userId) q.eq('user_id', userId)
        await q
      }
    }

    // WhatsApp Flow completed
    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const flowData = JSON.parse(message.interactive.nfm_reply.response_json)

      const contactQuery = supabase.from('contacts').select('id').eq('phone', from)
      if (userId) contactQuery.eq('user_id', userId)
      const { data: contact } = await contactQuery.single()

      await supabase.from('leads').insert({
        contact_id: contact?.id ?? null,
        phone: from,
        full_name: flowData.full_name,
        email: flowData.email,
        car_make: flowData.car_make,
        car_model: flowData.car_model,
        car_year: flowData.car_year,
        mileage: flowData.mileage,
        asking_price: flowData.asking_price,
        previous_owners: flowData.previous_owners,
        condition: flowData.condition ?? null,
        status: 'new',
        user_id: userId,
      })
    }
  } catch (err) {
    console.error('Webhook error:', err)
  }

  return NextResponse.json({ status: 'ok' })
}
