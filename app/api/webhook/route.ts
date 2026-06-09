import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendFlowMessage } from '@/lib/whatsapp'
import { updateMessageStatus, saveInboundMessage } from '@/lib/message-log'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()
  console.log('[webhook] POST received', JSON.stringify(body).slice(0, 300))

  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value

    // ── Delivery status updates ──────────────────────────────────────────────
    const statuses = value?.statuses as Array<{
      id: string; status: string; timestamp: string; errors?: Array<{ message: string }>
    }> | undefined

    if (statuses?.length) {
      for (const s of statuses) {
        await updateMessageStatus(s.id, s.status as 'sent' | 'delivered' | 'read' | 'failed', {
          timestamp: parseInt(s.timestamp),
          reason: s.errors?.[0]?.message,
        })
      }
      return NextResponse.json({ status: 'ok' })
    }

    // ── Incoming messages ────────────────────────────────────────────────────
    const message = value?.messages?.[0]
    if (!message) return NextResponse.json({ status: 'ok' })

    const rawFrom: string = message.from
    const from: string = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`
    const businessPhoneNumberId: string | undefined = value?.metadata?.phone_number_id
    const waName: string | null = value?.contacts?.[0]?.profile?.name ?? null

    console.log(`[webhook] msg type=${message.type} from=${from} bizId=${businessPhoneNumberId}`)

    // Resolve WA number owner — used only for SENDING auto-replies (token/number selection)
    // NOT used to decide which user's inbox to save to
    let waOwnerId: string | null = null
    if (businessPhoneNumberId) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('wa_phone_number_id', businessPhoneNumberId).maybeSingle()
      waOwnerId = prof?.id ?? null
      if (!waOwnerId) {
        const { data: wn } = await supabase.from('wa_numbers').select('user_id').eq('phone_number_id', businessPhoneNumberId).maybeSingle()
        waOwnerId = wn?.user_id ?? null
      }
      console.log(`[webhook] waOwnerId=${waOwnerId} for bizId=${businessPhoneNumberId}`)
    }

    // ── KEY ROUTING CHANGE ───────────────────────────────────────────────────
    // Find ALL contacts with this phone that have been blasted (across every user).
    // This means Susy sees her replies, mrhawt sees his — even if they share a WA number.
    const { data: activeContacts } = await supabase
      .from('contacts')
      .select('id, user_id, status')
      .eq('phone', from)
      .in('status', ['sent', 'replied'])

    console.log(`[webhook] active contacts for ${from}: ${activeContacts?.length ?? 0}`)

    // Update wa_name across all contacts for this phone
    if (waName && activeContacts?.length) {
      await supabase.from('contacts').update({ wa_name: waName }).eq('phone', from)
    }

    // If nobody has blasted this number yet, create/upsert under waOwnerId as fallback
    if (!activeContacts?.length && waOwnerId) {
      await supabase.from('contacts')
        .upsert({ phone: from, user_id: waOwnerId, ...(waName ? { wa_name: waName } : {}) },
          { onConflict: 'phone,user_id', ignoreDuplicates: false })
    }

    // Primary contact for auto-reply sending context (prefer waOwner's, else first found)
    const primaryContact = activeContacts?.find(c => c.user_id === waOwnerId) ?? activeContacts?.[0] ?? null
    const primaryUserId  = primaryContact?.user_id ?? waOwnerId

    // Targets to save messages to — all users who blasted this number
    const targets = activeContacts?.length
      ? activeContacts
      : primaryUserId ? [{ id: undefined as string | undefined, user_id: primaryUserId, status: 'sent' as string }] : []

    // Helper — get a user's published flow for auto-reply
    async function resolveFlowOpts(uid: string | null) {
      if (!uid) return undefined
      const { data: uf } = await supabase
        .from('flows').select('meta_flow_id, cta_text')
        .eq('user_id', uid).eq('meta_status', 'published')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (uf?.meta_flow_id) {
        return { metaFlowId: uf.meta_flow_id, screen: 'LEAD_FORM', ctaText: uf.cta_text } as Parameters<typeof sendFlowMessage>[2]
      }
      return undefined
    }

    // ── Button replies (Interested / Opt-out) ────────────────────────────────
    if (message.type === 'button') {
      const payload: string = message.button?.payload ?? ''

      if (payload === 'INTERESTED') {
        for (const c of targets) {
          await saveInboundMessage({ contactId: c.id, phone: from, content: 'Tapped: Interested', msgType: 'button_reply', userId: c.user_id })
        }
        await sendFlowMessage(from, businessPhoneNumberId, await resolveFlowOpts(primaryUserId))
        for (const c of targets) {
          await supabase.from('contacts').update({ status: 'replied' }).eq('id', c.id!)
        }
      }

      if (payload === 'OPT_OUT') {
        for (const c of targets) {
          await saveInboundMessage({ contactId: c.id, phone: from, content: 'Opted out', msgType: 'button_reply', userId: c.user_id })
          await supabase.from('contacts').update({ status: 'blacklisted' }).eq('id', c.id!)
        }
      }
    }

    // ── Text replies ─────────────────────────────────────────────────────────
    if (message.type === 'text') {
      const text: string = message.text?.body ?? ''
      console.log(`[webhook] text from=${from} targets=${targets.length} text="${text.slice(0, 50)}"`)

      for (const c of targets) {
        console.log(`[webhook] saving text userId=${c.user_id} contactId=${c.id}`)
        await saveInboundMessage({ contactId: c.id, phone: from, content: text, msgType: 'text', userId: c.user_id })

        // Send auto-reply flow and update status for each target
        if (['sent', 'delivered', 'read'].includes(c.status)) {
          await sendFlowMessage(from, businessPhoneNumberId, await resolveFlowOpts(c.user_id))
          await supabase.from('contacts').update({ status: 'replied' }).eq('id', c.id!)
        }
      }
    }

    // ── Flow form submissions ────────────────────────────────────────────────
    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const flowData = JSON.parse(message.interactive.nfm_reply.response_json)

      // Resolve which user owns this form via flow_db_id (most accurate)
      let formUserId: string | null = null
      const flowDbId: string | null = flowData.flow_db_id ?? null
      if (flowDbId) {
        const { data: flow } = await supabase.from('flows').select('user_id').eq('id', flowDbId).maybeSingle()
        formUserId = flow?.user_id ?? null
      }
      // Fallbacks
      if (!formUserId) formUserId = flowData.user_id ?? primaryUserId

      const targetContact = activeContacts?.find(c => c.user_id === formUserId) ?? primaryContact

      const formSummary = [
        flowData.full_name,
        flowData.product_service ?? flowData.car_make,
        flowData.budget ?? flowData.asking_price,
      ].filter(Boolean).join(' · ')

      await saveInboundMessage({
        contactId: targetContact?.id,
        phone: from,
        content: `Form submitted: ${formSummary || 'Details received'}`,
        msgType: 'form_submission',
        userId: formUserId,
      })

      const { error: leadErr } = await supabase.from('leads').insert({
        contact_id:      targetContact?.id    ?? null,
        phone:           from,
        full_name:       flowData.full_name       ?? null,
        email:           flowData.email           ?? null,
        phone_number:    flowData.phone_number     ?? null,
        company:         flowData.company          ?? null,
        product_service: flowData.product_service  ?? null,
        budget:          flowData.budget           ?? null,
        location:        flowData.location         ?? null,
        timeline:        flowData.timeline         ?? null,
        notes:           flowData.notes            ?? null,
        car_make:        flowData.car_make         ?? null,
        car_model:       flowData.car_model        ?? null,
        car_year:        flowData.car_year         ?? null,
        mileage:         flowData.mileage          ?? null,
        asking_price:    flowData.asking_price     ?? null,
        previous_owners: flowData.previous_owners  ?? null,
        condition:       flowData.condition        ?? null,
        response_data:   flowData,
        status:          'new',
        source:          'whatsapp',
        user_id:         formUserId,
      })

      if (leadErr) {
        console.error('[webhook] lead insert error:', leadErr.message)
      } else {
        console.log(`[webhook] lead saved formUserId=${formUserId} contactId=${targetContact?.id}`)
      }
    }

  } catch (err) {
    console.error('[webhook] ERROR:', err)
  }

  return NextResponse.json({ status: 'ok' })
}
