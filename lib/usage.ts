import { supabase } from './supabase'

export interface SubscriptionCheck {
  allowed: boolean
  reason?: string
  status?: string
  remaining?: number
  credits?: number
}

export async function checkCanSend(userId: string): Promise<SubscriptionCheck> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status, trial_sends_remaining, credits')
    .eq('id', userId)
    .single()

  if (!data) return { allowed: false, reason: 'Profile not found' }

  const status    = data.subscription_status as string
  const remaining = (data.trial_sends_remaining as number) ?? 0
  const credits   = (data.credits as number) ?? 0

  if (status === 'pending_approval') {
    return { allowed: false, reason: 'Your account is pending approval. An admin will review and activate it shortly.', status, remaining }
  }
  if (status === 'suspended') {
    return { allowed: false, reason: 'Your account has been suspended. Contact support to reactivate.', status, remaining }
  }
  // Credits gate: if user has credits, those govern sending regardless of trial/plan
  if (credits <= 0 && status === 'trial' && remaining <= 0) {
    return { allowed: false, reason: 'No credits remaining. Top up your balance to keep sending.', status, remaining, credits }
  }
  if (credits <= 0 && status !== 'trial' && status !== 'active') {
    return { allowed: false, reason: 'No credits remaining. Top up your balance to keep sending.', status, remaining, credits }
  }
  return { allowed: true, status, remaining, credits }
}

export async function deductCredits(userId: string, count = 1): Promise<void> {
  // Deduct atomically and record transaction
  await supabase.rpc('deduct_credits', { p_user_id: userId, p_amount: count })
}

export async function addCredits(userId: string, amount: number, description: string): Promise<void> {
  await supabase.rpc('add_credits', { p_user_id: userId, p_amount: amount, p_description: description })
}

export async function trackSend(userId: string, count = 1) {
  await supabase.rpc('increment_message_count', { user_id: userId, send_count: count })
}
