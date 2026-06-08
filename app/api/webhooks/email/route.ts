import { NextResponse } from 'next/server'
import { updateMessageStatus } from '@/lib/message-log'
import type { MessageStatus } from '@/lib/message-log'

const EVENT_MAP: Record<string, MessageStatus> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'failed',
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({}, { status: 200 })

  const status = EVENT_MAP[payload.type]
  const emailId: string | undefined = payload.data?.email_id

  if (status && emailId) {
    await updateMessageStatus(emailId, status)
  }

  return NextResponse.json({ status: 'ok' })
}
