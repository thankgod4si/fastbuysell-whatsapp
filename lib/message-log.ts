import { supabase } from './supabase'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'opened'

export async function createMessageLog(params: {
  contactId?: string | null
  leadId?: string | null
  channel: 'whatsapp' | 'email' | 'sms'
  externalId?: string | null
  recipient: string
  userId?: string | null
  content?: string | null
  direction?: 'outbound' | 'inbound'
  msgType?: string
}) {
  await supabase.from('message_logs').insert({
    contact_id: params.contactId ?? null,
    lead_id:    params.leadId    ?? null,
    channel:    params.channel,
    external_id: params.externalId ?? null,
    recipient:  params.recipient,
    status:     'sent',
    sent_at:    new Date().toISOString(),
    user_id:    params.userId ?? null,
    direction:  params.direction ?? 'outbound',
    msg_type:   params.msgType   ?? 'template',
    content:    params.content   ?? null,
  })
}

export async function saveInboundMessage(params: {
  contactId?: string | null
  phone: string
  content: string
  msgType: 'text' | 'button_reply' | 'form_submission'
  userId?: string | null
}) {
  await supabase.from('message_logs').insert({
    contact_id:  params.contactId ?? null,
    channel:     'whatsapp',
    recipient:   params.phone,
    direction:   'inbound',
    content:     params.content,
    msg_type:    params.msgType,
    status:      'read',
    sent_at:     new Date().toISOString(),
    user_id:     params.userId ?? null,
  })
}

export async function updateMessageStatus(
  externalId: string,
  status: MessageStatus,
  extra?: { timestamp?: number; reason?: string }
) {
  const ts = extra?.timestamp
    ? new Date(extra.timestamp * 1000).toISOString()
    : new Date().toISOString()

  const update: Record<string, unknown> = { status }
  if (status === 'delivered') update.delivered_at = ts
  if (status === 'read') update.read_at = ts
  if (status === 'failed' || status === 'bounced') {
    update.failed_at = ts
    if (extra?.reason) update.failure_reason = extra.reason
  }
  if (status === 'opened') update.read_at = ts

  await supabase.from('message_logs').update(update).eq('external_id', externalId)
}
