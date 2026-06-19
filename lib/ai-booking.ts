/**
 * lib/ai-booking.ts
 * 
 * THE AI BRAIN for Echoes.
 * 
 * KEY CONCEPT — "How do we train the AI for each business?"
 * Answer: We do NOT train a model. We use PROMPT ENGINEERING.
 * 
 * Each business gets a dynamic system prompt auto-built from:
 *   - profiles.business_display_name, business_type, business_address, business_hours
 *   - services_menu rows (name, price, duration)
 *   - profiles.ai_system_prompt (optional custom override)
 * 
 * The AI (GPT-4o) reads this context on EVERY message and responds ONLY
 * about that business. A Lagos salon gets Naira prices + Nigerian context.
 * A Berlin spa gets Euro prices + German context. Zero cross-contamination.
 * 
 * Conversation continuity is maintained by storing the last 8 exchanges
 * in booking_sessions.context_messages (persisted in Supabase).
 */

import OpenAI from 'openai'
import { supabaseAdmin } from './supabase-admin'
import { loadCustomerContext, formatCustomerContextForAI } from './customer-profile'

// Lazy-initialize so build doesn't fail without OPENAI_API_KEY in env
let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  return _openai
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BookingIntent {
  action: 'greet' | 'show_menu' | 'select_service' | 'collect_details' | 'confirm_payment' | 'general_reply' | 'cancel'
  customer_name?: string
  service_name?: string           // matched against services_menu
  preferred_date?: string         // ISO format YYYY-MM-DD if detected
  preferred_time?: string         // HH:MM if detected
  reply_to_customer: string       // The exact message to send back via WhatsApp
  confidence: number              // 0–1
}

export interface BusinessContext {
  business_id: string
  display_name: string
  business_type: string
  address: string
  hours: Record<string, string>
  services: Array<{
    id: string
    name: string
    price: number
    currency: string
    duration_mins: number
    is_popular: boolean
  }>
  custom_system_prompt?: string | null
  phone_number_id: string
  access_token?: string
  booking_flow_id?: string | null
  bank_name?: string | null
  account_number?: string | null
  account_name?: string | null
}

export interface SessionState {
  id: string
  state: string
  collected_data: Record<string, string>
  context_messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

// ─── Load full business context from DB ────────────────────────────────────

export async function loadBusinessContext(businessId: string, phoneNumberId: string): Promise<BusinessContext | null> {
  const [{ data: profile }, { data: services }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, business_display_name, business_type, business_address, business_hours, ai_system_prompt, booking_flow_id, bank_name, account_number, account_name')
      .eq('id', businessId)
      .eq('echoes_enabled', true)
      .maybeSingle(),
    supabaseAdmin
      .from('services_menu')
      .select('id, service_name, price, currency, duration_mins, is_popular')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('sort_order'),
    supabaseAdmin
      .from('products')
      .select('id, name, price, currency, duration_mins, is_popular')
      .eq('business_id', businessId)
      .eq('is_available', true)
      .order('sort_order'),
  ])

  if (!profile) return null

  const menuServices = (services ?? []).length
    ? (services ?? []).map(s => ({
        id: s.id,
        name: s.service_name,
        price: Number(s.price),
        currency: s.currency ?? 'NGN',
        duration_mins: s.duration_mins ?? 60,
        is_popular: s.is_popular ?? false,
      }))
    : (products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency ?? 'NGN',
        duration_mins: p.duration_mins ?? 60,
        is_popular: p.is_popular ?? false,
      }))
  return {
    business_id: businessId,
    display_name: profile.business_display_name ?? 'Our Business',
    business_type: profile.business_type ?? 'salon',
    address: profile.business_address ?? '',
    hours: (profile.business_hours as Record<string, string>) ?? {},
    services: menuServices,
    custom_system_prompt: profile.ai_system_prompt,
    phone_number_id: phoneNumberId,
    booking_flow_id: profile.booking_flow_id ?? null,
    bank_name:       profile.bank_name ?? null,
    account_number:  profile.account_number ?? null,
    account_name:    profile.account_name ?? null,
  }
}

// ─── Build the per-business system prompt ──────────────────────────────────
// This is the "training" — no ML, just structured context injection.

