'use client'

import { useEffect, useState, useCallback } from 'react'
import type { MessageLog } from '@/types'

type Channel = 'all' | 'whatsapp' | 'email' | 'sms'

function DeliveryIcon({ log }: { log: MessageLog }) {
  const { channel, status } = log

  if (channel === 'whatsapp') {
    if (status === 'read') return (
      <span title="Read" className="flex gap-0.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#34d399"><path d="M1 8l4 4L15 3"/></svg>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#34d399"><path d="M1 8l4 4L15 3"/></svg>
      </span>
    )
    if (status === 'delivered') return (
      <span title="Delivered" className="flex gap-0.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#9ca3af"><path d="M1 8l4 4L15 3"/></svg>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#9ca3af"><path d="M1 8l4 4L15 3"/></svg>
      </span>
    )
    if (status === 'failed') return <span title="Failed" className="text-red-400 text-xs">✕</span>
    return (
      <span title="Sent" className="flex">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#9ca3af"><path d="M1 8l4 4L15 3"/></svg>
      </span>
    )
  }

  if (channel === 'email') {
    if (status === 'opened') return (
      <span title="Opened" className="text-green-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </span>
    )
    if (status === 'delivered') return (
      <span title="Delivered" className="text-blue-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </span>
    )
    if (status === 'bounced' || status === 'failed') return (
      <span title="Bounced / Failed" className="text-red-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
    )
    return (
      <span title="Sent" className="text-gray-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </span>
    )
  }

  // SMS
  if (status === 'delivered') return <span title="Delivered" className="text-green-400 text-xs font-bold">✓✓</span>
  if (status === 'failed') return <span title="Failed" className="text-red-400 text-xs">✕</span>
  return <span title="Sent" className="text-gray-500 text-xs font-bold">✓</span>
}

function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, string> = {
    whatsapp: 'bg-green-500/10 text-green-400 border-green-500/20',
    email: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sms: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${styles[channel] ?? 'bg-gray-500/10 text-gray-400 border-gray-700'}`}>
      {channel}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: 'text-gray-400',
    delivered: 'text-blue-400',
    read: 'text-green-400',
    opened: 'text-green-400',
    failed: 'text-red-400',
    bounced: 'text-red-400',
  }
  return <span className={`text-xs font-medium ${styles[status] ?? 'text-gray-400'}`}>{status}</span>
}

function fmt(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [channel, setChannel] = useState<Channel>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const params = channel !== 'all' ? `?channel=${channel}` : ''
    const res = await fetch(`/api/logs${params}`)
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [channel])

  useEffect(() => { setLoading(true); load() }, [load])

  const tabs: { key: Channel; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'email', label: 'Email' },
    { key: 'sms', label: 'SMS' },
  ]

  const counts = {
    delivered: logs.filter(l => l.status === 'delivered' || l.status === 'read' || l.status === 'opened').length,
    read: logs.filter(l => l.status === 'read' || l.status === 'opened').length,
    failed: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Message Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Delivery status across WhatsApp, Email, and SMS</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'Delivered', count: counts.delivered, color: 'text-blue-400' },
            { label: 'Read / Opened', count: counts.read, color: 'text-green-400' },
            { label: 'Failed', count: counts.failed, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-center min-w-20">
              <p className={`font-bold text-lg tabular-nums ${s.color}`}>{s.count}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setChannel(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              channel === t.key
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-gray-400 font-medium text-sm">No messages logged yet</p>
          <p className="text-gray-600 text-sm mt-1 max-w-xs">Messages will appear here once you start sending via WhatsApp, Email, or SMS</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Delivery</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3 font-medium">Delivered</th>
                <th className="px-5 py-3 font-medium">Read / Opened</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors ${i === logs.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-5 py-3"><ChannelBadge channel={log.channel} /></td>
                  <td className="px-5 py-3 font-mono text-sm text-gray-300 max-w-40 truncate">{log.recipient}</td>
                  <td className="px-5 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-5 py-3"><DeliveryIcon log={log} /></td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{fmt(log.sent_at)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{fmt(log.delivered_at)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{fmt(log.read_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
