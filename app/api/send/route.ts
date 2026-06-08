import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTemplate, sendInquiryTemplate } from '@/lib/whatsapp'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, trackSend } from '@/lib/usage'

export async function POST(request: Request) {
  const { contactId, templateId } = await request.json()

  const { data: contact } = await supabase
    .from('contacts').select('*').eq('id', contactId).single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  if (contact.status !== 'pending') {
    return NextResponse.json({ error: 'Message already sent to this contact' }, { status: 400 })
  }

  if (contact.user_id) {
    const check = await checkCanSend(contact.user_id)
    if (!check.allowed) {
      return NextResponse.json({
        error: check.reason,
        code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached',
      }, { status: 403 })
    }
  }

  // Resolve which WA number to use
  let phoneNumberId: string | undefined
  if (contact.user_id) {
    // Prefer the user's default number from wa_numbers table
    const { data: waNum } = await supabase
      .from('wa_numbers')
      .select('phone_number_id')
      .eq('user_id', contact.user_id)
      .eq('verified', true)
      .eq('is_default', true)
      .single()

    if (waNum?.phone_number_id) {
      phoneNumberId = waNum.phone_number_id
    } else {
      // Fall back to profile wa_phone_number_id
      const { data: profile } = await supabase
        .from('profiles').select('wa_phone_number_id, wa_verified').eq('id', contact.user_id).single()
      if (profile?.wa_verified && profile.wa_phone_number_id) {
        phoneNumberId = profile.wa_phone_number_id
      }
    }
  }

  // Resolve which template to use
  let result: Record<string, unknown>
  if (templateId) {
    const { data: tpl } = await supabase
      .from('templates')
      .select('wa_template_name, language, wa_status')
      .eq('id', templateId)
      .single()

    if (!tpl || tpl.wa_status !== 'approved') {
      return NextResponse.json({ error: 'Template not approved by Meta yet' }, { status: 400 })
    }
    result = await sendTemplate(contact.phone, tpl.wa_template_name, tpl.language, [], phoneNumberId)
  } else {
    // Fall back to platform default template
    result = await sendInquiryTemplate(contact.phone, phoneNumberId)
  }

  if (result.error) {
    return NextResponse.json({ error: (result.error as { message?: string }).message ?? 'Send failed' }, { status: 500 })
  }

  const wamid = (result.messages as Array<{ id: string }>)?.[0]?.id

  await Promise.all([
    supabase.from('contacts').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', contactId),
    createMessageLog({ contactId, channel: 'whatsapp', externalId: wamid, recipient: contact.phone, userId: contact.user_id }),
    contact.user_id ? trackSend(contact.user_id) : Promise.resolve(),
  ])

  return NextResponse.json({ success: true })
}