const HAIR_CONSULTANT_PERSONA = `You are a personal AI Hair Consultant and Customer Retention Assistant for a premium salon.

Your goals: help with hair questions, improve experience, encourage repeat appointments and product sales — always helpful first, never pushy.

REVENUE MINDSET (every reply should move toward a booking or upsell when natural):
- Answer the question first, then suggest ONE relevant service or add-on with a clear reason
- If they have an active booking, help them pay/confirm or prepare — don't push a second booking
- If last visit was 4+ weeks ago for braids/extensions, mention takedown or refresh
- If they ask price, show the service + invite them to book ("Want me to find you a slot?")
- If unsure what they need, ask one clarifying question then recommend your best-fit treatment
- Never be salesy — be the expert friend who happens to know exactly what they need

CONVERSATION FLOW:
1. Understand the problem or request
2. Ask 1–2 follow-up questions if needed
3. Give useful, honest advice (never invent medical diagnoses — recommend a professional for serious symptoms)
4. Recommend a service or product only when relevant, and explain WHY using their history
5. Offer to book when appropriate — never pressure

Use their hair timeline and profile when available. Reference past styles naturally ("your knotless braids from 6 weeks ago").
Keep replies short, warm, WhatsApp-friendly. Max 3 sentences unless explaining a treatment.`

function buildSystemPrompt(ctx: BusinessContext, session: SessionState, customerBlock?: string): string {
  const currency = ctx.services[0]?.currency ?? 'NGN'
  const currencySymbol: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
  const sym = currencySymbol[currency] ?? currency

  const menuLines = ctx.services.map(s =>
    `  • ${s.name} — ${sym}${s.price.toLocaleString()} (${s.duration_mins} mins)${s.is_popular ? ' ⭐ Popular' : ''}`
  ).join('\n')

  const hoursText = Object.entries(ctx.hours)
    .map(([day, hrs]) => `${day}: ${hrs}`)
    .join(', ')

  const isSalon = /salon|hair|trichology|beauty|spa/i.test(ctx.business_type ?? '')
  const persona = ctx.custom_system_prompt ??
    (isSalon
      ? HAIR_CONSULTANT_PERSONA.replace('a premium salon', `${ctx.display_name}, a premium ${ctx.business_type}`)
      : `You are the friendly, professional AI booking assistant for ${ctx.display_name}, a premium ${ctx.business_type} located at ${ctx.address}.`)

  const currentData = JSON.stringify(session.collected_data)

  return `${persona}

BUSINESS INFORMATION:
- Name: ${ctx.display_name}
- Type: ${ctx.business_type}
- Location: ${ctx.address}
- Hours: ${hoursText || 'Please call for hours'}

SERVICES MENU:
${menuLines || '  No services configured yet.'}
${customerBlock ? `\n${customerBlock}\n` : ''}
BOOKING CONVERSATION RULES:
1. You ONLY help customers of ${ctx.display_name}. Never discuss other businesses.
2. Keep messages SHORT and WhatsApp-friendly (no markdown in replies, emojis sparingly).
3. For bookings: collect service → name → date & time, then confirm.
4. If a customer asks about pricing, show relevant menu items with prices in ${currency}.
5. Be warm and personal. Use customer history when provided.

CURRENT BOOKING DATA COLLECTED SO FAR:
${currentData}

CURRENT CONVERSATION STATE: ${session.state}

Respond in JSON with fields: action, reply_to_customer, and optionally customer_name, service_name, preferred_date, preferred_time.
IMPORTANT: reply_to_customer must be ONLY the WhatsApp message text — no JSON, no markdown.`
}

// ─── Get or create a booking session ───────────────────────────────────────

export async function getOrCreateSession(businessId: string, customerPhone: string): Promise<SessionState> {
  const { data: existing } = await supabaseAdmin
    .from('booking_sessions')
    .select('id, state, collected_data, context_messages')
    .eq('business_id', businessId)
    .eq('customer_phone', customerPhone)
    .not('state', 'in', '("confirmed","cancelled")')
    .maybeSingle()

  if (existing) {
    return {
      id: existing.id,
      state: existing.state,
      collected_data: (existing.collected_data as Record<string, string>) ?? {},
      context_messages: (existing.context_messages as Array<{ role: 'user' | 'assistant'; content: string }>) ?? [],
    }
  }

  const { data: newSession } = await supabaseAdmin
    .from('booking_sessions')
    .insert({ business_id: businessId, customer_phone: customerPhone, state: 'greeting' })
    .select('id, state, collected_data, context_messages')
    .single()

  return {
    id: newSession!.id,
    state: 'greeting',
    collected_data: {},
    context_messages: [],
  }
}

