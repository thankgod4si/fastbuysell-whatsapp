export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = user.id

  // Clear existing demo data for this user
  await supabase.from('leads').delete().eq('user_id', uid)
  await supabase.from('contacts').delete().eq('user_id', uid)

  // ── WhatsApp contacts ─────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()

  const { data: waContacts } = await supabase.from('contacts').insert([
    { phone: '+4915201234567', channel: 'whatsapp', status: 'replied', sent_at: daysAgo(3), user_id: uid },
    { phone: '+4917612345678', channel: 'whatsapp', status: 'replied', sent_at: daysAgo(2), user_id: uid },
    { phone: '+4916523456789', channel: 'whatsapp', status: 'replied', sent_at: daysAgo(1), user_id: uid },
    { phone: '+4915534567890', channel: 'whatsapp', status: 'sent', sent_at: daysAgo(1), user_id: uid },
    { phone: '+4917645678901', channel: 'whatsapp', status: 'pending', sent_at: null, user_id: uid },
  ]).select()

  // ── SMS contacts ──────────────────────────────────────────────────────────
  const { data: smsContacts } = await supabase.from('contacts').insert([
    { phone: '+4916156789012', channel: 'sms', status: 'replied', sent_at: daysAgo(2), user_id: uid },
    { phone: '+4915267890123', channel: 'sms', status: 'replied', sent_at: daysAgo(1), user_id: uid },
    { phone: '+4917378901234', channel: 'sms', status: 'sent', sent_at: daysAgo(1), user_id: uid },
    { phone: '+4916489012345', channel: 'sms', status: 'pending', sent_at: null, user_id: uid },
  ]).select()

  // ── WhatsApp leads ────────────────────────────────────────────────────────
  await supabase.from('leads').insert([
    {
      contact_id: waContacts?.[0]?.id ?? null,
      phone: '+4915201234567',
      full_name: 'Thomas Becker',
      email: 'thomas.becker@gmail.com',
      car_make: 'BMW',
      car_model: '3 Series',
      car_year: '2019',
      mileage: '68000',
      asking_price: '22500',
      previous_owners: '1',
      condition: 'Well maintained, full service history, winter tyres included.',
      status: 'new',
      source: 'whatsapp',
      email_sent_at: daysAgo(1),
      user_id: uid,
      created_at: daysAgo(3),
    },
    {
      contact_id: waContacts?.[1]?.id ?? null,
      phone: '+4917612345678',
      full_name: 'Lena Hoffmann',
      email: 'l.hoffmann@web.de',
      car_make: 'Volkswagen',
      car_model: 'Golf',
      car_year: '2020',
      mileage: '42000',
      asking_price: '18900',
      previous_owners: '1',
      condition: 'No accidents. Non-smoker vehicle. Parking sensors front and back.',
      status: 'contacted',
      source: 'whatsapp',
      email_sent_at: daysAgo(1),
      user_id: uid,
      created_at: daysAgo(2),
    },
    {
      contact_id: waContacts?.[2]?.id ?? null,
      phone: '+4916523456789',
      full_name: 'Stefan Müller',
      email: 'stefan.mueller@t-online.de',
      car_make: 'Mercedes-Benz',
      car_model: 'C-Class',
      car_year: '2018',
      mileage: '91000',
      asking_price: '26000',
      previous_owners: '2',
      condition: 'Minor scratch on rear bumper. Otherwise excellent. AMG package.',
      status: 'new',
      source: 'whatsapp',
      email_sent_at: null,
      user_id: uid,
      created_at: daysAgo(1),
    },
  ])

  // ── SMS leads ─────────────────────────────────────────────────────────────
  await supabase.from('leads').insert([
    {
      contact_id: smsContacts?.[0]?.id ?? null,
      phone: '+4916156789012',
      full_name: 'Anna Schreiber',
      email: 'a.schreiber@gmx.de',
      car_make: 'Audi',
      car_model: 'A4',
      car_year: '2017',
      mileage: '115000',
      asking_price: '16500',
      previous_owners: '2',
      condition: 'Replied YES via SMS. Has service book. Needs new tyres.',
      status: 'new',
      source: 'sms',
      email_sent_at: null,
      user_id: uid,
      created_at: daysAgo(2),
    },
    {
      contact_id: smsContacts?.[1]?.id ?? null,
      phone: '+4915267890123',
      full_name: 'Marcus Vogel',
      email: 'marcus.vogel@outlook.de',
      car_make: 'Toyota',
      car_model: 'Corolla',
      car_year: '2021',
      mileage: '29000',
      asking_price: '21000',
      previous_owners: '1',
      condition: 'Replied YES via SMS. Nearly new, still under warranty.',
      status: 'contacted',
      source: 'sms',
      email_sent_at: daysAgo(1),
      user_id: uid,
      created_at: daysAgo(1),
    },
  ])

  // ── Email-sourced leads ───────────────────────────────────────────────────
  await supabase.from('leads').insert([
    {
      contact_id: null,
      phone: '+4930123456789',
      full_name: 'Klaus Richter',
      email: 'k.richter@gmail.com',
      car_make: 'Ford',
      car_model: 'Focus',
      car_year: '2019',
      mileage: '53000',
      asking_price: '13500',
      previous_owners: '1',
      condition: 'Inbound from email campaign. Clean title.',
      status: 'new',
      source: 'email',
      email_sent_at: null,
      user_id: uid,
      created_at: daysAgo(1),
    },
    {
      contact_id: null,
      phone: '+4940987654321',
      full_name: 'Julia Braun',
      email: 'julia.braun@web.de',
      car_make: 'Opel',
      car_model: 'Astra',
      car_year: '2020',
      mileage: '37000',
      asking_price: '14800',
      previous_owners: '1',
      condition: 'Inbound from email campaign. Wants quick sale before moving abroad.',
      status: 'closed',
      source: 'email',
      email_sent_at: daysAgo(3),
      user_id: uid,
      created_at: daysAgo(4),
    },
  ])

  return NextResponse.json({ ok: true, message: 'Demo data seeded — 5 contacts WhatsApp, 4 SMS, 7 leads total' })
}
