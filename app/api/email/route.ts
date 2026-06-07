import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendLeadEmail } from '@/lib/email'

// Send to a single lead
export async function POST(request: Request) {
  const { leadId } = await request.json()

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { error } = await sendLeadEmail({
    to: lead.email,
    name: lead.full_name,
    carMake: lead.car_make,
    carModel: lead.car_model,
    carYear: lead.car_year,
    price: lead.asking_price,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('leads')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', leadId)

  return NextResponse.json({ success: true })
}

// Blast all new leads that haven't been emailed yet
export async function GET() {
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'new')
    .is('email_sent_at', null)

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
