export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { addCredits } from '@/lib/usage'

async function requireAdmin() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — list all payment requests with user info
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('payment_requests')
    .select(`
      *,
      profiles!payment_requests_user_id_fkey(full_name),
      wallets!payment_requests_user_id_fkey(balance)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also pull emails from auth.users via admin API (service role)
  const userIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.user_id as string))]
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    const { data: { user: u } } = await (await import('@/lib/supabase-admin')).supabaseAdmin.auth.admin.getUserById(uid)
    if (u?.email) emailMap[uid] = u.email
  }

  const rows = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    email:           emailMap[r.user_id as string] ?? '',
    full_name:       (r.profiles as Record<string, string> | null)?.full_name ?? null,
    current_balance: (r.wallets  as Record<string, number> | null)?.balance   ?? 0,
  }))

  return NextResponse.json(rows)
}

// POST — approve a request (add credits + mark approved)
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { request_id, user_id, amount, description } = await request.json()
  if (!request_id || !user_id || !amount) {
    return NextResponse.json({ error: 'request_id, user_id, amount required' }, { status: 400 })
  }

  await addCredits(user_id, amount, description ?? `Credit top-up: ${amount} credits`)

  await supabase.from('payment_requests')
    .update({ status: 'approved' })
    .eq('id', request_id)

  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user_id).single()
  return NextResponse.json({ success: true, new_balance: wallet?.balance ?? 0 })
}

// PATCH — reject a request
export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { request_id, status } = await request.json()
  if (!request_id) return NextResponse.json({ error: 'request_id required' }, { status: 400 })

  await supabase.from('payment_requests').update({ status: status ?? 'rejected' }).eq('id', request_id)
  return NextResponse.json({ success: true })
}
