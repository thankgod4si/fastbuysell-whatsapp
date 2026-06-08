import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendLeadEmail, sendCampaignEmail } from '@/lib/email'
import { createSupabaseServerClient } from '@/lib/supabase-server'

interface UserEmailConfig {
  apiKey?: string
  from?: string
  replyTo?: string
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
    }
  } catch {
    return {}
  }
}

// Send to a single lead — optional subject/body for custom drafts
export async function POST(request: Request) {
  const { leadId, subject, body } = await request.json()

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { apiKey, from, replyTo } = await getUserEmailConfig()
  let sendError: { message: string } | null = null

  if (subject && body) {
    const { error } = await sendCampaignEmail({
      to: lead.email,
      name: lead.full_name,
      subject,
      body,
      replyTo: replyTo || process.env.EMAIL_FROM!,
      apiKey,
      from,
    })
    sendError = error ?? null
  } else {
    const { error } = await sendLeadEmail({
      to: lead.email,
      name: lead.full_name,
      carMake: lead.car_make,
      carModel: lead.car_model,
      carYear: lead.car_year,
      price: lead.asking_price,
      replyTo,
      apiKey,
      from,
    })
    sendError = error ?? null
  }

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  await supabase
    .from('leads')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', leadId)

  return NextResponse.json({ success: true })
}

// Blast all new leads that haven't been emailed yet
export async function GET() {
  const { apiKey, from: emailFrom, replyTo } = await getUserEmailConfig()

  const userId = await (async () => {
    try {
      const authClient = await createSupabaseServerClient()
      const { data: { user } } = await authClient.auth.getUser()
      return user?.id ?? null
    } catch { return null }
  })()

  let query = supabase.from('leads').select('*').eq('status', 'new').is('email_sent_at', null)
  if (userId) query = query.eq('user_id', userId)
  const { data: leads } = await query

  if (!leads?.length) return NextResponse.json({ sent: 0, message: 'No new leads to email' })

  let sent = 0
  const failed: string[] = []

  for (const lead of leads) {
    const { error } = await sendLeadEmail({
      to: lead.email,
      name: lead.full_name,
      carMake: lead.car_make,
      carModel: lead.car_model,
      carYear: lead.car_year,
      price: lead.asking_price,
      apiKey,
      from: emailFrom,
      replyTo,
    })

    if (!error) {
      await supabase
        .from('leads')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', lead.id)
      sent++
    } else {
      failed.push(lead.email)
    }

    // Small delay to respect Resend rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ sent, failed })
}
