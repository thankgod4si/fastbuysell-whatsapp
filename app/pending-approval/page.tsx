'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function PendingApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    // Poll every 15s — redirect to dashboard if admin approves while they're waiting
    const check = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabaseBrowser
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      if (data?.subscription_status && data.subscription_status !== 'pending_approval') {
        router.push('/contacts')
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [router])

  async function logout() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-purple-500/15 flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Awaiting Approval</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Your account has been created successfully. An admin will review and approve it before you can start sending.
        </p>
        <p className="text-gray-600 text-xs mb-8">
          This page refreshes automatically — you'll be redirected as soon as you're approved.
        </p>

        {/* Pulsing status */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shrink-0" />
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Review in progress</p>
            <p className="text-gray-600 text-xs mt-0.5">Usually approved within a few hours</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
