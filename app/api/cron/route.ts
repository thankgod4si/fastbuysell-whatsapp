export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 10 // Max 10 messages per minute to avoid Meta flagging

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch pending outbound messages from message_logs
  const { data: pendingMessages, error } = await supabase
    .from('message_logs')
    .select('*, contacts(*)')
    .eq('status', 'pending')
    .eq('direction', 'outbound')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('Error fetching pending messages:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!pendingMessages || pendingMessages.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Queue empty' })
  }

  let sent = 0
  let failed = 0
  const results: Array<{ id: string; recipient: string; status: string; reason?: string }> = []

  // Process each pending message
  for (const msg of pendingMessages) {
    try {
      // Get phone number ID from user's profile
      let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
      if (msg.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wa_phone_number_id')
          .eq('id', msg.user_id)
          .single()
        if (profile?.wa_phone_number_id) {
          phoneNumberId = profile.wa_phone_number_id
        }
      }

      // Send via WhatsApp API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: msg.recipient,
            type: 'text',
            text: { body: msg.content || '' }
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        // Mark as failed
        await supabase
          .from('message_logs')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: result.error?.message || 'WhatsApp API error'
          })
          .eq('id', msg.id)
        failed++
        results.push({ id: msg.id, recipient: msg.recipient, status: 'failed', reason: result.error?.message })
      } else {
        // Update status to 'sent' and save external_id (wamid)
        const wamid = result.messages?.[0]?.id
        await supabase
          .from('message_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: wamid
          })
          .eq('id', msg.id)
        sent++
        results.push({ id: msg.id, recipient: msg.recipient, status: 'sent' })
      }
    } catch (error) {
      // Mark as failed on error
      await supabase
        .from('message_logs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', msg.id)
      failed++
      results.push({ id: msg.id, recipient: msg.recipient, status: 'failed', reason: error instanceof Error ? error.message : 'Unknown error' })
    }

    // Small delay between messages (300ms)
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ 
    sent, 
    failed, 
    total: pendingMessages.length,
    batch_size: BATCH_SIZE,
    results 
  })
}
