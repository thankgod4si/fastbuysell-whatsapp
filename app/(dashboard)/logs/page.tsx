'use client'

import { useEffect, useState, useCallback } from 'react'
import type { MessageLog } from '@/types'

const CHANNEL_META: Record<MessageLog['channel'], { icon: string; label: string; color: string }> = {
  whatsapp: { icon: '💬', label: 'WhatsApp', color: '#25D366' },
  email:    { icon: '✉️', label: 'Email',    color: '#AF52DE' },
  sms:      { icon: '📱', label: 'SMS',      color: '#FF9500' },
}

const STATUS_META: Record<MessageLog['status'], { label: string; color: string; dot: string }> = {
  sent:      { label: 'Sent',      color: '#8E8E93', dot: '#8E8E93' },
  delivered: { label: 'Delivered', color: '#007AFF', dot: '#007AFF' },
  read:      { label: 'Read',      color: '#34C759', dot: '#34C759' },
  opened:    { label: 'Opened',    color: '#34C759', dot: '#34C759' },
  failed:    { label: 'Failed',    color: '#FF3B30', dot: '#FF3B30' },
  bounced:   { label: 'Bounced',   color: '#FF3B30', dot: '#FF3B30' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function groupByDate(logs: MessageLog[]): { label: string; items: MessageLog[] }[] {
  const map = new Map<string, MessageLog[]>()
  for (const log of logs) {
    const d = new Date(log.sent_at)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(log)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

type ChannelFilter = MessageLog['channel'] | 'all'
type StatusFilter = MessageLog['status'] | 'all'

export default function LogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/logs')
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l => {
    if (channelFilter !== 'all' && l.channel !== channelFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (search && !l.recipient.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = groupByDate(filtered)

  const totals = {
    sent: logs.length,
    delivered: logs.filter(l => ['delivered','read','opened'].includes(l.status)).length,
    read: logs.filter(l => ['read','opened'].includes(l.status)).length,
    failed: logs.filter(l => ['failed','bounced'].includes(l.status)).length,
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Activity Logs</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">Every message your platform has sent</p>
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Total Sent',  v: totals.sent,      c: '#5856D6', icon: '📨' },
          { l: 'Delivered',   v: totals.delivered,  c: '#007AFF', icon: '✓' },
          { l: 'Read/Opened', v: totals.read,       c: '#34C759', icon: '✓✓' },
          { l: 'Failed',      v: totals.failed,     c: '#FF3B30', icon: '✕' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl p-4 bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.c }}>{s.v.toLocaleString()}</p>
            <p className="text-[#8E8E93] text-xs mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 flex-1 min-w-40" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipient…" className="bg-transparent text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none flex-1"/>
        </div>

        {/* Channel filter */}
        <div className="flex bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {(['all', 'whatsapp', 'sms', 'email'] as const).map(c => (
            <button key={c} onClick={() => setChannelFilter(c)}
              className={`px-3.5 py-2.5 text-xs font-semibold transition-colors ${channelFilter === c ? 'text-white' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
              style={channelFilter === c ? { background: c === 'all' ? '#5856D6' : CHANNEL_META[c as MessageLog['channel']].color } : {}}>
              {c === 'all' ? 'All' : CHANNEL_META[c as MessageLog['channel']].icon + ' ' + CHANNEL_META[c as MessageLog['channel']].label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {(['all', 'delivered', 'read', 'failed'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s as StatusFilter)}
              className={`px-3.5 py-2.5 text-xs font-semibold transition-colors ${statusFilter === s ? 'text-white' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
              style={statusFilter === s ? { background: s === 'all' ? '#5856D6' : STATUS_META[s as MessageLog['status']].color } : {}}>
              {s === 'all' ? 'All statuses' : STATUS_META[s as MessageLog['status']].label}
            </button>
          ))}
        </div>

        <button onClick={load} className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#007AFF] bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🗂️</span>
          <p className="text-[#1C1C1E] font-bold">No logs found</p>
          <p className="text-[#8E8E93] text-sm mt-1">Start sending messages to see activity here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-black/[0.06]"/>
                <span className="text-xs font-semibold text-[#8E8E93] shrink-0">{label}</span>
                <div className="flex-1 h-px bg-black/[0.06]"/>
              </div>

              {/* Log entries */}
              <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {items.map((log, idx) => {
                  const ch = CHANNEL_META[log.channel]
                  const st = STATUS_META[log.status]
                  return (
                    <div key={log.id} className={`flex items-center gap-4 px-5 py-4 ${idx !== items.length - 1 ? 'border-b border-black/[0.04]' : ''}`}>
                      {/* Timeline dot + channel icon */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                          style={{ background: `${ch.color}12` }}>
                          {ch.icon}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ background: st.dot }}/>
                      </div>

                      {/* Recipient + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1C1C1E] text-sm font-semibold truncate">{log.recipient}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium" style={{ color: ch.color }}>{ch.label}</span>
                          {log.external_id && <span className="text-[#C7C7CC] text-[10px] font-mono truncate max-w-24">{log.external_id}</span>}
                        </div>
                      </div>

                      {/* Status + time */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold" style={{ color: st.color }}>{st.label}</span>
                        <p className="text-[#C7C7CC] text-[10px] mt-0.5">{timeAgo(log.sent_at)}</p>
                      </div>

                      {/* Failure reason */}
                      {log.failure_reason && (
                        <div className="ml-2 px-2 py-1 rounded-xl bg-[#FF3B30]/8 max-w-32">
                          <p className="text-[#FF3B30] text-[10px] truncate">{log.failure_reason}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-[#C7C7CC] text-xs pb-4">{filtered.length} of {logs.length} entries</p>
    </div>
  )
}
