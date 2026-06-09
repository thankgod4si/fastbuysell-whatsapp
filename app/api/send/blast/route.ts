import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { checkCanSend, trackSend } from '@/lib/usage'

export async function POST() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (user) {
    const check = await checkCanSend(user.id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, code: check.status === 'suspended' ? 'account_suspended' : 'trial_limit_reached' }, { status: 403 })
    }
  }

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No pending contacts' })
  }

  let sent = 0
  const failed: string[] = []

  for (const contact of contacts) {
    console.log(`[blast] sending to ${contact.phone}`)
    const result = await sendInquiryTemplate(contact.phone)

    if (!result.error) {
      await supabase
        .from('contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      console.log(`[blast] sent to ${contact.phone}`)
      sent++
    } else {
      console.error(`[blast] failed ${contact.phone}:`, JSON.stringify(result.error))
      failed.push(contact.phone)
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  if (sent > 0 && user) {
    await trackSend(user.id, sent)
  }

  return NextResponse.json({ sent, failed })
}
