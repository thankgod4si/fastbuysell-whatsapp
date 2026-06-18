export const dynamic = 'force-dynamic'

/**
 * POST /api/booking-flow
 * Creates or refreshes the WhatsApp booking flow for the logged-in business.
 * Call this after adding/removing products or changing business details.
 */
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createAndPublishBookingFlow } from '@/lib/whatsapp-flows'
import { getTokenForPhoneNumberId } from '@/lib/meta-app'

export async function POST() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load business profile + their products
  const [{ data: profile }, { data: products }] = await Promise.all([
    supabaseAdmin.from('profiles').select('business_display_name, booking_flow_id, wa_phone_number_id').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('id, name, price, currency, duration_mins, description, image_url, is_popular').eq('business_id', user.id).eq('is_available', true).order('sort_order'),
  ])

  if (!products?.length) {
    return NextResponse.json({ error: 'Add at least one product or service before creating the booking flow.' }, { status: 400 })
  }

  // Get access token for this business's WA number
  let token: string | undefined
  if (profile?.wa_phone_number_id) {
    token = await getTokenForPhoneNumberId(profile.wa_phone_number_id)
  }

  const result = await createAndPublishBookingFlow({
    businessName:   profile?.business_display_name ?? 'Our Business',
    items: products.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      duration_mins: p.duration_mins,
      description: p.description,
      image_url: p.image_url,
      is_popular: p.is_popular,
    })),
    existingFlowId: profile?.booking_flow_id ?? null,
    token,
    flowDbId:       user.id,  // we use business user.id in payload so webhook can resolve it
  })

  if (result.error) {
    console.error('[booking-flow] error:', result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Save the meta_flow_id to profiles
  await supabaseAdmin.from('profiles').update({ booking_flow_id: result.metaFlowId }).eq('id', user.id)

  return NextResponse.json({ success: true, metaFlowId: result.metaFlowId })
}
