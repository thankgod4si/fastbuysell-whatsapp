import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'

// Sends ONE pending contact per call.
// Set up cron-job.org (free) to POST this URL every 20 seconds.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!contact) return NextResponse.json({ sent: 0, message: 'Queue empty' })

  const result = await sendInquiryTemplate(contact.phone)

  if (result.error) {
    return NextResponse.json({ sent: 0, error: result.error.message })
  }

  await supabase
    .from('contacts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', contact.id)

  return NextResponse.json({ sent: 1, phone: contact.phone })
}
