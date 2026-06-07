import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendFlowMessage } from '@/lib/whatsapp'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!

// Meta webhook verification
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
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) return NextResponse.json({ status: 'ok' })

    const from: string = message.from

    // Template quick reply button clicked
    if (message.type === 'button') {
      const payload: string = message.button?.payload ?? ''

      if (payload === 'INTERESTED') {
        await sendFlowMessage(from)
        await supabase
          .from('contacts')
          .update({ status: 'replied' })
          .eq('phone', from)
      }

      if (payload === 'OPT_OUT') {
        await supabase
          .from('contacts')
          .update({ status: 'blacklisted' })
          .eq('phone', from)
      }
    }

    // WhatsApp Flow completed
    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const flowData = JSON.parse(message.interactive.nfm_reply.response_json)

      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', from)
        .single()

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
      })
    }
  } catch (err) {
    console.error('Webhook error:', err)
  }

  return NextResponse.json({ status: 'ok' })
}
