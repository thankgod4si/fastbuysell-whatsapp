import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const PLAN_LIMITS: Record<string, { planId: string; limit: number }> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: { planId: 'starter', limit: 2000  },
  [process.env.STRIPE_PRICE_GROWTH  ?? '']: { planId: 'growth',  limit: 15000 },
  [process.env.STRIPE_PRICE_SCALE   ?? '']: { planId: 'scale',   limit: -1    },
}

async function getSupabaseUserId(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  return data?.id ?? null
}

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature invalid', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.supabase_user_id
    if (!userId || session.mode !== 'subscription') return NextResponse.json({ ok: true })

    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = sub.items.data[0]?.price.id ?? ''
    const plan = PLAN_LIMITS[priceId] ?? { planId: 'starter', limit: 2000 }

    await supabase.from('profiles').update({
      stripe_subscription_id: sub.id,
      subscription_status: 'active',
      plan_id: plan.planId,
      plan_messages_limit: plan.limit,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const userId = await getSupabaseUserId(sub.customer as string)
    if (!userId) return NextResponse.json({ ok: true })

    const priceId = sub.items.data[0]?.price.id ?? ''
    const plan = PLAN_LIMITS[priceId] ?? { planId: 'starter', limit: 2000 }
    const active = ['active', 'trialing'].includes(sub.status)

    await supabase.from('profiles').update({
      subscription_status: active ? 'active' : 'suspended',
      plan_id: plan.planId,
      plan_messages_limit: plan.limit,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = await getSupabaseUserId(sub.customer as string)
    if (!userId) return NextResponse.json({ ok: true })

    await supabase.from('profiles').update({
      subscription_status: 'suspended',
      plan_id: 'free',
      plan_messages_limit: 0,
      stripe_subscription_id: null,
    }).eq('id', userId)
  }

  return NextResponse.json({ ok: true })
}
