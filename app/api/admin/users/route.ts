import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireAdmin() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: { users: authUsers }, error: authError },
    { data: profiles },
    { data: wallets },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
    supabase.from('profiles').select(
      'id, full_name, subscription_status, trial_sends_remaining, plan_id, plan_messages_limit, is_admin, messages_sent_total, last_sent_at, wa_phone_number, wa_verified, email_from, resend_api_key'
    ),
    supabase.from('wallets').select('user_id, balance'),
  ])

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const walletMap = new Map((wallets ?? []).map((w: Record<string, any>) => [w.user_id, w.balance]))

  const users = authUsers.map(u => {
    const p = profileMap.get(u.id)
    const walletBalance = walletMap.get(u.id) ?? 0
    const paidCredits = walletBalance
    return {
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      full_name: p?.full_name ?? '',
      subscription_status: p?.subscription_status ?? 'pending_approval',
      trial_sends_remaining: p?.trial_sends_remaining ?? 10,
      credits: paidCredits,
      messages_sent_total: p?.messages_sent_total ?? 0,
      last_sent_at: p?.last_sent_at ?? null,
      is_admin: p?.is_admin ?? false,
      plan_id: p?.plan_id ?? 'free',
      plan_messages_limit: p?.plan_messages_limit ?? 0,
      // outreach config
      wa_phone_number: p?.wa_phone_number ?? null,
      wa_verified: p?.wa_verified ?? false,
      email_domain: p?.email_from
        ? (p.email_from as string).match(/@([^>]+)>?$/)?.[1] ?? null
        : null,
      has_resend_key: !!(p?.resend_api_key),
    }
  })

  return NextResponse.json(users)
}
