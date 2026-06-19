import { supabaseAdmin } from './supabase-admin'

export interface CustomerProfile {
  id: string
  business_id: string
  phone: string
  full_name: string | null
  wa_name: string | null
  hair_type: string | null
  preferred_stylist: string | null
  loyalty_tier: string
  last_visit_date: string | null
  birthday: string | null
}

export interface HairTimelineEntry {
  event_date: string
  service_name: string | null
  event_type: string
  notes: string | null
}

/** Create or update a customer profile when they book or message */
export async function upsertCustomerProfile(opts: {
  businessId: string
  phone: string
  fullName?: string | null
  waName?: string | null
}) {
  const { data } = await supabaseAdmin
    .from('customer_profiles')
    .upsert({
      business_id: opts.businessId,
      phone: opts.phone,
      full_name: opts.fullName ?? undefined,
      wa_name: opts.waName ?? undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'business_id,phone' })
    .select('id')
    .single()

  if (data?.id) {
    await supabaseAdmin.from('customer_wallets').upsert({
      customer_id: data.id,
      business_id: opts.businessId,
      balance: 0,
      currency: 'NGN',
    }, { onConflict: 'customer_id', ignoreDuplicates: true })
  }

  return data?.id ?? null
}

/** Append to hair timeline after a confirmed booking */
export async function addHairTimelineEntry(opts: {
  businessId: string
  customerId: string
  bookingId?: string
  serviceName: string
  serviceId?: string
  eventDate?: string
  stylist?: string
}) {
  await supabaseAdmin.from('hair_timeline').insert({
    business_id:  opts.businessId,
    customer_id:  opts.customerId,
    booking_id:   opts.bookingId ?? null,
    event_type:   'appointment',
    service_name: opts.serviceName,
    service_id:   opts.serviceId ?? null,
    stylist:      opts.stylist ?? null,
    event_date:   opts.eventDate ?? new Date().toISOString().slice(0, 10),
  })

  await supabaseAdmin.from('customer_profiles')
    .update({ last_visit_date: opts.eventDate ?? new Date().toISOString().slice(0, 10) })
    .eq('id', opts.customerId)
}

/** Load profile + recent timeline for AI context injection */
export async function loadCustomerContext(businessId: string, phone: string) {
  const { data: profile } = await supabaseAdmin
    .from('customer_profiles')
    .select('id, full_name, wa_name, hair_type, preferred_stylist, loyalty_tier, last_visit_date, birthday')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) return null

  const [{ data: timeline }, { data: wallet }] = await Promise.all([
    supabaseAdmin
      .from('hair_timeline')
      .select('event_date, service_name, event_type, notes')
      .eq('customer_id', profile.id)
      .order('event_date', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('customer_wallets')
      .select('balance, currency')
      .eq('customer_id', profile.id)
      .maybeSingle(),
  ])

  return {
    profile: profile as CustomerProfile,
    timeline: (timeline ?? []) as HairTimelineEntry[],
    walletBalance: wallet ? Number(wallet.balance) : 0,
    walletCurrency: wallet?.currency ?? 'NGN',
  }
}

export function formatCustomerContextForAI(ctx: NonNullable<Awaited<ReturnType<typeof loadCustomerContext>>>): string {
  const p = ctx.profile
  const name = p.full_name ?? p.wa_name ?? 'Customer'
  const lines: string[] = [
    `CUSTOMER PROFILE (use to personalise — never invent missing data):`,
    `- Name: ${name}`,
  ]
  if (p.hair_type) lines.push(`- Hair type: ${p.hair_type}`)
  if (p.preferred_stylist) lines.push(`- Preferred stylist: ${p.preferred_stylist}`)
  if (p.last_visit_date) lines.push(`- Last visit: ${p.last_visit_date}`)
  if (p.loyalty_tier) lines.push(`- Loyalty: ${p.loyalty_tier}`)
  if (p.birthday) lines.push(`- Birthday: ${p.birthday}`)
  if (ctx.walletBalance > 0) lines.push(`- Wallet balance: ₦${ctx.walletBalance.toLocaleString()}`)

  if (ctx.timeline.length) {
    lines.push('', 'HAIR TIMELINE (most recent first):')
    for (const e of ctx.timeline) {
      const d = new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      lines.push(`- ${d} → ${e.service_name ?? e.event_type}${e.notes ? ` (${e.notes})` : ''}`)
    }
  }

  return lines.join('\n')
}
