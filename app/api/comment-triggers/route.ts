import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await authClient
    .from('comment_triggers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const userId = user.id
  const platform = (body.platform === 'facebook' ? 'facebook' : 'instagram')
  const postIdRaw = body.post_id
  const postId = postIdRaw == null ? null : String(postIdRaw).trim() || null
  const linkUrl = String(body.link_url || '').trim()
  const replyTemplate = String(body.reply_template || '').trim() || 'Thanks for commenting! Here is your link: {{link}}'
  const pageId = body.page_id ? String(body.page_id).trim() || null : null
  const active = body.active !== false

  if (!linkUrl) {
    return NextResponse.json({ error: 'Link URL is required' }, { status: 400 })
  }

  const payload = {
    user_id: userId,
    platform,
    page_id: pageId,
    post_id: postId,
    link_url: linkUrl,
    reply_template: replyTemplate,
    active,
  }

  if (body.id) {
    const { data, error } = await authClient
      .from('comment_triggers')
      .update(payload)
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await authClient
    .from('comment_triggers')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await request.json() as { ids?: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  const { error } = await authClient
    .from('comment_triggers')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
