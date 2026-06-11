'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/contacts')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#ffffff 50%,#f0f9ff 100%)' }}>
      {/* Nav */}
      <nav className="px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              <path d="M12 0C5.373 0 0 5.373 0 12a11.952 11.952 0 001.636 6.062L0 24l6.134-1.612A11.944 11.944 0 0012 24c6.624 0 12-5.373 12-12S18.614 0 12 0z" />
            </svg>
          </div>
          <span className="font-black text-[#1C1C1E] text-base tracking-tight">OutreachHQ</span>
        </Link>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#1C1C1E] mb-2">Welcome back</h1>
            <p className="text-[#6C6C70] text-sm">Sign in to your dashboard</p>
          </div>

          <div className="rounded-3xl p-8"
            style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6C6C70] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-[#1C1C1E] text-sm placeholder-[#C7C7CC] outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': '#25D36640' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6C6C70] mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-[#1C1C1E] text-sm placeholder-[#C7C7CC] outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': '#25D36640' } as React.CSSProperties}
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: '#FF3B3010', border: '1px solid #FF3B3030', color: '#FF3B30' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3 rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 16px rgba(37,211,102,0.35)' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-[#8E8E93] text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#25D366' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
