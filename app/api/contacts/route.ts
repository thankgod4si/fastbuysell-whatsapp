import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Single contact: { phone }
// Bulk contacts: { contacts: [{ phone }] }
export async function POST(request: Request) {
  const body = await request.json()

  if (body.contacts) {
    const rows = (body.contacts as { phone: string }[])
      .map(({ phone }) => ({
        phone: phone.trim().replace(/\s+/g, '').replace(/^00/, '+'),
      }))
      .filter(r => r.phone.length > 5)

    const { data, error } = await supabase
      .from('contacts')
      .upsert(rows, { onConflict: 'phone', ignoreDuplicates: true })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ added: data?.length ?? 0 }, { status: 201 })
  }

  const { phone } = body
  if (!phone?.trim()) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const normalized = phone.trim().replace(/\s+/g, '').replace(/^00/, '+')

  const { data, error } = await supabase
    .from('contacts')
    .insert({ phone: normalized })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
