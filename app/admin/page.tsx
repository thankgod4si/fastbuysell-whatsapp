'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type SubscriptionStatus = 'pending_approval' | 'trial' | 'active' | 'suspended'

interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  last_sign_in_at: string | null
  last_sent_at: string | null
  subscription_status: SubscriptionStatus
  trial_sends_remaining: number
  credits: number
  messages_sent_total: number
  is_admin: boolean
  wa_phone_number: string | null
  wa_verified: boolean
  email_domain: string | null
  has_resend_key: boolean
}

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  pending_approval: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  trial:            'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  active:           'bg-green-500/10 text-green-400 border border-green-500/20',
  suspended:        'bg-red-500/10 text-red-400 border border-red-500/20',
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending_approval: 'Pending',
  trial:            'Trial',
  active:           'Active',
  suspended:        'Suspended',
}

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | SubscriptionStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 401) { router.push('/contacts'); return }
    setUsers(await res.json())
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  function notify(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function setStatus(userId: string, status: SubscriptionStatus) {
    setUpdating(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_status: status }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_status: status } : u))
      const labels: Record<string, string> = { active: 'activated', suspended: 'suspended', trial: 'set to trial', pending_approval: 'set to pending' }
      notify(`Account ${labels[status] ?? status}`)
    } else {
      notify('Failed to update', false)
    }
    setUpdating(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.wa_phone_number ?? '').includes(search) ||
      (u.email_domain ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.subscription_status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total:    users.length,
    pending:  users.filter(u => u.subscription_status === 'pending_approval').length,
    active:   users.filter(u => u.subscription_status === 'active').length,
    trial:    users.filter(u => u.subscription_status === 'trial').length,
    suspended:users.filter(u => u.subscription_status === 'suspended').length,
    totalMsgs:users.reduce((s, u) => s + (u.messages_sent_total ?? 0), 0),
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
        <p className="text-gray-500 text-sm">Approve signups, monitor usage, and manage account access.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-white' },
          { label: 'Pending',   value: stats.pending,   color: 'text-purple-400' },
          { label: 'Active',    value: stats.active,    color: 'text-green-400' },
          { label: 'Trial',     value: stats.trial,     color: 'text-amber-400' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
          { label: 'Sends',     value: stats.totalMsgs, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-gray-600 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approval alert */}
      {stats.pending > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 mb-5">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shrink-0" />
          <p className="text-purple-300 text-sm font-medium">
            {stats.pending} user{stats.pending !== 1 ? 's' : ''} waiting for approval
          </p>
          <button onClick={() => setFilter('pending_approval')} className="ml-auto text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Show pending →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, name, phone, or domain…"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending_approval', 'active', 'trial', 'suspended'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                filter === f
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
              }`}>
              {f === 'all' ? 'All' : f === 'pending_approval' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-600 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-gray-600 text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">WhatsApp</th>
                  <th className="px-5 py-3 font-medium">Email Setup</th>
                  <th className="px-5 py-3 font-medium text-right">Credits</th>
                  <th className="px-5 py-3 font-medium text-right">Sends</th>
                  <th className="px-5 py-3 font-medium">Last Active</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>

                    {/* User */}
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{u.full_name || <span className="text-gray-600 italic">No name</span>}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[u.subscription_status]}`}>
                        {STATUS_LABEL[u.subscription_status]}
                      </span>
                    </td>

                    {/* WhatsApp */}
                    <td className="px-5 py-3.5">
                      {u.wa_phone_number ? (
                        <div>
                          <p className="text-white text-xs font-mono">{u.wa_phone_number}</p>
                          <p className={`text-xs mt-0.5 ${u.wa_verified ? 'text-green-400' : 'text-amber-400'}`}>
                            {u.wa_verified ? '✓ verified' : '⚠ unverified'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Not set</span>
                      )}
                    </td>

                    {/* Email setup */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {u.email_domain ? (
                          <p className="text-white text-xs font-mono">@{u.email_domain}</p>
                        ) : (
                          <p className="text-gray-600 text-xs">No domain</p>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs ${u.has_resend_key ? 'text-green-400' : 'text-gray-600'}`}>
                          {u.has_resend_key ? '✓ Resend key set' : '✗ No Resend key'}
                        </span>
                      </div>
                    </td>

                    {/* Credits remaining */}
                    <td className="px-5 py-3.5 text-right">
                      {u.subscription_status === 'active' ? (
                        <span className="text-green-400 text-xs font-semibold">Unlimited</span>
                      ) : u.subscription_status === 'trial' ? (
                        <div className="space-y-1 text-right">
                          <span className={`text-xs font-mono font-bold ${u.credits > 0 ? 'text-white' : 'text-gray-400'}`}>
                            {u.credits} paid
                          </span>
                          <span className={`text-xs font-mono font-bold ${u.trial_sends_remaining <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                            {u.trial_sends_remaining} trial
                          </span>
                        </div>
                      ) : u.credits > 0 ? (
                        <span className="text-xs font-mono font-bold text-white">{u.credits}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Total sends */}
                    <td className="px-5 py-3.5 text-right font-mono text-white tabular-nums text-xs">
                      {u.messages_sent_total ?? 0}
                    </td>

                    {/* Last active */}
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {timeAgo(u.last_sent_at ?? u.last_sign_in_at)}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      {u.is_admin ? (
                        <span className="text-xs text-gray-600 italic">admin</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {u.subscription_status === 'pending_approval' && (
                            <button
                              onClick={() => setStatus(u.id, 'trial')}
                              disabled={updating === u.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-40"
                            >
                              {updating === u.id ? '…' : 'Approve'}
                            </button>
                          )}
                          {u.subscription_status !== 'active' && u.subscription_status !== 'pending_approval' && (
                            <button
                              onClick={() => setStatus(u.id, 'active')}
                              disabled={updating === u.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-40"
                            >
                              {updating === u.id ? '…' : 'Activate'}
                            </button>
                          )}
                          {u.subscription_status === 'active' && (
                            <button
                              onClick={() => setStatus(u.id, 'trial')}
                              disabled={updating === u.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                            >
                              {updating === u.id ? '…' : '→ Trial'}
                            </button>
                          )}
                          {u.subscription_status !== 'suspended' && (
                            <button
                              onClick={() => setStatus(u.id, 'suspended')}
                              disabled={updating === u.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                            >
                              {updating === u.id ? '…' : 'Hold'}
                            </button>
                          )}
                          {u.subscription_status === 'suspended' && (
                            <button
                              onClick={() => setStatus(u.id, 'pending_approval')}
                              disabled={updating === u.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 transition-colors disabled:opacity-40"
                            >
                              {updating === u.id ? '…' : 'Unrehold'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border z-50 ${
          toast.ok ? 'bg-gray-900 border-green-500/30 text-green-400' : 'bg-gray-900 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
}
