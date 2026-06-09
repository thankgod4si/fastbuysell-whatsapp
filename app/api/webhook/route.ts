import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendFlowMessage, sendTextMessage } from '@/lib/whatsapp'
import { updateMessageStatus } from '@/lib/message-log'

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

    // ── Delivery status updates ──────────────────────────────────────────────
    const statuses = value?.statuses as Array<{
      id: string
      status: string
      timestamp: string
      errors?: Array<{ message: string }>
    }> | undefined

    if (statuses?.length) {
      for (const s of statuses) {
        const status = s.status as 'sent' | 'delivered' | 'read' | 'failed'
        await updateMessageStatus(s.id, status, {
          timestamp: parseInt(s.timestamp),
          reason: s.errors?.[0]?.message,
        })
      }
      return NextResponse.json({ status: 'ok' })
    }

    // ── Incoming messages ────────────────────────────────────────────────────
    const message = value?.messages?.[0]
    if (!message) return NextResponse.json({ status: 'ok' })

    const from: string = message.from
    const businessPhoneNumberId: string | undefined = value?.metadata?.phone_number_id

    let userId: string | null = null
    if (businessPhoneNumberId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wa_phone_number_id', businessPhoneNumberId)
        .single()
      userId = profile?.id ?? null
    }

    // Shared helper — look up user's latest published flow
    async function resolveFlowOpts() {
      if (!userId) return undefined
      const { data: uf } = await supabase
        .from('flows')
        .select('meta_flow_id, cta_text')
        .eq('user_id', userId)
        .eq('meta_status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (uf?.meta_flow_id) {
        return { metaFlowId: uf.meta_flow_id, screen: 'LEAD_FORM', ctaText: uf.cta_text } as Parameters<typeof sendFlowMessage>[2]
      }
      return undefined
    }

    if (message.type === 'button') {
      const payload: string = message.button?.payload ?? ''

      if (payload === 'INTERESTED') {
        await sendFlowMessage(from, businessPhoneNumberId, await resolveFlowOpts())
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

    // Text reply — if contact is in 'sent/delivered/read' state, send them the flow
    if (message.type === 'text') {
      const cq = supabase.from('contacts').select('id, status').eq('phone', from)
      if (userId) cq.eq('user_id', userId)
      const { data: contact } = await cq.maybeSingle()

      if (contact && ['sent', 'delivered', 'read'].includes(contact.status)) {
        await sendFlowMessage(from, businessPhoneNumberId, await resolveFlowOpts())
        await supabase.from('contacts').update({ status: 'replied' }).eq('id', contact.id)
      }
    }

    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const flowData = JSON.parse(message.interactive.nfm_reply.response_json)

      // flow_db_id embedded in footer payload lets us reliably attribute the lead
      const resolvedUserId: string | null = flowData.user_id ?? userId

      const contactQuery = supabase.from('contacts').select('id').eq('phone', from)
      if (resolvedUserId) contactQuery.eq('user_id', resolvedUserId)
      const { data: contact } = await contactQuery.maybeSingle()

      await supabase.from('leads').insert({
        contact_id:      contact?.id          ?? null,
        phone:           from,
        // common fields
        full_name:       flowData.full_name       ?? null,
        email:           flowData.email           ?? null,
        phone_number:    flowData.phone_number     ?? null,
        company:         flowData.company          ?? null,
        product_service: flowData.product_service  ?? null,
        budget:          flowData.budget           ?? null,
        location:        flowData.location         ?? null,
        timeline:        flowData.timeline         ?? null,
        notes:           flowData.notes            ?? null,
        // legacy car fields (still captured if flow uses them)
        car_make:        flowData.car_make         ?? null,
        car_model:       flowData.car_model        ?? null,
        car_year:        flowData.car_year         ?? null,
        mileage:         flowData.mileage          ?? null,
        asking_price:    flowData.asking_price     ?? null,
        previous_owners: flowData.previous_owners  ?? null,
        condition:       flowData.condition        ?? null,
        // full raw response for any custom fields
        response_data:   flowData,
        status: 'new',
        source: 'whatsapp',
        user_id: resolvedUserId,
      })
    }
  } catch (err) {
    console.error('Webhook error:', err)
  }

  return NextResponse.json({ status: 'ok' })
}
