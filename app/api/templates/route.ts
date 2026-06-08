import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel')

  let query = supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (channel) query = query.eq('channel', channel)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel, name, category, language, header_text, body: msgBody, footer_text, subject } = body

  if (!channel || !name || !msgBody) {
    return NextResponse.json({ error: 'channel, name and body are required' }, { status: 400 })
  }

  // Auto-generate Meta template slug (only used for WA templates)
  const slug = channel === 'whatsapp'
    ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${user.id.slice(0, 6)}`
    : null

  // If this is marked default, clear other defaults for this channel+user
  if (body.is_default) {
    await supabase.from('templates').update({ is_default: false })
      .eq('user_id', user.id).eq('channel', channel)
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      channel,
      name,
      category: category || 'MARKETING',
      language: language || 'en_US',
      header_text: header_text || null,
      body: msgBody,
      footer_text: footer_text || null,
      subject: subject || null,
      wa_template_name: slug,
      wa_status: channel === 'whatsapp' ? 'draft' : null,
      is_default: body.is_default ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
