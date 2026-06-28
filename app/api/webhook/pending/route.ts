export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendTextMessage, sendTemplate } from '@/lib/whatsapp'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!

export async function POST(request: Request) {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    console.error('[webhook/pending] Unauthorized: invalid or missing secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    console.log('[webhook/pending] Full payload:', JSON.stringify(payload))

    // Supabase webhook payload structure - handle both formats
    let record = payload.record
    if (!record && payload.data && payload.data.record) {
      record = payload.data.record
    }
    if (!record && payload.data && Array.isArray(payload.data) && payload.data[0]) {
      record = payload.data[0]
    }

    if (!record) {
      console.error('[webhook/pending] No record in payload, full payload:', JSON.stringify(payload))
      return NextResponse.json({ error: 'No record in payload' }, { status: 400 })
    }

    // Only process pending messages
    if (record.status !== 'pending') {
      console.log(`[webhook/pending] Skipping record with status: ${record.status}`)
      return NextResponse.json({ status: 'skipped' })
    }

    const { id, recipient, content, channel, msg_type, user_id, contact_id } = record

    if (!recipient || !content) {
      console.error('[webhook/pending] Missing recipient or content')
      await supabaseAdmin
        .from('message_logs')
        .update({ 
          status: 'failed', 
          failure_reason: 'Missing recipient or content',
          sent_at: new Date().toISOString()
        })
        .eq('id', id)
      return NextResponse.json({ error: 'Missing recipient or content' }, { status: 400 })
    }

    // Only process WhatsApp messages
    if (channel !== 'whatsapp') {
      console.log(`[webhook/pending] Skipping non-WhatsApp channel: ${channel}`)
      return NextResponse.json({ status: 'skipped' })
    }

    // Resolve WhatsApp phone number ID to use
    let phoneNumberId: string | undefined
    if (user_id) {
      // Try wa_numbers table first
      const { data: waNum } = await supabaseAdmin
        .from('wa_numbers')
        .select('phone_number_id')
        .eq('user_id', user_id)
        .eq('verified', true)
        .eq('is_default', true)
        .maybeSingle()

      if (waNum?.phone_number_id) {
        phoneNumberId = waNum.phone_number_id
      } else {
        // Fall back to profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('wa_phone_number_id, wa_verified')
          .eq('id', user_id)
          .maybeSingle()
        if (profile?.wa_verified && profile.wa_phone_number_id) {
          phoneNumberId = profile.wa_phone_number_id
        }
      }
    }

    // Use default from env if no user-specific number
    if (!phoneNumberId) {
      phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    }

    if (!phoneNumberId) {
      console.error('[webhook/pending] No WhatsApp phone number ID available')
      await supabaseAdmin
        .from('message_logs')
        .update({ 
          status: 'failed', 
          failure_reason: 'No WhatsApp phone number configured',
          sent_at: new Date().toISOString()
        })
        .eq('id', id)
      return NextResponse.json({ error: 'No WhatsApp phone number configured' }, { status: 500 })
    }

    // Send the message
    let result: Record<string, unknown>
    
    // If it's a template message, use sendTemplate
    if (msg_type === 'template' && record.wa_template_name) {
      result = await sendTemplate(
        recipient,
        record.wa_template_name,
        record.language || 'en_US',
        [],
        phoneNumberId
      )
    } else {
      // Otherwise send as text message
      result = await sendTextMessage(recipient, content, phoneNumberId)
    }

    // Check for errors
    if (result.error) {
      console.error(`[webhook/pending] WhatsApp API error:`, JSON.stringify(result.error))
      await supabaseAdmin
        .from('message_logs')
        .update({ 
          status: 'failed', 
          failure_reason: JSON.stringify(result.error),
          sent_at: new Date().toISOString()
        })
        .eq('id', id)
      return NextResponse.json({ error: 'WhatsApp send failed' }, { status: 500 })
    }

    // Success - update status to sent
    const wamid = (result.messages as Array<{ id: string }>)?.[0]?.id
    await supabaseAdmin
      .from('message_logs')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString(),
        external_id: wamid
      })
      .eq('id', id)

    console.log(`[webhook/pending] Successfully sent message to ${recipient}, wamid: ${wamid}`)
    return NextResponse.json({ success: true, wamid })

  } catch (error) {
    console.error('[webhook/pending] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
