export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { sendTextMessage } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, deductCredits } from '@/lib/usage'

export async function POST(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, message, mediaId, mediaType, caption } = await request.json()
  if (!contactId || (!message?.trim() && !mediaId)) {
    return NextResponse.json({ error: 'contactId and message or mediaId required' }, { status: 400 })
  }

  const { data: contact } = await supabase
    .from('contacts').select('*').eq('id', contactId).eq('user_id', user.id).single()
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Resolve user's WA phone number ID
  let phoneNumberId: string | undefined
  const { data: waNum } = await supabase
    .from('wa_numbers').select('phone_number_id')
    .eq('user_id', user.id).eq('verified', true).eq('is_default', true).single()
  if (waNum?.phone_number_id) {
    phoneNumberId = waNum.phone_number_id
  } else {
    const { data: profile } = await supabase
      .from('profiles').select('wa_phone_number_id, wa_verified').eq('id', user.id).single()
    if (profile?.wa_verified && profile.wa_phone_number_id) {
      phoneNumberId = profile.wa_phone_number_id
    }
  }

  if (!phoneNumberId) {
    return NextResponse.json({
      error: 'No WhatsApp number configured. Go to Settings to add and verify your number before replying.',
      code: 'wa_number_not_configured',
    }, { status: 403 })
  }

  const check = await checkCanSend(user.id)
  if (!check.allowed) {
    return NextResponse.json({
      error: check.reason,
      code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached',
    }, { status: 403 })
  }

  console.log(`[reply] to=${contact.phone} phoneNumberId=${phoneNumberId} msg="${message?.trim().slice(0,50)}" mediaId=${mediaId}`)
  
  let result
  if (mediaId && mediaType) {
    // Send media message
    const mediaPayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: contact.phone,
      type: mediaType,
      [mediaType]: {
        id: mediaId,
      }
    }
    if (caption) {
      (mediaPayload[mediaType] as Record<string, unknown>).caption = caption
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaPayload),
      }
    )
    result = await response.json()
    
    if (!response.ok) {
      console.error(`[reply] Media error:`, JSON.stringify(result.error))
      return NextResponse.json({ error: result.error?.message || 'Send failed' }, { status: 500 })
    }
  } else {
    // Send text message
    result = await sendTextMessage(contact.phone, message.trim(), phoneNumberId)
    if ((result as { error?: { message?: string } }).error) {
      console.error(`[reply] Meta error:`, JSON.stringify((result as { error: unknown }).error))
      return NextResponse.json({ error: (result as { error: { message?: string } }).error.message ?? 'Send failed' }, { status: 500 })
    }
  }
  
  console.log(`[reply] sent wamid=${(result.messages as Array<{id:string}>)?.[0]?.id}`)

  const wamid = (result.messages as Array<{ id: string }>)?.[0]?.id

  if ((check.remaining ?? 0) <= 0 && check.credits && check.credits > 0) {
    await deductCredits(user.id, 1)
  }

  await createMessageLog({
    contactId: contact.id,
    channel:   'whatsapp',
    externalId: wamid,
    recipient: contact.phone,
    userId:    user.id,
    direction: 'outbound',
    msgType:   'text',
    content:   message.trim(),
  })

  return NextResponse.json({ success: true })
}
