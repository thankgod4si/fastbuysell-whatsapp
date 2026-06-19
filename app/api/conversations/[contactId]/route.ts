export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get contact's phone
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, phone, wa_name, name, status, created_at')
    .eq('id', contactId)
    .eq('user_id', user.id)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const { data: messages } = await supabase
    .from('message_logs')
    .select('id, direction, content, msg_type, status, channel, sent_at, delivered_at, read_at')
    .eq('recipient', contact.phone)
    .eq('user_id', user.id)
    .order('sent_at', { ascending: true })

  const today = new Date().toISOString().slice(0, 10)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_phone, service_id, appointment_date, time_slot, payment_status, created_at')
    .eq('business_id', user.id)
    .eq('customer_phone', contact.phone)
    .order('appointment_date', { ascending: false })

  const upcoming = (bookings ?? []).filter(b =>
    b.appointment_date >= today && b.payment_status !== 'failed' && b.payment_status !== 'refunded',
  )
  const activeBooking = upcoming.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0] ?? null

  const { data: profile, error: profileErr } = await supabase
    .from('customer_profiles')
    .select('id, full_name, wa_name, hair_type, preferred_stylist, loyalty_tier, last_visit_date')
    .eq('business_id', user.id)
    .eq('phone', contact.phone)
    .maybeSingle()

  return NextResponse.json({
    contact,
    messages: messages ?? [],
    activeBooking,
    upcomingBookings: upcoming,
    pastBookings: (bookings ?? []).filter(b => b.appointment_date < today),
    customerProfile: profileErr ? null : profile,
  })
}
