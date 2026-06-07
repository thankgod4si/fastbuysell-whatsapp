import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Add one or many contacts  { contacts: [{ name, email }] }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { contacts } = await request.json()

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'contacts array required' }, { status: 400 })
  }

  const rows = contacts.map(({ name, email }: { name: string; email: string }) => ({
    campaign_id: id,
    name: name?.trim() || 'Contact',
    email: email?.trim().toLowerCase(),
  }))

  const { data, error } = await supabase
    .from('campaign_contacts')
    .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ added: data?.length ?? 0 }, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { contactId } = await request.json()

  const { error } = await supabase
    .from('campaign_contacts')
    .delete()
    .eq('id', contactId)
    .eq('campaign_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
