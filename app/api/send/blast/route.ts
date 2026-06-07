import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'

export async function POST() {
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
    const result = await sendInquiryTemplate(contact.phone)

    if (!result.error) {
      await supabase
        .from('contacts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contact.id)
      sent++
    } else {
      failed.push(contact.phone)
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ sent, failed })
}
