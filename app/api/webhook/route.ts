export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendFlowMessage, sendInteractiveButtons, sendInteractiveList, sendTextMessage } from '@/lib/whatsapp'
import { updateMessageStatus, saveInboundMessage } from '@/lib/message-log'
import { loadBusinessContext, getOrCreateSession, processBookingMessage } from '@/lib/ai-booking'
import { generateReference, generatePaymentLink, formatPaymentMessage } from '@/lib/sofi'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!

// ── Tresses Lagos service catalog (all categories, used for interactive lists + price lookup) ──
const ECHOES_CATALOG: Record<string, { title: string; rows: Array<{ id: string; name: string; price: number; dur: string }> }> = {
  cat_repair: { title: '💧 Hair Repair & Hydration', rows: [
    { id: 'b26b9576-acd1-4040-9dda-0ea1b4f73fa6', name: 'Intense Hydrating',      price: 31000, dur: '1hr 30min' },
    { id: '67024421-de57-48c8-a99c-fdca04efb44d', name: 'Moisture SOS',            price: 49500, dur: '1hr 30min' },
    { id: '00885a00-ef74-4e87-b6fe-de1ac451adbd', name: 'Bond Builder',             price: 38500, dur: '1hr 30min' },
    { id: 'b1756751-ba7c-4242-a753-5383759d1d09', name: 'Quinoa Protein',           price: 31000, dur: '1hr 30min' },
    { id: 'cc59570f-b491-4876-a933-2a7601ba2eae', name: 'Botox Volumising',         price: 49500, dur: '1hr 30min' },
    { id: '696351e0-02d0-47df-8da7-6b985074b395', name: 'Molecular Repair Blend',   price: 49500, dur: '1hr 30min' },
    { id: 'hair-detox',   name: 'Hair Detoxification', price: 28000, dur: '30min'      },
    { id: 'hair-rehab',   name: 'Hair Rehab Treatment', price: 38500, dur: '1hr 30min' },
    { id: 'hair-trim',    name: 'Hair Trim',             price: 8800,  dur: '30min'    },
  ]},
  cat_scalp: { title: '🔬 Scalp Health', rows: [
    { id: 'scalp-analysis',    name: 'Scalp Analysis & Consult', price: 15000, dur: '45min'     },
    { id: 'scalp-detox',       name: 'Scalp Detox & Purification', price: 25000, dur: '1hr'    },
    { id: 'follicle-stim',     name: 'Follicle Stimulation',      price: 35000, dur: '1hr'     },
    { id: 'sebum-balance',     name: 'Sebum Balancing Treatment', price: 28000, dur: '1hr'     },
    { id: 'scalp-microneedle', name: 'Scalp Micro-needling',      price: 45000, dur: '1hr 15m' },
  ]},
  cat_smoothing: { title: '✨ Smoothing & Texture', rows: [
    { id: 'keratin-smooth',    name: 'Keratin Smoothing',         price: 85000,  dur: '3hr'  },
    { id: 'japanese-straight', name: 'Japanese Straightening',    price: 120000, dur: '4hr'  },
    { id: 'relaxer-app',       name: 'Relaxer Application',       price: 25000,  dur: '2hr'  },
    { id: 'texture-soften',    name: 'Texture Softening',         price: 45000,  dur: '2hr'  },
    { id: 'curl-define',       name: 'Curl Definition Treatment', price: 35000,  dur: '2hr'  },
    { id: 'brazilian-blowout', name: 'Brazilian Blowout',         price: 75000,  dur: '3hr'  },
    { id: 'thermal-recond',    name: 'Thermal Reconditioning',    price: 95000,  dur: '4hr'  },
    { id: 'natural-curl-enh',  name: 'Natural Curl Enhancement',  price: 38000,  dur: '2hr'  },
  ]},
  cat_colour: { title: '🎨 Colour Treatments', rows: [
    { id: 'full-colour',    name: 'Full Colour Application', price: 55000,  dur: '2hr 30m' },
    { id: 'highlights',     name: 'Highlights & Balayage',   price: 85000,  dur: '3hr'     },
    { id: 'colour-correct', name: 'Colour Correction',       price: 120000, dur: '4hr+'    },
  ]},
  cat_health: { title: '💪 Hair Health', rows: [
    { id: 'plant-stem',    name: 'Plant Stem Cell Treatment',    price: 45000, dur: '1hr 30m' },
    { id: 'derma-stim',    name: 'Derma Stimulating Scalp',      price: 38000, dur: '1hr'     },
    { id: 'prp-growth',    name: 'PRP Hair Growth Treatment',    price: 85000, dur: '1hr 30m' },
    { id: 'biotin-infuse', name: 'Biotin Infusion Treatment',    price: 42000, dur: '1hr'     },
  ]},
  cat_extensions: { title: '💅 Styles With Extensions', rows: [
    { id: 'knotless-braids',   name: 'Knotless Box Braids',         price: 45000, dur: '4hr+' },
    { id: 'sew-in-weave',      name: 'Sew-In Weave Install',        price: 35000, dur: '3hr'  },
    { id: 'wig-install',       name: 'Wig Install & Customise',     price: 25000, dur: '2hr'  },
    { id: 'faux-locs',         name: 'Faux Locs',                   price: 55000, dur: '5hr+' },
    { id: 'goddess-locs',      name: 'Goddess Locs',                price: 65000, dur: '6hr+' },
    { id: 'crochet-braids',    name: 'Crochet Braids',              price: 30000, dur: '3hr'  },
    { id: 'feed-in-braids',    name: 'Feed-In Braids',              price: 28000, dur: '2hr 30m' },
    { id: 'cornrows',          name: 'Cornrows',                    price: 15000, dur: '2hr'  },
    { id: 'senegalese-twists', name: 'Senegalese Twists',           price: 50000, dur: '5hr'  },
    { id: 'marley-twists',     name: 'Marley Twists',               price: 45000, dur: '4hr'  },
  ]},
  cat_natural: { title: '🌀 Natural Styles', rows: [
    { id: 'wash-go',       name: 'Wash & Go',             price: 15000, dur: '1hr'     },
    { id: 'twist-out',     name: 'Twist-Out',             price: 12000, dur: '1hr'     },
    { id: 'braid-out',     name: 'Braid-Out',             price: 12000, dur: '1hr'     },
    { id: 'bantu-knots',   name: 'Bantu Knots',           price: 18000, dur: '1hr 30m' },
    { id: 'roller-set',    name: 'Roller Set',            price: 20000, dur: '2hr'     },
    { id: 'blowout-press', name: 'Blowout & Press',       price: 25000, dur: '1hr 30m' },
    { id: 'afro-shape',    name: 'Afro Shaping & Sculpt', price: 18000, dur: '1hr'     },
    { id: 'finger-coils',  name: 'Finger Coils',          price: 22000, dur: '2hr'     },
    { id: 'perm-rod-set',  name: 'Perm Rod Set',          price: 22000, dur: '2hr'     },
    { id: 'flexi-rod-set', name: 'Flexi Rod Set',         price: 20000, dur: '2hr'     },
  ]},
  cat_takedown: { title: '✂️ Hair Take Down', rows: [
    { id: 'braid-takedown', name: 'Braid Take-Down',            price: 12000, dur: '1hr'  },
    { id: 'weave-removal',  name: 'Weave Removal',              price: 8000,  dur: '30min' },
    { id: 'loc-removal',    name: 'Loc Removal',                price: 35000, dur: '3hr+' },
    { id: 'wig-removal',    name: 'Wig Removal & Conditioning', price: 10000, dur: '45min' },
    { id: 'ext-detangle',   name: 'Extension Detangling',       price: 15000, dur: '1hr'  },
  ]},
}
// Flat lookup for price/name by slug
const CATALOG_FLAT = Object.values(ECHOES_CATALOG).flatMap(c => c.rows)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  // Return 200 for health checks (no hub params)
  if (!mode && !token) {
    return new Response('OK', { status: 200 })
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

      if (echoesProfile?.echoes_enabled) {
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

            // ── Keyword menu shortcuts (interactive) ───────────────────────
            const kw = text.trim().toLowerCase()

            // Helper: send service category as interactive list so customers can tap to book
            const sendCategoryInfo = async (cat: string) => {
              const catData = ECHOES_CATALOG[cat]
              if (!catData) { await sendMainMenu(); return }
              await sendInteractiveList(from, businessPhoneNumberId, {
                bodyText: `*${catData.title}*\n\nSelect a service below. All visits include a complimentary consultation. 💆‍♀️`,
                buttonText: 'Choose Service',
                sections: [{ title: 'Tap a service to book', rows: catData.rows.slice(0, 10).map(s => ({
                  id: `svc_book_${s.id}`,
                  title: s.name.slice(0, 24),
                  description: `₦${s.price.toLocaleString()} · ${s.dur}`,
                })) }],
              })
            }
            // Helper: send the main interactive list menu
            const sendMainMenu = async () => {
              const firstName = waName ? waName.split(' ')[0] : ''
              await sendInteractiveList(from, businessPhoneNumberId, {
                bodyText:
                  `Hi${firstName ? ` ${firstName}` : ''}! 👋 Welcome to *${ctx.display_name}*.\n\n` +
                  `We're a trichology-led hair & scalp clinic. Every visit starts with a complimentary consultation.\n\n` +
                  `How can we help you today? 👇`,
                buttonText: 'View Services',
                sections: [
                  {
                    title: 'Treatments',
                    rows: [
                      { id: 'cat_repair',    title: '💧 Hair Repair',        description: '8 treatments from ₦28,000' },
                      { id: 'cat_scalp',     title: '🔬 Scalp Health',        description: '5 specialised treatments' },
                      { id: 'cat_smoothing', title: '✨ Texture & Smoothing',  description: '8 treatments available' },
                      { id: 'cat_colour',    title: '🎨 Colour Treatments',   description: '3 colour services' },
                      { id: 'cat_health',    title: '💪 Hair Health',         description: '4 strengthening treatments' },
                    ],
                  },
                  {
                    title: 'Styling',
                    rows: [
                      { id: 'cat_extensions', title: '💅 Styles + Extensions', description: '49 styles available' },
                      { id: 'cat_natural',    title: '🌀 Natural Styles',      description: '34 styles available' },
                      { id: 'cat_takedown',   title: '✂️ Hair Take Down',      description: '15 take-down services' },
                    ],
                  },
                  {
                    title: 'Quick Actions',
                    rows: [
                      { id: 'cmd_book',   title: '📅 Book Appointment', description: 'Book in under 30 seconds' },
                      { id: 'cmd_prices', title: '💰 View All Prices',  description: 'Full price list' },
                    ],
                  },
                ],
              })
            }

            // Main menu
            if (kw === '/' || kw === 'menu' || kw === 'hi' || kw === 'hello' || kw === 'hey' || kw === 'start') {
              await sendMainMenu()
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }

            if (kw === '/prices' || kw === 'prices' || kw === 'pricing' || kw === 'price list' || kw === 'price') {
              await sendInteractiveButtons(from,
                `*${ctx.display_name} — Treatment Prices* 💆‍♀️\n\n` +
                `*💧 Hair Repair & Hydration:*\n` +
                `• Intense Hydrating — ₦31,000\n` +
                `• Moisture S.O.S — ₦49,500\n` +
                `• Bond Builder — ₦38,500\n` +
                `• Quinoa Protein — ₦31,000\n` +
                `• Botox Volumising — ₦49,500\n` +
                `• Molecular Repair — ₦49,500\n` +
                `• Hair Detox — ₦28,000\n` +
                `• Hair Rehab — ₦38,500\n` +
                `• Trim — ₦8,800\n\n` +
                `*🔬 Scalp Health:* from ₦25,000\n` +
                `*🎨 Colour:* from ₦35,000\n` +
                `*💅 Extensions:* from ₦15,000\n` +
                `*🌀 Natural Styles:* from ₦10,000`,
                [
                  { id: 'cmd_book',     title: '📅 Book Now' },
                  { id: 'cmd_mainmenu', title: '🏠 Main Menu' },
                ], businessPhoneNumberId)
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }

            if (/^(book|booking|bookings|reserve|appointment|appointments)$/i.test(kw)) {
              // Show services from Supabase so customer picks one before the flow opens
              const { data: prods } = await supabaseAdmin
                .from('products')
                .select('id, name, price, currency')
                .eq('business_id', waOwnerId!)
                .eq('is_available', true)
                .order('sort_order')
                .limit(10)
              const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
              if (prods?.length) {
                await sendInteractiveList(from, businessPhoneNumberId, {
                  bodyText: `*Select your treatment* at ${ctx.display_name} 💆‍♀️\n\nAll visits include a complimentary Hair Technician Consultation.`,
                  buttonText: 'Choose Treatment',
                  sections: [{ title: 'Available Treatments',
                    rows: prods.map(p => ({
                      id: `svc_book_${p.id}`,
                      title: p.name.slice(0, 24),
                      description: `${SYM[p.currency] ?? p.currency}${Number(p.price).toLocaleString()}`,
                    })),
                  }],
                })
              } else {
                await sendMainMenu()
              }
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }

            if (/^(services|treatments|service list|what do you offer|what services|offerings)$/i.test(kw)) {
              await sendMainMenu()
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }

            if (kw === '1' || kw === 'hair repair' || kw === 'repair' || kw === 'hydration') {
              await sendCategoryInfo('cat_repair')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '2' || kw === 'scalp') {
              await sendCategoryInfo('cat_scalp')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '3' || kw === 'smoothing' || kw === 'texture' || kw === 'straightening') {
              await sendCategoryInfo('cat_smoothing')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '4' || kw === 'styles extensions' || kw === 'extensions' || kw === 'weave' || kw === 'braids') {
              await sendCategoryInfo('cat_extensions')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '5' || kw === 'natural styles' || kw === 'natural' || kw === 'no extensions') {
              await sendCategoryInfo('cat_natural')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '6' || kw === 'colour' || kw === 'color' || kw === 'highlights') {
              await sendCategoryInfo('cat_colour')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '7' || kw === 'hair health') {
              await sendCategoryInfo('cat_health')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '8' || kw === 'take down' || kw === 'takedown' || kw === 'removal') {
              await sendCategoryInfo('cat_takedown')
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === '9' || kw === 'consultation' || kw === 'consult') {
              await sendInteractiveButtons(from,
                `*🧴 Consultation at ${ctx.display_name}*\n\n` +
                `Every visit begins with a *complimentary Hair Technician Consultation* so we fully understand your hair & scalp before treatment.\n\n` +
                `Covers: hair & scalp analysis, root cause identification, personalised treatment plan & maintenance advice.\n\n` +
                `*All consultations are included free* with any service booking.`,
                [
                  { id: 'cmd_book',     title: '📅 Book Now' },
                  { id: 'cmd_mainmenu', title: '🏠 Main Menu' },
                ], businessPhoneNumberId)
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === 'location' || kw === 'address' || kw === 'where' || kw === 'directions' || kw === 'find us') {
              await sendInteractiveButtons(from,
                `📍 *${ctx.display_name} — Victoria Island*\n\n` +
                `67 Kofo Abayomi St, Victoria Island, Lagos\n\n` +
                `🕘 *Hours:*\n` +
                `Mon: 10:00 AM – 5:30 PM\n` +
                `Tue–Sat: 9:00 AM – 5:30 PM\n` +
                `Sun: ❌ Closed\n\n` +
                `https://maps.google.com/?q=67+Kofo+Abayomi+St+Victoria+Island+Lagos`,
                [
                  { id: 'cmd_book',     title: '📅 Book Now' },
                  { id: 'cmd_mainmenu', title: '🏠 Main Menu' },
                ], businessPhoneNumberId)
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            if (kw === 'hours' || kw === 'opening hours' || kw === 'open' || kw === 'opening times') {
              await sendInteractiveButtons(from,
                `🕘 *${ctx.display_name} — Opening Hours*\n\n` +
                `Monday: 10:00 AM – 5:30 PM\n` +
                `Tuesday–Saturday: 9:00 AM – 5:30 PM\n` +
                `Sunday: ❌ Closed`,
                [
                  { id: 'cmd_book',     title: '📅 Book Now' },
                  { id: 'cmd_mainmenu', title: '🏠 Main Menu' },
                ], businessPhoneNumberId)
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
              return NextResponse.json({ status: 'ok' })
            }
            // ── End keyword menu ────────────────────────────────────────────

            const isFirstMessage = session.state === 'greeting'

            if (isFirstMessage) {
              // New customer → show service menu; they pick a service, then the booking form opens
              await sendMainMenu()
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
            } else if (process.env.OPENAI_API_KEY) {
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
            } else {
              // No OPENAI_API_KEY set — show main menu as fallback
              await sendMainMenu()
              await supabaseAdmin.from('booking_sessions').update({ state: 'menu_shown' }).eq('id', session.id)
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

    // ── ECHOES: Interactive list_reply + cmd_* button handler ────────────────
    // Handles menu selections (list_reply) and nav buttons (cmd_*) for echoes accounts.
    if (waOwnerId && message.type === 'interactive' &&
        (message.interactive?.type === 'list_reply' ||
         (message.interactive?.type === 'button_reply' &&
           (message.interactive?.button_reply?.id ?? '').startsWith('cmd_')))) {
      const { data: echoesProfInteractive } = await supabaseAdmin
        .from('profiles')
        .select('echoes_enabled, booking_flow_id, business_display_name')
        .eq('id', waOwnerId)
        .maybeSingle()

      if (echoesProfInteractive?.echoes_enabled) {
        const selId: string =
          message.interactive?.list_reply?.id ??
          message.interactive?.button_reply?.id ?? ''
        const displayName = echoesProfInteractive.business_display_name ?? 'us'
        const flowId      = echoesProfInteractive.booking_flow_id

        const sendCat = async (cat: string) => {
          const catData = ECHOES_CATALOG[cat]
          if (!catData) { return }
          await sendInteractiveList(from, businessPhoneNumberId, {
            bodyText: `*${catData.title}*\n\nSelect a service to book at ${displayName}. All visits include a complimentary consultation. 💆‍♀️`,
            buttonText: 'Choose Service',
            sections: [{ title: 'Tap a service to book', rows: catData.rows.slice(0, 10).map(s => ({
              id: `svc_book_${s.id}`,
              title: s.name.slice(0, 24),
              description: `₦${s.price.toLocaleString()} · ${s.dur}`,
            })) }],
          })
        }
        // Fetch products from Supabase and show as interactive list for service selection
        const sendServicePicker = async () => {
          const { data: prods } = await supabaseAdmin
            .from('products')
            .select('id, name, price, currency')
            .eq('business_id', waOwnerId!)
            .eq('is_available', true)
            .order('sort_order')
            .limit(10)
          const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
          if (prods?.length) {
            await sendInteractiveList(from, businessPhoneNumberId, {
              bodyText: `*Select your treatment* at ${displayName} 💆‍♀️\n\nAll visits include a complimentary Hair Technician Consultation.`,
              buttonText: 'Choose Treatment',
              sections: [{
                title: 'Available Treatments',
                rows: prods.map(p => ({
                  id: `svc_book_${p.id}`,
                  title: p.name.slice(0, 24),
                  description: `${SYM[p.currency] ?? p.currency}${Number(p.price).toLocaleString()}`,
                })),
              }],
            })
          } else if (flowId) {
            await sendFlowMessage(from, businessPhoneNumberId, {
              metaFlowId: flowId, screen: 'BOOKING',
              ctaText: 'Book Now ✨',
              bodyText: `Book your appointment at ${displayName}`,
            })
          }
        }

        if (selId === 'cmd_book') {
          await sendServicePicker()
        } else if (selId.startsWith('cmd_book_')) {
          // cmd_book_cat_repair → show that category's interactive service list
          const cat = selId.replace('cmd_book_', '')
          if (ECHOES_CATALOG[cat]) {
            await sendCat(cat)
          } else {
            await sendServicePicker()
          }
        } else if (selId.startsWith('svc_book_') && flowId && waOwnerId) {
          const productId = selId.replace('svc_book_', '')
          const { data: prod } = await supabaseAdmin
            .from('products').select('id, name, price, currency').eq('id', productId).maybeSingle()
          // Fallback: look up in hardcoded catalog for non-Supabase services
          const catalogSvc = !prod ? CATALOG_FLAT.find(s => s.id === productId) : null
          const svcName  = prod?.name  ?? catalogSvc?.name
          const svcPrice = prod ? Number(prod.price) : (catalogSvc?.price ?? 0)
          const sym      = '₦'
          if (svcName) {
            const flowResult = await sendFlowMessage(from, businessPhoneNumberId, {
              metaFlowId: flowId, screen: 'BOOKING',
              ctaText: 'Confirm Booking ✨',
              bodyText: `*${svcName}* — ${sym}${svcPrice.toLocaleString()}\n\nFill in your name, preferred date & time. Takes 30 seconds! 🚀`,
              initialData: { service_id: productId, service_name: svcName, flow_db_id: waOwnerId },
            })
            if (flowResult?.error) {
              console.error('[echoes] flow send error (svc_book):', JSON.stringify(flowResult.error))
              await sendTextMessage(from, `I couldn't open the booking form right now. Please try again! 🙏`, businessPhoneNumberId)
            }
          } else {
            await sendTextMessage(from, `Sorry, I couldn't find that service. Type *menu* to see all options.`, businessPhoneNumberId)
          }
        } else if (selId === 'cmd_prices') {
          await sendInteractiveButtons(from,
            `*${displayName} — Treatment Prices* 💆‍♀️\n\n` +
            `*💧 Hair Repair & Hydration:*\n` +
            `• Intense Hydrating — ₦31,000\n` +
            `• Moisture S.O.S — ₦49,500\n` +
            `• Bond Builder — ₦38,500\n` +
            `• Quinoa Protein — ₦31,000\n` +
            `• Botox Volumising — ₦49,500\n` +
            `• Molecular Repair — ₦49,500\n` +
            `• Hair Detox — ₦28,000\n` +
            `• Hair Rehab — ₦38,500\n` +
            `• Trim — ₦8,800\n\n` +
            `*🔬 Scalp Health:* from ₦25,000\n` +
            `*🎨 Colour:* from ₦35,000\n` +
            `*💅 Extensions:* from ₦15,000\n` +
            `*🌀 Natural Styles:* from ₦10,000`,
            [
              { id: 'cmd_book',     title: '📅 Book Now' },
              { id: 'cmd_mainmenu', title: '🏠 Main Menu' },
            ], businessPhoneNumberId)
        } else if (selId === 'cmd_mainmenu') {
          await sendInteractiveList(from, businessPhoneNumberId, {
            bodyText:
              `*${displayName}* — how can we help you today? 👇`,
            buttonText: 'View Services',
            sections: [
              {
                title: 'Treatments',
                rows: [
                  { id: 'cat_repair',    title: '💧 Hair Repair',        description: '8 treatments from ₦28,000' },
                  { id: 'cat_scalp',     title: '🔬 Scalp Health',        description: '5 specialised treatments' },
                  { id: 'cat_smoothing', title: '✨ Texture & Smoothing',  description: '8 treatments available' },
                  { id: 'cat_colour',    title: '🎨 Colour Treatments',   description: '3 colour services' },
                  { id: 'cat_health',    title: '💪 Hair Health',         description: '4 strengthening treatments' },
                ],
              },
              {
                title: 'Styling',
                rows: [
                  { id: 'cat_extensions', title: '💅 Styles + Extensions', description: '49 styles available' },
                  { id: 'cat_natural',    title: '🌀 Natural Styles',      description: '34 styles available' },
                  { id: 'cat_takedown',   title: '✂️ Hair Take Down',      description: '15 take-down services' },
                ],
              },
              {
                title: 'Quick Actions',
                rows: [
                  { id: 'cmd_book',   title: '📅 Book Appointment', description: 'Book in under 30 seconds' },
                  { id: 'cmd_prices', title: '💰 View All Prices',  description: 'Full price list' },
                ],
              },
            ],
          })
        } else if (selId.startsWith('cat_')) {
          await sendCat(selId)
        }

        return NextResponse.json({ status: 'ok' })
      }
    }
    // ── END ECHOES interactive handler ───────────────────────────────────────

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
      // service_id, customer_name, preferred_date, preferred_time are in booking flow submissions
      const isBookingFlow = Boolean(flowData.service_id && flowData.customer_name)
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

          // Static service catalogue fallback (used when service_id is a slug, not a DB uuid)
          // Built dynamically from ECHOES_CATALOG so it always stays in sync
          const STATIC_SERVICES: Record<string, { name: string; price: number; currency: string }> =
            Object.fromEntries(CATALOG_FLAT.map(s => [s.id, { name: s.name, price: s.price, currency: 'NGN' }]))

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
          // Final fallback: static slug map
          const staticSvc = STATIC_SERVICES[serviceId]
          const serviceName  = svc?.name ?? svcMenu?.service_name ?? staticSvc?.name ?? 'Service'
          const servicePrice = Number(svc?.price ?? svcMenu?.price ?? staticSvc?.price ?? 0)
          const currency     = svc?.currency ?? svcMenu?.currency ?? staticSvc?.currency ?? 'NGN'
          const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
          const sym = SYM[currency] ?? currency

          const customerName: string  = flowData.customer_name ?? waName ?? 'Customer'
          const preferredDate: string = flowData.preferred_date ?? ''
          const preferredTime: string = flowData.preferred_time ?? ''
          // Payment method chosen via interactive button reply (sent below)
          // paymentMethod no longer in flow payload

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
            payment_gateway_provider: null, // set when customer selects payment

            status:                   'pending',
          })

          await saveInboundMessage({
            phone: from, content: `Booking: ${serviceName} on ${preferredDate} at ${preferredTime}`,
            msgType: 'form_submission', userId: bookingBusinessId,
          })

          const displayName = bProfile?.business_display_name ?? 'us'

          // Send interactive payment choice buttons (card / transfer / USSD)
          const payButtonBody =
            `Great choice! I've booked you for *${preferredDate}* at *${preferredTime}* for a *${serviceName}*.\n\n` +
            `To confirm your appointment, please complete payment of *${sym}${servicePrice.toLocaleString()}*.\n\n` +
            `Choose your preferred payment method below:`

          await fetch(`https://graph.facebook.com/v21.0/${businessPhoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: payButtonBody },
                action: {
                  buttons: [
                    { type: 'reply', reply: { id: `pay_card___${serviceId}`, title: 'Pay with Card' } },
                    { type: 'reply', reply: { id: `pay_transfer___${serviceId}`, title: 'Bank Transfer' } },
                    { type: 'reply', reply: { id: `pay_ussd___${serviceId}`, title: 'Pay with USSD' } },
                  ],
                },
              },
            }),
          })

          return NextResponse.json({ status: 'ok' })
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

    // ── Payment button reply handler ──────────────────────────────────────────
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      const btnId: string = message.interactive?.button_reply?.id ?? ''

      // Helper: send a "I've Paid" confirmation button after payment instructions
      async function sendConfirmButton(bookingId: string) {
        await fetch(`https://graph.facebook.com/v21.0/${businessPhoneNumberId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: `Once you've completed the payment, tap the button below to confirm your booking! 👇` },
              action: {
                buttons: [
                  { type: 'reply', reply: { id: `pay_confirm___${bookingId}`, title: "✅ I've Paid" } },
                ],
              },
            },
          }),
        })
      }

      // ── Step 1: Customer chooses payment method ───────────────────────────
      if (btnId.startsWith('pay_card___') || btnId.startsWith('pay_transfer___') || btnId.startsWith('pay_ussd___')) {
        const serviceId = btnId.split('___')[1] ?? ''

        const { data: bProfile } = await supabaseAdmin
          .from('profiles')
          .select('bank_name, account_number, account_name, business_display_name')
          .eq('whatsapp_phone_number_id', businessPhoneNumberId)
          .maybeSingle()

        const { data: svc } = await supabaseAdmin
          .from('products')
          .select('name, price, currency')
          .eq('id', serviceId)
          .maybeSingle()

        const symMap: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
        const currency   = svc?.currency ?? 'NGN'
        const sym        = symMap[currency] ?? currency
        const svcPrice   = Number(svc?.price ?? 0)
        const svcName    = svc?.name ?? 'Service'
        const bizName    = bProfile?.business_display_name ?? 'us'

        // Find the latest pending booking for this customer + service
        const { data: pendingBooking } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('customer_phone', from)
          .eq('service_id', serviceId)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (btnId.startsWith('pay_card___')) {
          await sendTextMessage(from,
            `💳 *Card Payment*\n\n` +
            `Amount: *${sym}${svcPrice.toLocaleString()}* for *${svcName}*\n\n` +
            `We'll send you a secure payment link shortly. Once payment is complete, tap the button below to confirm! 🙏`,
            businessPhoneNumberId)
        } else if (btnId.startsWith('pay_transfer___')) {
          const bankName = bProfile?.bank_name     ?? '(bank not set — please contact us)'
          const accNum   = bProfile?.account_number ?? '(not set)'
          const accName  = bProfile?.account_name  ?? bizName
          await sendTextMessage(from,
            `🏦 *Bank Transfer Details*\n\n` +
            `📋 *${svcName}* — ${sym}${svcPrice.toLocaleString()}\n\n` +
            `Please transfer the exact amount to:\n\n` +
            `🏦 *Bank:* ${bankName}\n` +
            `📟 *Account Number:* ${accNum}\n` +
            `👤 *Account Name:* ${accName}\n\n` +
            `After making the transfer, tap the button below to confirm! ✅`,
            businessPhoneNumberId)
        } else if (btnId.startsWith('pay_ussd___')) {
          const bankName = bProfile?.bank_name     ?? ''
          const accNum   = bProfile?.account_number ?? ''
          await sendTextMessage(from,
            `📱 *Pay with USSD*\n\n` +
            `Dial your bank's USSD code and transfer *${sym}${svcPrice.toLocaleString()}* to:\n\n` +
            `🏦 *Bank:* ${bankName}\n` +
            `📟 *Account:* ${accNum}\n\n` +
            `After paying, tap the button below to confirm! ✅`,
            businessPhoneNumberId)
        }

        if (pendingBooking?.id) {
          await sendConfirmButton(pendingBooking.id)
        }

        return NextResponse.json({ status: 'ok' })
      }

      // ── Step 2: Customer taps "I've Paid" ─────────────────────────────────
      if (btnId.startsWith('pay_confirm___')) {
        const bookingId = btnId.replace('pay_confirm___', '')

        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('id, customer_name, service_id, appointment_date, time_slot, business_id, payment_status')
          .eq('id', bookingId)
          .maybeSingle()

        if (booking) {
          // Mark booking as paid
          await supabaseAdmin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
          await supabaseAdmin.from('booking_transactions').update({ status: 'confirmed' }).eq('booking_id', bookingId)

          // Get service name for the confirmation message
          const { data: svc } = await supabaseAdmin
            .from('products').select('name').eq('id', booking.service_id).maybeSingle()
          const svcName = svc?.name ?? 'your service'

          // Send confirmation to customer
          await sendTextMessage(from,
            `🎉 *Booking Confirmed!*\n\n` +
            `Thank you, ${booking.customer_name}! Your payment has been received and your appointment is confirmed.\n\n` +
            `📋 *${svcName}*\n` +
            `📅 ${booking.appointment_date} at ${booking.time_slot}\n\n` +
            `We look forward to seeing you! See you soon 🙌`,
            businessPhoneNumberId)

          // Log the confirmation
          await saveInboundMessage({
            phone: from,
            content: `Payment confirmed for: ${svcName} on ${booking.appointment_date}`,
            msgType: 'button_reply',
            userId: booking.business_id,
          })
        }

        return NextResponse.json({ status: 'ok' })
      }
    }

  } catch (err) {
    console.error('[webhook] ERROR:', err)
  }

  return NextResponse.json({ status: 'ok' })
}
