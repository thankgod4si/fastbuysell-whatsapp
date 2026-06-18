export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { generateFlowJson, createMetaFlow, uploadFlowJson, publishMetaFlow } from '@/lib/whatsapp-flows'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('flows')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST — publish flow to Meta (create + upload JSON + publish)
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: flow, error: fetchErr } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

  // Step 1 — create flow in Meta
  const created = await createMetaFlow(flow.name)
  if (!created.id) {
    return NextResponse.json({ error: created.error?.message ?? 'Failed to create flow in Meta' }, { status: 500 })
  }

  // Step 2 — generate and upload flow JSON
  const flowJson = generateFlowJson({
    fields: flow.fields,
    screenTitle: flow.screen_title,
    ctaText: flow.cta_text,
    flowDbId: flow.id,
  })

  const uploaded = await uploadFlowJson(created.id, flowJson)
  if (!uploaded.success) {
    const validationErrors = uploaded.data?.details?.validation_errors
    return NextResponse.json({
      error: uploaded.error?.message ?? 'Failed to upload flow JSON',
      ...(validationErrors ? { validation_errors: validationErrors } : {}),
    }, { status: 500 })
  }

  // Step 3 — publish
  const published = await publishMetaFlow(created.id)
  const isPublished = published.success === true

  // Update DB
  const { data: updated, error: updateErr } = await supabase
    .from('flows')
    .update({
      meta_flow_id: created.id,
      meta_status: isPublished ? 'published' : 'draft',
    })
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    flow: updated,
    published: isPublished,
    ...(isPublished ? {} : { publish_error: published.error?.message }),
  })
}