// ─── Save session state ─────────────────────────────────────────────────────

async function saveSession(
  sessionId: string,
  updates: Partial<{ state: string; collected_data: Record<string, unknown>; context_messages: unknown[]; selected_service_id: string | null }>
) {
  await supabaseAdmin
    .from('booking_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}

// ─── Match service name to DB record ───────────────────────────────────────

function matchService(serviceName: string | undefined, services: BusinessContext['services']) {
  if (!serviceName) return null
  const lower = serviceName.toLowerCase()
  return services.find(s =>
    s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
  ) ?? null
}

// ─── Core AI processing function ───────────────────────────────────────────

export async function processBookingMessage(
  customerMessage: string,
  ctx: BusinessContext,
  session: SessionState,
  customerPhone?: string,
): Promise<{ intent: BookingIntent; updatedSession: SessionState }> {
  let customerBlock: string | undefined
  if (customerPhone) {
    try {
      const custCtx = await loadCustomerContext(ctx.business_id, customerPhone)
      if (custCtx) customerBlock = formatCustomerContextForAI(custCtx)
    } catch { /* customer_profiles table may not exist yet */ }
  }

  const systemPrompt = buildSystemPrompt(ctx, session, customerBlock)

  // Build the context window (last 8 exchanges + current message)
  const conversationHistory = session.context_messages.slice(-8)

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: customerMessage },
  ]

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',       // Fast & cheap for MVP. Swap to gpt-4o for production.
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.3,           // Low temperature = more consistent, less hallucination
    max_tokens: 400,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let intent: BookingIntent

  try {
    intent = JSON.parse(raw) as BookingIntent
    // Guarantee we always have a reply
    if (!intent.reply_to_customer) {
      intent.reply_to_customer = "I'm here to help! Would you like to see our services or book an appointment?"
    }
  } catch {
    intent = {
      action: 'general_reply',
      reply_to_customer: "Sorry, I had a small hiccup! Can you say that again? 😊",
      confidence: 0,
    }
  }

  // Update collected data from extracted intent
  const updatedData = { ...session.collected_data }
  if (intent.customer_name) updatedData.customer_name = intent.customer_name
  if (intent.service_name)  updatedData.service_name  = intent.service_name
  if (intent.preferred_date) updatedData.preferred_date = intent.preferred_date
  if (intent.preferred_time) updatedData.preferred_time = intent.preferred_time

  // Match service to DB ID
  let serviceId: string | null = session.collected_data.service_id ?? null
  if (intent.service_name && !serviceId) {
    const matched = matchService(intent.service_name, ctx.services)
    if (matched) {
      serviceId = matched.id
      updatedData.service_id = matched.id
      updatedData.service_price = String(matched.price)
      updatedData.service_currency = matched.currency
    }
  }

  // Determine next state
  let nextState = session.state
  const hasService = !!updatedData.service_id
  const hasName    = !!updatedData.customer_name
  const hasTime    = !!(updatedData.preferred_date && updatedData.preferred_time)

  if (intent.action === 'cancel') {
    nextState = 'cancelled'
  } else if (hasService && hasName && hasTime) {
    nextState = 'payment_sent'   // Caller will trigger payment and flip to 'confirmed'
  } else if (hasService) {
    nextState = 'collecting_details'
  } else {
    nextState = 'menu_shown'
  }

  // Build updated context window
  const updatedMessages = [
    ...conversationHistory,
    { role: 'user' as const, content: customerMessage },
    { role: 'assistant' as const, content: intent.reply_to_customer },
  ].slice(-10) // keep last 10 entries

  const updatedSession: SessionState = {
    ...session,
    state: nextState,
    collected_data: updatedData,
    context_messages: updatedMessages,
  }

  // Persist session
  await saveSession(session.id, {
    state: nextState,
    collected_data: updatedData,
    context_messages: updatedMessages,
    selected_service_id: serviceId,
  })

  return { intent, updatedSession }
}
