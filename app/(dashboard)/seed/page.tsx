'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function runSeed() {
    setStatus('loading')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error || 'Seed failed')
      }
    } catch {
      setStatus('error')
      setMessage('Network error')
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-white mb-1">Seed Demo Data</h1>
      <p className="text-gray-500 text-sm mb-8">
        Populates your account with realistic demo leads across WhatsApp, SMS, and Email for screenshots.
        This will clear your existing leads and contacts first.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="space-y-2 text-sm text-gray-400">
          <p>Will create:</p>
          <ul className="ml-4 space-y-1 text-gray-500 list-disc">
            <li>5 WhatsApp contacts (3 replied, 1 sent, 1 pending)</li>
            <li>4 SMS contacts (2 replied, 1 sent, 1 pending)</li>
            <li>3 WhatsApp leads (BMW, VW Golf, Mercedes)</li>
            <li>2 SMS leads (Audi A4, Toyota Corolla)</li>
            <li>2 Email leads (Ford Focus, Opel Astra)</li>
          </ul>
        </div>

        {status === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-green-400 text-sm">{message}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/leads')}
                className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
              >
                View Leads →
              </button>
              <button
                onClick={() => router.push('/contacts')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                View Contacts
              </button>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{message}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <button
            onClick={runSeed}
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Seeding...
              </>
            ) : (
              'Seed Demo Data'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
