export const dynamic = 'force-dynamic'

/**
 * app/api/webhooks/sofi/route.ts
 * 
 * Receives payment confirmation from Sofi (trysofi.co).
 * On success: marks booking as Paid, fires WhatsApp confirmation to customer.
 * This runs AUTOMATICALLY — zero human action needed.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifySofiWebhook } from '@/lib/sofi'
import { sendTextMessage } from '@/lib/whatsapp'
import { getTokenForPhoneNumberId } from '@/lib/meta-app'

export async function POST(request: Request) {
  const rawBody = await request.text()

  // 1. Verify the webhook signature (prevent fake payment notifications)
  const isValid = await verifySofiWebhook(rawBody, request.headers)
  if (!isValid) {
    console.warn('[sofi-webhook] Invalid signature rejected')
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  console.log('[sofi-webhook] received event:', payload.event, 'reference:', payload.reference)

  // Sofi sends different event names — adjust these to match your actual Sofi webhook schema
  const event     = String(payload.event ?? payload.status ?? '')
  const data = payload.data as Record<string, unknown> | undefined
  const reference = String(payload.reference ?? data?.reference ?? '')
  const isSuccess = ['payment.success', 'charge.success', 'SUCCESSFUL', 'success'].includes(event)

  if (!isSuccess || !reference) {
    console.log(`[sofi-webhook] non-success event "${event}" — ignoring`)
    return NextResponse.json({ received: true })
  }

  // 2. Load the transaction by reference
  const { data: txn, error: txnErr } = await supabaseAdmin
    .from('booking_transactions')
    .select('id, business_id, booking_id, status')
    .eq('reference', reference)
    .maybeSingle()

  if (txnErr || !txn) {
    console.error('[sofi-webhook] transaction not found for ref:', reference)
    return NextResponse.json({ received: true })
  }

  if (txn.status === 'success') {
    console.log('[sofi-webhook] already processed, skipping duplicate')
    return NextResponse.json({ received: true })
  }

  // 3. Mark transaction as success
  await supabaseAdmin
    .from('booking_transactions')
    .update({ status: 'success', gateway_response: payload, updated_at: new Date().toISOString() })
    .eq('id', txn.id)

  // 4. Mark booking as paid
  if (!txn.booking_id) {
    console.error('[sofi-webhook] no booking_id on transaction:', txn.id)
    return NextResponse.json({ received: true })
  }

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', txn.booking_id)
    .select('customer_phone, customer_name, appointment_date, time_slot, service_id, business_id')
    .single()

  if (!booking) {
    console.error('[sofi-webhook] booking not found:', txn.booking_id)
    return NextResponse.json({ received: true })
  }

  // 5. Load service name and business WA phone number to send confirmation
  const [{ data: service }, { data: waNum }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('services_menu').select('service_name').eq('id', booking.service_id).maybeSingle(),
    supabaseAdmin.from('wa_numbers').select('phone_number_id').eq('user_id', booking.business_id).eq('is_default', true).maybeSingle(),
    supabaseAdmin.from('profiles').select('business_display_name, wa_phone_number_id').eq('id', booking.business_id).maybeSingle(),
  ])

  const phoneNumberId: string | undefined = waNum?.phone_number_id ?? profile?.wa_phone_number_id ?? undefined

  // 6. Fire instant WhatsApp confirmation to the customer — fully automated
  const confirmationMsg =
    `🎉 *Booking Confirmed!*\n\n` +
    `Hi ${booking.customer_name}! Your payment was received.\n\n` +
    `📋 *${service?.service_name ?? 'Service'}*\n` +
    `📅 ${booking.appointment_date}\n` +
    `🕐 ${booking.time_slot}\n\n` +
    `We look forward to seeing you! If you need to reschedule, just message us here. 😊`

  try {
    await sendTextMessage(booking.customer_phone, confirmationMsg, phoneNumberId)
    console.log(`[sofi-webhook] confirmation sent to ${booking.customer_phone}`)
  } catch (err) {
    console.error('[sofi-webhook] failed to send WhatsApp confirmation:', err)
  }

  // 7. Also update the booking session state to confirmed
  await supabaseAdmin
    .from('booking_sessions')
    .update({ state: 'confirmed', updated_at: new Date().toISOString() })
    .eq('business_id', booking.business_id)
    .eq('customer_phone', booking.customer_phone)
    .eq('state', 'payment_sent')

  console.log(`[sofi-webhook] booking ${txn.booking_id} fully confirmed ✅`)
  return NextResponse.json({ received: true, confirmed: true })
}
