export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function getUserId() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  return user?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (body.contacts) {
    const rows = (body.contacts as { phone: string }[])
      .map(({ phone }) => {
        let p = phone.trim().replace(/\s+/g, '').replace(/^00/, '+')
        if (!p.startsWith('+') && !p.startsWith('0')) p = '+' + p
        return { phone: p, user_id: userId }
      })
      .filter(r => r.phone.length > 5)

    const { data, error } = await supabase
      .from('contacts')
      .upsert(rows, { onConflict: 'phone,user_id', ignoreDuplicates: true })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ added: data?.length ?? 0 }, { status: 201 })
  }

  const { phone } = body
  if (!phone?.trim()) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  let normalized = phone.trim().replace(/\s+/g, '').replace(/^00/, '+')
  if (!normalized.startsWith('+') && !normalized.startsWith('0')) normalized = '+' + normalized

  const { data, error } = await supabase
    .from('contacts')
    .insert({ phone: normalized, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await request.json() as { ids: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  const { error } = await supabase
    .from('contacts')
    .delete()
    .in('id', ids)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
