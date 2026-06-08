import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { submitTemplateToMeta, getTemplateStatus } from '@/lib/whatsapp'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['name', 'category', 'language', 'header_text', 'body', 'footer_text', 'subject', 'is_default', 'wa_status']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (body.is_default) {
    const { data: tpl } = await supabase.from('templates').select('channel').eq('id', id).single()
    if (tpl) {
      await supabase.from('templates').update({ is_default: false })
        .eq('user_id', user.id).eq('channel', tpl.channel)
    }
  }

  const { data, error } = await supabase
    .from('templates').update(patch).eq('id', id).eq('user_id', user.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('templates').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST /api/templates/[id]/submit — submit WA template to Meta for approval
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const url = new URL(request.url)
  if (!url.pathname.endsWith('/submit')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tpl } = await supabase
    .from('templates').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const result = await submitTemplateToMeta({
    name: tpl.wa_template_name,
    category: tpl.category,
    language: tpl.language,
    headerText: tpl.header_text,
    body: tpl.body,
    footerText: tpl.footer_text,
  })

  if (result.error) {
    await supabase.from('templates').update({ wa_status: 'rejected', wa_reject_reason: result.error.message })
      .eq('id', id)
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  await supabase.from('templates').update({ wa_status: 'pending', wa_reject_reason: null }).eq('id', id)
  return NextResponse.json({ success: true, meta_id: result.id })
}

// GET /api/templates/[id]/status — refresh Meta approval status
export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tpl } = await supabase
    .from('templates').select('wa_template_name, wa_status').eq('id', id).eq('user_id', user.id).single()
  if (!tpl?.wa_template_name) return NextResponse.json({ error: 'No Meta template name' }, { status: 400 })

  const meta = await getTemplateStatus(tpl.wa_template_name)
  if (!meta) return NextResponse.json({ wa_status: tpl.wa_status })

  const wa_status = meta.status?.toLowerCase() === 'approved' ? 'approved'
    : meta.status?.toLowerCase() === 'rejected' ? 'rejected'
    : 'pending'

  await supabase.from('templates').update({ wa_status, wa_reject_reason: meta.rejected_reason ?? null }).eq('id', id)
  return NextResponse.json({ wa_status, rejected_reason: meta.rejected_reason })
}
