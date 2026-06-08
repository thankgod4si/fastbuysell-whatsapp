import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendCampaignEmail } from '@/lib/email'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { checkCanSend, trackSend } from '@/lib/usage'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check subscription before blasting
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (user) {
    const check = await checkCanSend(user.id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
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

  let sent = 0
  const failed: string[] = []

  for (const contact of contacts) {
    const { error } = await sendCampaignEmail({
      to: contact.email,
      name: contact.name,
      subject: campaign.subject,
      body: campaign.body,
      replyTo: campaign.reply_to,
    })

    if (!error) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      sent++
    } else {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'failed' })
        .eq('id', contact.id)
      failed.push(contact.email)
    }

    await new Promise(r => setTimeout(r, 300))
  }

  if (sent > 0) {
    await Promise.all([
      supabase.from('campaigns').update({ status: 'active' }).eq('id', id),
      user ? trackSend(user.id, sent) : Promise.resolve(),
    ])
  }

  return NextResponse.json({ sent, failed })
}
