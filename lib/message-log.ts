import { supabase } from './supabase'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'opened'

export async function createMessageLog(params: {
  contactId?: string | null
  leadId?: string | null
  channel: 'whatsapp' | 'email' | 'sms'
  externalId?: string | null
  recipient: string
  userId?: string | null
}) {
  await supabase.from('message_logs').insert({
    contact_id: params.contactId ?? null,
    lead_id: params.leadId ?? null,
    channel: params.channel,
    external_id: params.externalId ?? null,
    recipient: params.recipient,
    status: 'sent',
    sent_at: new Date().toISOString(),
    user_id: params.userId ?? null,
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
