import { supabase } from './supabase'

export interface SubscriptionCheck {
  allowed: boolean
  reason?: string
  status?: string
  remaining?: number
}

export async function checkCanSend(userId: string): Promise<SubscriptionCheck> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status, trial_sends_remaining')
    .eq('id', userId)
    .single()

  if (!data) return { allowed: false, reason: 'Profile not found' }

  const status = data.subscription_status as string
  const remaining = data.trial_sends_remaining as number ?? 0

  if (status === 'pending_approval') {
    return { allowed: false, reason: 'Your account is pending approval. An admin will review and activate it shortly.', status, remaining }
  }
  if (status === 'suspended') {
    return { allowed: false, reason: 'Your account has been suspended. Contact support to reactivate.', status, remaining }
  }
  if (status === 'trial' && remaining <= 0) {
    return { allowed: false, reason: 'Your free trial has ended. Upgrade your plan to keep sending.', status, remaining }
  }
  return { allowed: true, status, remaining }
}

export async function trackSend(userId: string, count = 1) {
  await supabase.rpc('increment_message_count', { user_id: userId, send_count: count })
}
