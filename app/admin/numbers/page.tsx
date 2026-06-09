'use client'

import { useEffect, useState } from 'react'

interface NumberRequest {
  id: string
  user_id: string
  email: string
  full_name: string | null
  current_wa: string | null
  amount_naira: number
  receipt_url: string | null
  note: string | null
  status: 'pending' | 'fulfilled' | 'rejected'
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  fulfilled: 'bg-green-500/15 text-green-400 border-green-500/25',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
}

export default function AdminNumbersPage() {
  const [requests, setRequests]   = useState<NumberRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'fulfilled' | 'rejected'>('all')
  const [selected, setSelected]   = useState<NumberRequest | null>(null)
  const [phoneId, setPhoneId]     = useState('')
  const [phoneNum, setPhoneNum]   = useState('')
  const [dispName, setDispName]   = useState('')
  const [working, setWorking]     = useState(false)
  const [err, setErr]             = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/numbers')
    if (res.ok) setRequests(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function assignNumber() {
    if (!selected || !phoneId.trim() || !phoneNum.trim()) return
    setWorking(true); setErr('')
    try {
      const res = await fetch('/api/admin/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id:      selected.id,
          user_id:         selected.user_id,
          phone_number_id: phoneId.trim(),
          phone_number:    phoneNum.trim(),
          display_name:    dispName.trim() || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      setSelected(null); setPhoneId(''); setPhoneNum(''); setDispName('')
      await load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  async function reject(id: string) {
    await fetch('/api/admin/numbers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, status: 'rejected' }),
    })
    await load()
  }

  const shown = requests.filter(r => filter === 'all' || r.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Number Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Users who have paid ₦15,000 for a WhatsApp number</p>
        </div>
        <button onClick={load} className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'fulfilled', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              filter === tab
                ? 'bg-amber-500 text-black border-amber-500'
                : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {tab} {tab === 'all' ? `(${requests.length})` : `(${requests.filter(r => r.status === tab).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading...</div>
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No {filter !== 'all' ? filter : ''} requests</div>
      ) : (
        <div className="space-y-4">
          {shown.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{r.full_name || r.email}</span>
                    <span className={`text-xs border px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{r.email}</div>
                  {r.current_wa && <div className="text-gray-500 text-xs mt-0.5">Current WA: {r.current_wa}</div>}
                  {r.note && <div className="text-gray-400 text-sm mt-1 italic">"{r.note}"</div>}
                  <div className="text-gray-500 text-xs mt-1">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-green-400 font-bold text-lg">₦{r.amount_naira.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {r.receipt_url && (
                  <a
                    href={r.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 underline"
                  >
                    View Receipt
                  </a>
                )}
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setSelected(r); setErr('') }}
                      className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Assign Number
                    </button>
                    <button
                      onClick={() => reject(r.id)}
                      className="border border-red-700 text-red-400 hover:bg-red-500/10 text-sm px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Number Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-1">Assign WhatsApp Number</h2>
            <p className="text-gray-400 text-sm mb-5">For: {selected.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Phone Number ID (from Meta Business)</label>
                <input
                  value={phoneId}
                  onChange={e => setPhoneId(e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Phone Number (with country code)</label>
                <input
                  value={phoneNum}
                  onChange={e => setPhoneNum(e.target.value)}
                  placeholder="e.g. +2348012345678"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Display Name (optional)</label>
                <input
                  value={dispName}
                  onChange={e => setDispName(e.target.value)}
                  placeholder="e.g. My Business Name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={assignNumber}
                disabled={working || !phoneId.trim() || !phoneNum.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {working ? 'Assigning...' : 'Assign & Notify User'}
              </button>
              <button
                onClick={() => { setSelected(null); setErr('') }}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
