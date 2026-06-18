export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`*, campaign_contacts(count)`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { name, subject, body, reply_to } = await request.json()

  if (!name || !subject || !body || !reply_to) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, subject, body, reply_to, status: 'draft' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
