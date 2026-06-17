import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendFlowMessage } from '@/lib/whatsapp'
import { updateMessageStatus, saveInboundMessage } from '@/lib/message-log'
import { sendTextMessage } from '@/lib/whatsapp'
import { loadBusinessContext, getOrCreateSession, processBookingMessage } from '@/lib/ai-booking'
import { generateReference, generatePaymentLink, formatPaymentMessage } from '@/lib/sofi'

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

    // ── ECHOES: AI Booking intercept ────────────────────────────────────────
    // If this phone number belongs to an Echoes-enabled business, route to the
    // AI booking engine and skip the legacy FastBuySell flow entirely.
    if (waOwnerId && message.type === 'text') {
      const { data: echoesProfile } = await supabaseAdmin
        .from('profiles')
        .select('echoes_enabled')
        .eq('id', waOwnerId)
        .maybeSingle()

      if (echoesProfile?.echoes_enabled && process.env.OPENAI_API_KEY) {
        const text: string = message.text?.body ?? ''
        console.log(`[echoes] AI booking for business=${waOwnerId} from=${from} text="${text.slice(0, 60)}"`)

        try {
          const [ctx, session] = await Promise.all([
            loadBusinessContext(waOwnerId, businessPhoneNumberId ?? ''),
            getOrCreateSession(waOwnerId, from),
          ])

          if (ctx) {
            // Save inbound message to logs
            await saveInboundMessage({ phone: from, content: text, msgType: 'text', userId: waOwnerId })

            const isFirstMessage = session.state === 'greeting'

            if (isFirstMessage && ctx.booking_flow_id) {
              // New customer (or returning) → send greeting + booking flow in WhatsApp
              const greeting = `Hi${waName ? ` ${waName.split(' ')[0]}` : ''}! 👋 Welcome to *${ctx.display_name}*.\n\nTap the button below to book your appointment — choose your service, pick a time, and select how you'd like to pay. It takes less than 30 seconds! 🚀`
              await sendTextMessage(from, greeting, businessPhoneNumberId)
              await sendFlowMessage(from, businessPhoneNumberId, {
                metaFlowId: ctx.booking_flow_id,
                screen: 'BOOKING',
                ctaText: 'Book Now ✨',
                bodyText: `Pick your service and confirm your booking at ${ctx.display_name}`,
              })
              // Update session state so we don't re-send the flow on every message
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
            } else {
              // Ongoing conversation — let AI continue naturally
              const { intent, updatedSession } = await processBookingMessage(text, ctx, session)
              console.log(`[echoes] intent.action=${intent.action} state=${updatedSession.state}`)
              await sendTextMessage(from, intent.reply_to_customer, businessPhoneNumberId)

              // Legacy: if AI collected all details via text chat, trigger payment
              if (updatedSession.state === 'payment_sent') {
                const d = updatedSession.collected_data
                const serviceId = d.service_id
                const service   = ctx.services.find(s => s.id === serviceId)
                const amount    = service ? service.price * 100 : Number(d.service_price ?? 0) * 100
                const currency  = service?.currency ?? 'NGN'
                const ref       = generateReference(session.id)

                const { data: booking } = await supabaseAdmin
                  .from('bookings')
                  .insert({
                    business_id:      waOwnerId,
                    session_id:       session.id,
                    customer_name:    d.customer_name ?? waName ?? 'Customer',
                    customer_phone:   from,
                    service_id:       serviceId!,
                    appointment_date: d.preferred_date!,
                    time_slot:        d.preferred_time!,
                    payment_status:   'pending',
                  })
                  .select('id')
                  .single()

                await supabaseAdmin.from('booking_transactions').insert({
                  business_id:              waOwnerId,
                  booking_id:               booking?.id ?? null,
                  amount:                   service?.price ?? 0,
                  currency,
                  reference:                ref,
                  payment_gateway_provider: 'sofi',
                  status:                   'pending',
                })

                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://outreachhq.xyz'
                const payResult = await generatePaymentLink({
                  amount, currency, reference: ref,
                  customer_phone: from, customer_name: d.customer_name ?? 'Customer',
                  description:    `Booking: ${service?.name ?? d.service_name} at ${ctx.display_name}`,
                  metadata:       { booking_session_id: session.id, business_id: waOwnerId, service_name: service?.name ?? '' },
                  callback_url:   `${appUrl}/api/webhooks/sofi`,
                })

                if (payResult.success) {
                  await sendTextMessage(from, formatPaymentMessage({
                    customerName: d.customer_name ?? 'there', serviceName: service?.name ?? d.service_name ?? '',
                    amount: service?.price ?? 0, currency, appointmentDate: d.preferred_date!, appointmentTime: d.preferred_time!,
                    paymentLink: payResult.payment_link, virtualAccount: payResult.virtual_account, businessName: ctx.display_name,
                  }), businessPhoneNumberId)
                } else {
                  await sendTextMessage(from, `Sorry, I had trouble generating your payment link. Please try again! 🙏`, businessPhoneNumberId)
                }
              }
            }
          }
        } catch (err) {
          console.error('[echoes] AI booking error:', err)
          await sendTextMessage(from, `Hi! I'm having a quick technical moment. Please send your message again! 😊`, businessPhoneNumberId)
        }

        return NextResponse.json({ status: 'ok' })
      }
    }
    // ── END ECHOES intercept ─────────────────────────────────────────────────

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

        // Evaluate triggers for auto-reply (whatsapp or any)
        const { data: triggers } = await supabase
          .from('triggers')
          .select('*')
          .eq('active', true)
          .in('channel', ['whatsapp', 'any'])
          .or(`linked_account_id.is.null,user_id.eq.${c.user_id}`)

        let matched = null
        if (triggers && Array.isArray(triggers)) {
          for (const t of triggers) {
            try {
              const kw = String(t.keyword || '')
              const mt = t.match_type || 'contains'
              if (mt === 'contains' && text.toLowerCase().includes(kw.toLowerCase())) { matched = t; break }
              if (mt === 'exact' && text.trim().toLowerCase() === kw.toLowerCase()) { matched = t; break }
              if (mt === 'regex') { const re = new RegExp(kw, 'i'); if (re.test(text)) { matched = t; break } }
            } catch (e) { continue }
          }
        }

        if (matched && matched.auto_send) {
          const reply = String(matched.reply_template || '').replace(/{{\s*link\s*}}/gi, '')
          try {
            await sendTextMessage(from, reply, businessPhoneNumberId)
            await supabase.from('contacts').update({ status: 'replied' }).eq('id', c.id!)
            await supabase.from('message_logs').insert({ channel: 'whatsapp', direction: 'outbound', recipient: from, content: reply, msg_type: 'auto_reply', status: 'sent', sent_at: new Date().toISOString(), user_id: c.user_id })
          } catch (err) {
            console.error('[webhook] whatsapp auto-reply failed', err)
          }
        } else {
          // Send auto-reply flow and update status for each target
          if (['sent', 'delivered', 'read'].includes(c.status)) {
            await sendFlowMessage(from, businessPhoneNumberId, await resolveFlowOpts(c.user_id))
            await supabase.from('contacts').update({ status: 'replied' }).eq('id', c.id!)
          }
        }
      }
    }

    // ── Flow form submissions ────────────────────────────────────────────────
    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const flowData = JSON.parse(message.interactive.nfm_reply.response_json)

      // ── Booking flow submission (Echoes AI) ───────────────────────────────
      // Booking flows embed the business user.id as flow_db_id in the payload.
      // service_id, customer_name, preferred_date, preferred_time, payment_method are present.
      const isBookingFlow = Boolean(flowData.service_id && flowData.payment_method)
      if (isBookingFlow && flowData.flow_db_id && businessPhoneNumberId) {
        const bookingBusinessId: string = flowData.flow_db_id
        try {
          // Load the business's profile for bank details + display name
          const { data: bProfile } = await supabaseAdmin
            .from('profiles')
            .select('business_display_name, bank_name, account_number, account_name')
            .eq('id', bookingBusinessId)
            .maybeSingle()

          // Find the product/service selected
          const serviceId: string = flowData.service_id
          const { data: svc } = await supabaseAdmin
            .from('products')
            .select('id, name, price, currency')
            .eq('id', serviceId)
            .maybeSingle()
          // Fallback to services_menu
          const { data: svcMenu } = svc ? { data: null } : await supabaseAdmin
            .from('services_menu')
            .select('id, service_name, price, currency')
            .eq('id', serviceId)
            .maybeSingle()
          const serviceName = svc?.name ?? svcMenu?.service_name ?? 'Service'
          const servicePrice = Number(svc?.price ?? svcMenu?.price ?? 0)
          const currency     = svc?.currency ?? svcMenu?.currency ?? 'NGN'
          const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
          const sym = SYM[currency] ?? currency

          const customerName: string  = flowData.customer_name ?? waName ?? 'Customer'
          const preferredDate: string = flowData.preferred_date ?? ''
          const preferredTime: string = flowData.preferred_time ?? ''
          const paymentMethod: string = flowData.payment_method ?? 'transfer'

          // Create pending booking
          const ref = generateReference(bookingBusinessId.slice(0, 8))
          const { data: booking } = await supabaseAdmin
            .from('bookings')
            .insert({
              business_id:      bookingBusinessId,
              customer_name:    customerName,
              customer_phone:   from,
              service_id:       serviceId,
              appointment_date: preferredDate,
              time_slot:        preferredTime,
              payment_status:   'pending',
            })
            .select('id')
            .single()

          await supabaseAdmin.from('booking_transactions').insert({
            business_id:              bookingBusinessId,
            booking_id:               booking?.id ?? null,
            amount:                   servicePrice,
            currency,
            reference:                ref,
            payment_gateway_provider: paymentMethod === 'card' ? 'sofi' : 'manual',
            status:                   'pending',
          })

          await saveInboundMessage({
            phone: from, content: `Booking: ${serviceName} on ${preferredDate} at ${preferredTime}`,
            msgType: 'form_submission', userId: bookingBusinessId,
          })

          const displayName = bProfile?.business_display_name ?? 'us'

          if (paymentMethod === 'transfer') {
            // Reply with business bank account details
            const bankName  = bProfile?.bank_name     ?? '(bank not set)'
            const accNum    = bProfile?.account_number ?? '(account not set)'
            const accName   = bProfile?.account_name  ?? displayName
            const msg = `✅ *Booking Confirmed!*\n\n` +
              `📋 *${serviceName}*\n` +
              `📅 ${preferredDate} at ${preferredTime}\n\n` +
              `To complete your booking, please transfer *${sym}${servicePrice.toLocaleString()}* to:\n\n` +
              `🏦 *Bank:* ${bankName}\n` +
              `📟 *Account Number:* ${accNum}\n` +
              `👤 *Account Name:* ${accName}\n\n` +
              `Send a screenshot of your payment here once done and we'll confirm your appointment! 🙏`
            await sendTextMessage(from, msg, businessPhoneNumberId)
          } else {
            // Generate Sofi card payment link
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://outreachhq.xyz'
            const payResult = await generatePaymentLink({
              amount:          servicePrice * 100,
              currency,        reference: ref,
              customer_phone:  from, customer_name: customerName,
              description:     `Booking: ${serviceName} at ${displayName}`,
              metadata:        { booking_id: booking?.id ?? '', business_id: bookingBusinessId },
              callback_url:    `${appUrl}/api/webhooks/sofi`,
            })
            if (payResult.success) {
              const msg = `✅ *Booking Confirmed!*\n\n📋 *${serviceName}*\n📅 ${preferredDate} at ${preferredTime}\n\nPay securely with your card here:\n${payResult.payment_link}\n\nYour appointment is held for 30 minutes ⏳`
              await sendTextMessage(from, msg, businessPhoneNumberId)
            } else {
              await sendTextMessage(from, `Booking received! We'll send your payment link shortly.`, businessPhoneNumberId)
            }
          }
        } catch (err) {
          console.error('[echoes] booking flow nfm_reply error:', err)
          await sendTextMessage(from, `Thanks! We received your booking request and will confirm shortly. 🙏`, businessPhoneNumberId)
        }
        return NextResponse.json({ status: 'ok' })
      }

      // ── Legacy outreach lead form submission ──────────────────────────────
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
