export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendCampaignEmail } from '@/lib/email'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { checkCanSend, deductCredits, trackSend } from '@/lib/usage'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check subscription before blasting
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  let check: Awaited<ReturnType<typeof checkCanSend>> | null = null

  if (user) {
    check = await checkCanSend(user.id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
    }
  }

  // Get user email config for sender name
  let fromAddress = process.env.EMAIL_FROM ?? 'Fast Buy & Sell <hello@trysofi.co>'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_from, email_sender_name')
      .eq('id', user.id)
      .single()
    
    if (profile?.email_from) {
      fromAddress = profile.email_from
      if (profile?.email_sender_name) {
        const emailMatch = fromAddress.match(/<(.+)>/)
        if (emailMatch) {
          fromAddress = `${profile.email_sender_name} <${emailMatch[1]}>`
        } else {
          fromAddress = `${profile.email_sender_name} <${fromAddress}>`
        }
      }
    }
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const { data: contacts } = await supabase
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', id)
    .eq('status', 'pending')

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No pending contacts to email' })
  }

  const available = check?.status === 'active'
    ? contacts.length
    : Math.max(0, (check?.remaining ?? 0) + (check?.credits ?? 0))
  const toSend = contacts.slice(0, Math.min(available, contacts.length))

  let sent = 0
  const failed: string[] = []

  for (const contact of toSend) {
    console.log(`[email blast] Sending to ${contact.email}`)
    const { data, error } = await sendCampaignEmail({
      to: contact.email,
      name: contact.name,
      subject: campaign.subject,
      body: campaign.body,
      replyTo: campaign.reply_to,
      from: fromAddress,
    })

    if (!error) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      sent++
      console.log(`[email blast] Successfully sent to ${contact.email}`)
    } else {
      console.error(`[email blast] Failed to send to ${contact.email}:`, error)
      await supabase
        .from('campaign_contacts')
        .update({ status: 'failed', failure_reason: JSON.stringify(error) })
        .eq('id', contact.id)
      failed.push(contact.email)
    }

    await new Promise(r => setTimeout(r, 300))
  }

  if (sent > 0) {
    await Promise.all([
      supabase.from('campaigns').update({ status: 'active' }).eq('id', id),
      user ? trackSend(user.id, sent) : Promise.resolve(),
      user && (check?.remaining ?? 0) <= 0 && check?.credits && check.credits > 0 ? deductCredits(user.id, sent) : Promise.resolve(),
    ])
  }

  return NextResponse.json({ sent, failed })
}
