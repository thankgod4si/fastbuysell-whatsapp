import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendInquiryTemplate } from '@/lib/whatsapp'

// Error codes from WhatsApp Cloud API that mean the number is invalid/not on WhatsApp
const INVALID_NUMBER_CODES = [131026, 131047, 100, 470]

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
    const code = result.error.code

    // Auto-blacklist numbers that aren't on WhatsApp or are invalid
    const newStatus = INVALID_NUMBER_CODES.includes(code) ? 'blacklisted' : 'pending'

    if (newStatus === 'blacklisted') {
      await supabase
        .from('contacts')
        .update({ status: 'blacklisted' })
        .eq('id', contact.id)
      return NextResponse.json({ sent: 0, blacklisted: contact.phone, reason: result.error.message })
    }

    return NextResponse.json({ sent: 0, error: result.error.message })
  }

  await supabase
    .from('contacts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', contact.id)

  return NextResponse.json({ sent: 1, phone: contact.phone })
}
