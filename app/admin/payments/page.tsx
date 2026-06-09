'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentRequest {
  id: string
  user_id: string
  pack_id: string
  credits_requested: number
  amount_naira: number
  receipt_url: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  // joined
  email: string
  full_name: string | null
  current_balance: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmt(n: number) { return n.toLocaleString('en-NG') }

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [requests, setRequests]   = useState<PaymentRequest[]>([])
  const [loading,  setLoading]    = useState(true)
  const [working,  setWorking]    = useState<string | null>(null)
  const [toast,    setToast]      = useState<{ msg: string; ok: boolean } | null>(null)
  const [filter,   setFilter]     = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [addOpen,  setAddOpen]    = useState<PaymentRequest | null>(null)
  const [addAmt,   setAddAmt]     = useState('')
  const [addNote,  setAddNote]    = useState('')

  function notify(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/payments')
    if (res.status === 401 || res.status === 403) { router.push('/contacts'); return }
    const data = await res.json()
    setRequests(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function approve(req: PaymentRequest) {
    setWorking(req.id)
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: req.id,
        user_id:    req.user_id,
        amount:     req.credits_requested,
        description: `Credit top-up: ${req.pack_id} pack — ₦${fmt(req.amount_naira)}`,
      }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
      notify(`✓ ${req.credits_requested} credits added to ${req.email}`)
    } else {
      const d = await res.json()
      notify(d.error ?? 'Failed', false)
    }
    setWorking(null)
  }

  async function reject(id: string) {
    setWorking(id)
    const res = await fetch('/api/admin/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, status: 'rejected' }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
      notify('Rejected')
    } else notify('Failed', false)
    setWorking(null)
  }

  async function manualAdd() {
    if (!addOpen || !addAmt) return
    setWorking(addOpen.id)
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:     addOpen.user_id,
        amount:      parseInt(addAmt),
        description: addNote.trim() || `Manual top-up by admin`,
      }),
    })
    const d = await res.json()
    if (res.ok) {
      notify(`✓ ${addAmt} credits added. New balance: ${d.new_balance}`)
      setAddOpen(null); setAddAmt(''); setAddNote('')
      load()
    } else {
      notify(d.error ?? 'Failed', false)
    }
    setWorking(null)
  }

  const shown = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">Review receipt uploads, approve credits</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 text-sm font-semibold">{pendingCount} pending</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 rounded-2xl p-1 w-fit">
        {(['pending','approved','rejected','all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize"
            style={filter === f
              ? { background: f === 'pending' ? '#F59E0B' : f === 'approved' ? '#34C759' : f === 'rejected' ? '#FF3B30' : '#6B7280', color: 'white' }
              : { color: '#6B7280' }}>
            {f} {f !== 'all' && `(${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-900 rounded-3xl animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-gray-900 rounded-3xl p-12 text-center">
          <p className="text-gray-500 text-sm">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(req => (
            <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold text-sm">{req.full_name ?? req.email}</span>
                    <span className="text-gray-500 text-xs">{req.email}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      req.status === 'pending'  ? 'bg-amber-500/15 text-amber-400' :
                      req.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                      'bg-red-500/15 text-red-400'}`}>
                      {req.status.toUpperCase()}
                    </span>
                    <span className="text-gray-600 text-xs">{timeAgo(req.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400 font-bold">+{fmt(req.credits_requested)} credits</span>
                    <span className="text-gray-400">₦{fmt(req.amount_naira)}</span>
                    <span className="text-gray-600 capitalize">{req.pack_id} pack</span>
                    <span className="text-gray-600">wallet: {fmt(req.current_balance)}</span>
                  </div>
                  {req.note && <p className="text-gray-500 text-xs mt-1 italic">"{req.note}"</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.receipt_url && (
                    <a href={req.receipt_url} target="_blank" rel="noreferrer"
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:text-white transition-colors">
                      View Receipt
                    </a>
                  )}
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => approve(req)} disabled={working === req.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors">
                        {working === req.id ? '…' : '✓ Approve'}
                      </button>
                      <button onClick={() => reject(req.id)} disabled={working === req.id}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => { setAddOpen(req); setAddAmt(String(req.credits_requested)); setAddNote('') }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                    + Credits
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual add credits modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setAddOpen(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-white font-bold">Add Credits Manually</p>
              <p className="text-gray-500 text-xs mt-0.5">{addOpen.full_name ?? addOpen.email}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Credits to add</label>
                <input type="number" value={addAmt} onChange={e => setAddAmt(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-2xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Note (optional)</label>
                <input type="text" value={addNote} onChange={e => setAddNote(e.target.value)}
                  placeholder="e.g. Verified ₦10,000 transfer"
                  className="w-full bg-gray-800 text-white rounded-2xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-green-500 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddOpen(null)} className="flex-1 py-3 rounded-2xl text-sm text-gray-400 bg-gray-800">Cancel</button>
              <button onClick={manualAdd} disabled={!addAmt || working === addOpen.id}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors">
                {working === addOpen.id ? 'Adding…' : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl z-50 ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
