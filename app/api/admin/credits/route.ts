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

// POST /api/admin/credits — add credits to a user
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, amount, description } = await request.json() as {
    user_id: string; amount: number; description?: string
  }
  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'user_id and positive amount required' }, { status: 400 })
  }

  await addCredits(user_id, amount, description ?? `Admin top-up: ${amount} credits`)

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user_id).single(),
    supabase.from('wallets').select('balance').eq('user_id', user_id).single(),
  ])

  return NextResponse.json({ success: true, new_balance: wallet?.balance ?? 0, name: profile?.full_name })
}

// GET /api/admin/credits?user_id=xxx — get a user's credit balance + history
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const [profileRes, walletRes, txRes] = await Promise.all([
    supabase.from('profiles').select('full_name, subscription_status').eq('id', userId).single(),
    supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
    supabase.from('credit_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
  ])

  return NextResponse.json({
    profile: { ...profileRes.data, credits: walletRes.data?.balance ?? 0 },
    transactions: txRes.data ?? [],
  })
}
