export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

async function requireAdmin() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('meta_apps')
    .select('id, name, waba_id, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add number count per app
  const withCounts = await Promise.all((data ?? []).map(async app => {
    const { count } = await supabase
      .from('wa_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('meta_app_id', app.id)
    return { ...app, numbers_count: count ?? 0 }
  }))

  return NextResponse.json(withCounts)
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, waba_id, access_token } = await request.json()
  if (!name || !waba_id || !access_token) {
    return NextResponse.json({ error: 'name, waba_id and access_token are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meta_apps')
    .insert({ name, waba_id, access_token, is_active: true })
    .select('id, name, waba_id, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, numbers_count: 0 }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, name, waba_id, access_token, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (name        !== undefined) patch.name         = name
  if (waba_id     !== undefined) patch.waba_id      = waba_id
  if (access_token !== undefined) patch.access_token = access_token
  if (is_active   !== undefined) patch.is_active    = is_active

  const { error } = await supabase.from('meta_apps').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('meta_apps').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
