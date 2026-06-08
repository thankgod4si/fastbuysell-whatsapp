'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function SubscribePage() {
  const [status, setStatus] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabaseBrowser
        .from('profiles')
        .select('subscription_status, trial_sends_remaining')
        .eq('id', user.id)
        .single()
      if (data) {
        setStatus(data.subscription_status)
        setRemaining(data.trial_sends_remaining)
      }
    }
    load()
  }, [])

  const isSuspended = status === 'suspended'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isSuspended ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
          <span className="text-3xl">{isSuspended ? '🔒' : '⚡'}</span>
        </div>

        <h1 className="text-2xl font-black text-white text-center mb-2">
          {isSuspended ? 'Account Suspended' : 'Upgrade Your Plan'}
        </h1>

        <p className="text-gray-500 text-sm text-center mb-8">
          {isSuspended
            ? 'Your account has been suspended by an administrator. Contact support to get it reactivated.'
            : `Your free trial has ended${remaining !== null && remaining <= 0 ? ' (0 sends remaining)' : ''}. To keep sending messages, you need an active plan.`
          }
        </p>

        {!isSuspended && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-bold">Pro Plan</p>
              <p className="text-green-400 font-black text-xl">€49 <span className="text-gray-500 text-sm font-normal">/mo</span></p>
            </div>
            <ul className="space-y-2.5 mb-5">
              {[
                'Unlimited WhatsApp outreach',
                'Unlimited email campaigns',
                'Unlimited SMS sends',
                'Priority support',
                'Full lead management',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <span className="text-green-400 text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:admin@fastbuysell.com?subject=Upgrade%20Request&body=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20account.%20My%20email%20is%20${encodeURIComponent(email)}.`}
              className="block w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl text-sm text-center transition-colors"
            >
              Contact to Upgrade
            </a>
          </div>
        )}

        {isSuspended && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
            <p className="text-red-400 text-sm text-center">
              To appeal or get more information, contact{' '}
              <a href="mailto:admin@fastbuysell.com" className="underline">admin@fastbuysell.com</a>
            </p>
          </div>
        )}

        <div className="text-center">
          <Link href="/contacts" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
