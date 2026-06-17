import { supabase } from './supabase'

export interface SubscriptionCheck {
  allowed: boolean
  reason?: string
  status?: string
  remaining?: number
  credits?: number
  planLimit?: number
}

export async function checkCanSend(userId: string): Promise<SubscriptionCheck> {
  const [{ data }, { data: wallet }] = await Promise.all([
    supabase.from('profiles').select('subscription_status, trial_sends_remaining, plan_messages_limit').eq('id', userId).single(),
    supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
  ])

  if (!data) return { allowed: false, reason: 'Profile not found' }

  const status        = data.subscription_status as string
  const remaining     = (data.trial_sends_remaining as number) ?? 0
  const planLimit     = (data.plan_messages_limit as number) ?? 0
  const walletBalance = (wallet?.balance as number) ?? 0
  const paidCredits   = walletBalance

  if (status === 'pending_approval') {
    return { allowed: false, reason: 'Your account is pending approval. An admin will review and activate it shortly.', status, remaining, credits: paidCredits, planLimit }
  }
  if (status === 'suspended') {
    return { allowed: false, reason: 'Your account has been suspended. Contact support to reactivate.', status, remaining, credits: paidCredits, planLimit }
  }

  if (status === 'trial') {
    if (remaining <= 0 && paidCredits <= 0) {
      return { allowed: false, reason: 'No credits remaining. Top up your balance to keep sending.', status, remaining, credits: paidCredits, planLimit }
    }
    return { allowed: true, status, remaining, credits: paidCredits, planLimit }
  }

  if (status === 'active') {
    if (planLimit !== 0) {
      return { allowed: true, status, remaining, credits: paidCredits, planLimit }
    }
    if (remaining > 0 || paidCredits > 0) {
      return { allowed: true, status, remaining, credits: paidCredits, planLimit }
    }
    return { allowed: false, reason: 'No credits remaining. Top up your balance to keep sending.', status, remaining, credits: paidCredits, planLimit }
  }

  return { allowed: false, reason: 'No credits remaining. Top up your balance to keep sending.', status, remaining, credits: paidCredits, planLimit }
}

export async function deductCredits(userId: string, count = 1): Promise<void> {
  await supabase.rpc('deduct_credits', { p_user_id: userId, p_amount: count })
}

export async function addCredits(userId: string, amount: number, description = 'Credit top-up'): Promise<void> {
  await supabase.rpc('add_credits', { p_user_id: userId, p_amount: amount, p_description: description })
}

export async function trackSend(userId: string, count = 1) {
  await supabase.rpc('increment_message_count', { user_id: userId, send_count: count })
}
