'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

const PLANS: { id: string; name: string; price: number; messages: string; color: string; popular?: boolean }[] = [
  { id: 'starter', name: 'Starter', price: 49,  messages: '2,000',     color: '#007AFF' },
  { id: 'growth',  name: 'Growth',  price: 149, messages: '15,000',    color: '#5856D6', popular: true },
  { id: 'scale',   name: 'Scale',   price: 499, messages: 'Unlimited', color: '#FF9500' },
]

interface Profile {
  plan_id: string | null
  plan_messages_limit: number | null
  messages_sent_total: number
  subscription_status: string
  plan_period_end: string | null
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [requested, setRequested] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return
      const { data } = await supabaseBrowser
        .from('profiles')
        .select('plan_id, plan_messages_limit, messages_sent_total, subscription_status, plan_period_end')
        .eq('id', user.id)
        .single()
      setProfile(data as Profile)
      setLoading(false)
    }
    load()
  }, [])

  const currentPlanId = profile?.plan_id ?? 'trial'
  const used          = profile?.messages_sent_total ?? 0
  const limit         = profile?.plan_messages_limit ?? 0
  const usagePct      = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const periodEnd     = profile?.plan_period_end
    ? new Date(profile.plan_period_end).toLocaleDateString() : null

  const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? 'First Bank'
  const ACCOUNT_NO   = process.env.NEXT_PUBLIC_ACCOUNT_NO   ?? 'Contact admin for details'
  const ACCOUNT_NAME = process.env.NEXT_PUBLIC_ACCOUNT_NAME ?? 'FastBuySell Ltd'
  const PAYSTACK_URL = process.env.NEXT_PUBLIC_PAYSTACK_URL ?? ''

  return (
    <div className="max-w-3xl space-y-6">

      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Billing & Credits</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">Choose a plan, make payment, and we will activate your credits</p>
      </div>

      {notice && (
        <div className="rounded-2xl px-5 py-3 text-sm font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/25">
          {notice}
        </div>
      )}

      {/* Current plan */}
      {!loading && profile && (
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-0.5">Current Plan</p>
              <p className="text-[#1C1C1E] font-black text-xl capitalize">{currentPlanId}</p>
              {periodEnd && <p className="text-[#8E8E93] text-xs mt-0.5">Renews {periodEnd}</p>}
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl capitalize"
              style={profile.subscription_status === 'active'
                ? { background: '#34C75912', color: '#34C759' }
                : { background: '#FF950012', color: '#FF9500' }}>
              {profile.subscription_status}
            </span>
          </div>

          {limit > 0 && (
            <>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#8E8E93]">Messages used</span>
                <span className="font-bold text-[#1C1C1E]">{used.toLocaleString()} / {limit.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${usagePct}%`,
                    background: usagePct > 90 ? '#FF3B30' : usagePct > 70 ? '#FF9500' : '#34C759',
                  }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = currentPlanId === plan.id
          const isRequested = requested === plan.id
          return (
            <div key={plan.id} className="relative bg-white rounded-3xl p-5 flex flex-col"
              style={{
                boxShadow: plan.popular ? `0 4px 20px ${plan.color}22` : '0 1px 4px rgba(0,0,0,0.07)',
                border: plan.popular ? `1.5px solid ${plan.color}35` : '1.5px solid transparent',
              }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full text-white" style={{ background: plan.color }}>
                    Most Popular
                  </span>
                </div>
              )}

              <p className="font-black text-[#1C1C1E]">{plan.name}</p>
              <div className="flex items-baseline gap-0.5 mt-1 mb-0.5">
                <span className="text-2xl font-black" style={{ color: plan.color }}>£{plan.price}</span>
                <span className="text-[#8E8E93] text-xs">/mo</span>
              </div>
              <p className="text-[#8E8E93] text-xs mb-4">{plan.messages} messages</p>

              {isCurrent ? (
                <div className="mt-auto py-2.5 rounded-2xl text-xs font-bold text-center"
                  style={{ background: `${plan.color}15`, color: plan.color }}>
                  Current Plan
                </div>
              ) : isRequested ? (
                <div className="mt-auto py-2.5 rounded-2xl text-xs font-bold text-center bg-[#34C759]/10 text-[#34C759]">
                  Request sent ✓
                </div>
              ) : (
                <button onClick={() => { setRequested(plan.id); setNotice(`Payment request for ${plan.name} noted! Make payment via the details below, then message admin to activate.`) }}
                  className="mt-auto py-2.5 rounded-2xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: plan.color }}>
                  Select {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment details */}
      <div className="bg-white rounded-3xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <p className="font-bold text-[#1C1C1E] text-sm">How to Pay</p>

        {PAYSTACK_URL && (
          <a href={PAYSTACK_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#00B9F2,#0070C0)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Pay via Paystack
          </a>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">Bank Transfer</p>
          {[
            { label: 'Bank',           value: BANK_NAME },
            { label: 'Account Number', value: ACCOUNT_NO },
            { label: 'Account Name',   value: ACCOUNT_NAME },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between bg-[#F2F2F7] rounded-2xl px-4 py-3">
              <span className="text-[#8E8E93] text-xs">{r.label}</span>
              <span className="text-[#1C1C1E] text-xs font-bold font-mono">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#007AFF]/8 border border-[#007AFF]/15 px-4 py-3 text-xs text-[#3C3C43] leading-relaxed">
          <span className="font-semibold text-[#007AFF]">After payment:</span> Send your payment receipt or transaction reference to admin. Your plan will be activated within 1 hour.
        </div>
      </div>

    </div>
  )
}
