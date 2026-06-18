export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await authClient.from('triggers').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const payload = {
    user_id: user.id,
    linked_account_id: body.linked_account_id || null,
    channel: body.channel || 'any',
    match_type: body.match_type || 'contains',
    keyword: String(body.keyword || '').trim(),
    reply_template: String(body.reply_template || '').trim() || 'Thanks — here is the link: {{link}}',
    auto_send: body.auto_send !== false,
    active: body.active !== false,
  }

  if (!payload.keyword || !payload.reply_template) {
    return NextResponse.json({ error: 'keyword and reply_template required' }, { status: 400 })
  }

  if (body.id) {
    const { data, error } = await authClient.from('triggers').update(payload).eq('id', body.id).eq('user_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await authClient.from('triggers').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await request.json() as { ids?: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  const { error } = await authClient.from('triggers').delete().in('id', ids).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
