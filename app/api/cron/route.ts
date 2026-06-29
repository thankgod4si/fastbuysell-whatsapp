export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, trackSend } from '@/lib/usage'

const INVALID_NUMBER_CODES = [131026, 131047, 100, 470]
const BATCH_SIZE = 100
const BATCH_DELAY_MS = 30000 // 30 seconds

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all pending contacts up to batch size
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Queue empty' })
  }

  let sent = 0
  let failed = 0
  let blacklisted = 0
  const results: Array<{ phone: string; status: string; reason?: string }> = []

  // Process contacts in batches
  for (const contact of contacts) {
    // Check user subscription and limits
    if (contact.user_id) {
      const check = await checkCanSend(contact.user_id)
      if (!check.allowed) {
        // Skip this user's contact — mark as failed so cron moves on
        await supabase
          .from('contacts')
          .update({ status: 'blacklisted' })
          .eq('id', contact.id)
        failed++
        results.push({ phone: contact.phone, status: 'skipped', reason: check.reason })
        continue
      }
    }

    // Get phone number ID for this user
    let phoneNumberId: string | undefined
    if (contact.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wa_phone_number_id, wa_verified')
        .eq('id', contact.user_id)
        .single()
      if (profile?.wa_verified && profile.wa_phone_number_id) {
        phoneNumberId = profile.wa_phone_number_id
      }
    }

    // Send message
    const result = await sendInquiryTemplate(contact.phone, phoneNumberId)

    if (result.error) {
      const code = result.error.code
      if (INVALID_NUMBER_CODES.includes(code)) {
        await supabase
          .from('contacts')
          .update({ status: 'blacklisted' })
          .eq('id', contact.id)
        blacklisted++
        results.push({ phone: contact.phone, status: 'blacklisted', reason: result.error.message })
      } else {
        failed++
        results.push({ phone: contact.phone, status: 'failed', reason: result.error.message })
      }
    } else {
      const wamid: string | undefined = result.messages?.[0]?.id

      await Promise.all([
        supabase
          .from('contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', contact.id),
        createMessageLog({
          contactId: contact.id,
          channel: 'whatsapp',
          externalId: wamid,
          recipient: contact.phone,
          userId: contact.user_id,
        }),
        contact.user_id ? trackSend(contact.user_id) : Promise.resolve(),
      ])

      sent++
      results.push({ phone: contact.phone, status: 'sent' })
    }

    // Add delay between messages (300ms)
    await new Promise(r => setTimeout(r, 300))
  }

  // If we processed a full batch, wait 30 seconds before returning
  // This allows the cron job to space out large queues
  if (contacts.length === BATCH_SIZE) {
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
  }

  return NextResponse.json({ 
    sent, 
    failed, 
    blacklisted, 
    total: contacts.length,
    batch_size: BATCH_SIZE,
    results 
  })
}
