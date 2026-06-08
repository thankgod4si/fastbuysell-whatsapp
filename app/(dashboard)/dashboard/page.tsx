'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Stats { whatsapp: number; email: number; sms: number; leads: number; delivered: number; read: number }

function StatCard({ label, value, icon, color, bg, href }: { label: string; value: number; icon: string; color: string; bg: string; href: string }) {
  return (
    <Link href={href} className="block rounded-3xl p-5 transition-transform hover:scale-[1.02] active:scale-[0.99]"
      style={{ background: bg, boxShadow: `0 4px 24px ${color}22` }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{label}</span>
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{value.toLocaleString()}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: `${color}99` }}>Total sent</p>
    </Link>
  )
}

function ActivityRow({ log }: { log: { id: string; channel: string; recipient: string; status: string; sent_at: string } }) {
  const icons: Record<string, string> = { whatsapp: '💬', email: '✉️', sms: '📱' }
  const colors: Record<string, string> = { whatsapp: '#25D366', email: '#AF52DE', sms: '#FF9500' }
  const statusColor: Record<string, string> = { sent: '#8E8E93', delivered: '#007AFF', read: '#34C759', opened: '#34C759', failed: '#FF3B30', bounced: '#FF3B30' }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.05] last:border-0">
      <span className="text-lg shrink-0">{icons[log.channel] ?? '📨'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1C1C1E] truncate">{log.recipient}</p>
        <p className="text-xs text-[#8E8E93] mt-0.5">
          via <span style={{ color: colors[log.channel] }}>{log.channel}</span>
          {' · '}{new Date(log.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <span className="text-xs font-semibold capitalize shrink-0" style={{ color: statusColor[log.status] ?? '#8E8E93' }}>{log.status}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<Stats>({ whatsapp: 0, email: 0, sms: 0, leads: 0, delivered: 0, read: 0 })
  const [logs, setLogs] = useState<{ id: string; channel: string; recipient: string; status: string; sent_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseBrowser.from('profiles').select('full_name, messages_sent_total').eq('id', user.id).single()
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')
      }

      // Load logs for stats + recent activity
      const [logsRes, leadsRes] = await Promise.all([
        fetch('/api/logs'),
        fetch('/api/leads'),
      ])
      const logsData = await logsRes.json()
      const leadsData = await leadsRes.json()

      const allLogs = Array.isArray(logsData) ? logsData : []
      const allLeads = Array.isArray(leadsData) ? leadsData : []

      setStats({
        whatsapp: allLogs.filter((l: { channel: string }) => l.channel === 'whatsapp').length,
        email: allLogs.filter((l: { channel: string }) => l.channel === 'email').length,
        sms: allLogs.filter((l: { channel: string }) => l.channel === 'sms').length,
        leads: allLeads.length,
        delivered: allLogs.filter((l: { status: string }) => ['delivered','read','opened'].includes(l.status)).length,
        read: allLogs.filter((l: { status: string }) => ['read','opened'].includes(l.status)).length,
      })
      setLogs(allLogs.slice(0, 12))
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-5xl space-y-6">
      {/* Hero greeting */}
      <div className="rounded-3xl p-6 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', boxShadow: '0 8px 32px rgba(0,122,255,0.3)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'white' }} />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">{greeting},</p>
          <h1 className="text-white text-2xl font-black mt-0.5">{userName} 👋</h1>
          <p className="text-white/60 text-sm mt-2">Here's what's happening with your outreach today.</p>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <p className="text-white text-2xl font-black tabular-nums">{(stats.whatsapp + stats.email + stats.sms).toLocaleString()}</p>
              <p className="text-white/60 text-xs">Total messages sent</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-white text-2xl font-black tabular-nums">{stats.read}</p>
              <p className="text-white/60 text-xs">Read / opened</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-white text-2xl font-black tabular-nums">{stats.leads}</p>
              <p className="text-white/60 text-xs">Leads captured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WhatsApp" value={stats.whatsapp} icon="💬" color="#25D366" bg="linear-gradient(135deg,#F0FFF4,#DCFCE7)" href="/contacts" />
        <StatCard label="Email" value={stats.email} icon="✉️" color="#AF52DE" bg="linear-gradient(135deg,#FAF5FF,#EDE9FE)" href="/campaigns" />
        <StatCard label="SMS" value={stats.sms} icon="📱" color="#FF9500" bg="linear-gradient(135deg,#FFFBEB,#FEF3C7)" href="/sms" />
        <StatCard label="Leads" value={stats.leads} icon="🎯" color="#007AFF" bg="linear-gradient(135deg,#EFF6FF,#DBEAFE)" href="/leads" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/contacts', icon: '💬', label: 'New WhatsApp', sub: 'Send to contacts', color: '#25D366' },
          { href: '/campaigns', icon: '✉️', label: 'New Campaign', sub: 'Email blast', color: '#AF52DE' },
          { href: '/sms', icon: '📱', label: 'SMS Blast', sub: 'Bulk text message', color: '#FF9500' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${a.color}15` }}>
              {a.icon}
            </div>
            <div>
              <p className="text-[#1C1C1E] text-sm font-semibold">{a.label}</p>
              <p className="text-[#8E8E93] text-xs">{a.sub}</p>
            </div>
            <svg className="ml-auto text-[#C7C7CC]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
          <h2 className="font-bold text-[#1C1C1E]">Recent Activity</h2>
          <Link href="/logs" className="text-xs font-semibold" style={{ color: '#007AFF' }}>View all →</Link>
        </div>
        <div className="px-6">
          {loading ? (
            <div className="py-8 text-center text-[#8E8E93] text-sm">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">🚀</p>
              <p className="text-[#1C1C1E] font-semibold text-sm">No activity yet</p>
              <p className="text-[#8E8E93] text-xs mt-1">Start sending to see your activity here</p>
            </div>
          ) : (
            logs.map(log => <ActivityRow key={log.id} log={log} />)
          )}
        </div>
      </div>
    </div>
  )
}
