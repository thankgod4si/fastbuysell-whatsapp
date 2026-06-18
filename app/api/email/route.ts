export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendLeadEmail, sendCampaignEmail } from '@/lib/email'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createMessageLog } from '@/lib/message-log'
import { checkCanSend, deductCredits, trackSend } from '@/lib/usage'

interface UserEmailConfig {
  apiKey?: string
  from?: string
  replyTo?: string
  userId?: string
}

async function getUserEmailConfig(): Promise<UserEmailConfig> {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return {}
    const { data: profile } = await supabase
      .from('profiles')
      .select('resend_api_key, email_from, reply_to_email')
      .eq('id', user.id)
      .single()
    return {
      apiKey: profile?.resend_api_key || undefined,
      from: profile?.email_from || undefined,
      replyTo: profile?.reply_to_email || undefined,
      userId: user.id,
    }
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const { leadId, subject, body } = await request.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { apiKey, from, replyTo, userId } = await getUserEmailConfig()

  let check: Awaited<ReturnType<typeof checkCanSend>> | null = null
  if (userId) {
    check = await checkCanSend(userId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
    }
  }

  let sendError: { message: string } | null = null
  let emailId: string | undefined

  if (subject && body) {
    const { data, error } = await sendCampaignEmail({
      to: lead.email, name: lead.full_name, subject, body,
      replyTo: replyTo || process.env.EMAIL_FROM!, apiKey, from,
    })
    sendError = error ?? null
    emailId = data?.id
  } else {
    const { data, error } = await sendLeadEmail({
      to: lead.email, name: lead.full_name, carMake: lead.car_make,
      carModel: lead.car_model, carYear: lead.car_year, price: lead.asking_price,
      replyTo, apiKey, from,
    })
    sendError = error ?? null
    emailId = data?.id
  }

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  await Promise.all([
    supabase.from('leads').update({ email_sent_at: new Date().toISOString() }).eq('id', leadId),
    createMessageLog({ leadId, channel: 'email', externalId: emailId, recipient: lead.email, userId: lead.user_id }),
    userId ? trackSend(userId) : Promise.resolve(),
    userId && (check?.remaining ?? 0) <= 0 && check?.credits && check.credits > 0 ? deductCredits(userId, 1) : Promise.resolve(),
  ])

  return NextResponse.json({ success: true })
}

export async function GET() {
  const { apiKey, from: emailFrom, replyTo, userId } = await getUserEmailConfig()

  let check: Awaited<ReturnType<typeof checkCanSend>> | null = null
  if (userId) {
    check = await checkCanSend(userId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
    }
  }

  let query = supabase.from('leads').select('*').eq('status', 'new').is('email_sent_at', null)
  if (userId) query = query.eq('user_id', userId)
  const { data: leads } = await query

  if (!leads?.length) return NextResponse.json({ sent: 0, message: 'No new leads to email' })

  let sent = 0
  const failed: string[] = []

  for (const lead of leads) {
    const { data, error } = await sendLeadEmail({
      to: lead.email, name: lead.full_name, carMake: lead.car_make,
      carModel: lead.car_model, carYear: lead.car_year, price: lead.asking_price,
      apiKey, from: emailFrom, replyTo,
    })

    if (!error) {
      await Promise.all([
        supabase.from('leads').update({ email_sent_at: new Date().toISOString() }).eq('id', lead.id),
        createMessageLog({ leadId: lead.id, channel: 'email', externalId: data?.id, recipient: lead.email, userId: lead.user_id }),
        userId ? trackSend(userId) : Promise.resolve(),
        userId && (check?.remaining ?? 0) <= 0 && check?.credits && check.credits > 0 ? deductCredits(userId, 1) : Promise.resolve(),
      ])
      sent++
    } else {
      failed.push(lead.email)
    }
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ sent, failed })
}
