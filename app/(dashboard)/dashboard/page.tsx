'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ---------------------------------------------------------------------------
// Shared icon component
// ---------------------------------------------------------------------------

function Icon({ d, size = 18, fill = false, color = 'currentColor' }: {
  d: string | string[]
  size?: number
  fill?: boolean
  color?: string
}) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? color : 'none'}
      stroke={fill ? 'none' : color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Channel icon SVG paths
// ---------------------------------------------------------------------------

const CHANNEL_ICON = {
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z',
  email:    ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6 12 13 2 6'],
  sms:      ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7'],
  leads:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
}

const STATUS_COLOR: Record<string, string> = {
  sent: '#8E8E93', delivered: '#007AFF', read: '#34C759',
  opened: '#34C759', failed: '#FF3B30', bounced: '#FF3B30',
}

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: '#25D366', email: '#AF52DE', sms: '#FF9500',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: number
  icon: string | string[]
  color: string
  bg: string
  href: string
}

function StatCard({ label, value, icon, color, bg, href }: StatCardProps) {
  return (
    <Link href={href} className="block rounded-3xl p-5 transition-transform hover:scale-[1.02] active:scale-[0.99]"
      style={{ background: bg, boxShadow: `0 4px 24px ${color}18` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon d={icon} size={18} color={color} />
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color }}>
          {label}
        </span>
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{value.toLocaleString()}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: `${color}80` }}>Total sent</p>
    </Link>
  )
}

function ActivityRow({ log }: {
  log: { id: string; channel: string; recipient: string; status: string; sent_at: string }
}) {
  const color = CHANNEL_COLOR[log.channel] ?? '#8E8E93'
  const icon  = CHANNEL_ICON[log.channel as keyof typeof CHANNEL_ICON] ?? CHANNEL_ICON.email

  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}>
        <Icon d={icon} size={14} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1C1C1E] truncate">{log.recipient}</p>
        <p className="text-xs text-[#8E8E93] mt-0.5">
          <span style={{ color }}>{log.channel}</span>
          {' · '}
          {new Date(log.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <span className="text-xs font-semibold capitalize shrink-0"
        style={{ color: STATUS_COLOR[log.status] ?? '#8E8E93' }}>
        {log.status}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onboarding checklist
// ---------------------------------------------------------------------------

interface SetupStep { key: string; label: string; sub: string; href: string; done: boolean }

function OnboardingCard({ steps }: { steps: SetupStep[] }) {
  const [dismissed, setDismissed] = useState(false)
  const done = steps.filter(s => s.done).length
  const total = steps.length

  if (dismissed || done === total) return null

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#F8F8FF,#EEF2FF)', boxShadow: '0 2px 12px rgba(88,86,214,0.12)' }}>
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#5856D6]/10">
        <div>
          <h2 className="text-[#1C1C1E] font-bold text-sm">Get started — {done}/{total} complete</h2>
          <p className="text-[#8E8E93] text-xs mt-0.5">Finish setup to unlock your first blast</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 rounded-full bg-[#5856D6]/15 overflow-hidden">
            <div className="h-full rounded-full bg-[#5856D6] transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <button onClick={() => setDismissed(true)} className="text-[#C7C7CC] hover:text-[#8E8E93] text-lg leading-none">×</button>
        </div>
      </div>
      <div className="p-4 grid gap-2 sm:grid-cols-2">
        {steps.map(s => (
          <Link key={s.key} href={s.href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/70 hover:bg-white transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
              style={s.done ? { background: '#34C759', boxShadow: '0 2px 6px rgba(52,199,89,0.3)' } : { background: '#F2F2F7' }}>
              {s.done
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1C1C1E] text-xs font-semibold">{s.label}</p>
              <p className="text-[#8E8E93] text-[11px]">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Stats { whatsapp: number; email: number; sms: number; leads: number; delivered: number; read: number }

interface Profile {
  full_name: string | null
  wa_verified: boolean | null
  resend_api_key: string | null
  brevo_api_key: string | null
}

export default function DashboardPage() {
  const [userName,   setUserName]   = useState('')
  const [stats,      setStats]      = useState<Stats>({ whatsapp: 0, email: 0, sms: 0, leads: 0, delivered: 0, read: 0 })
  const [logs,       setLogs]       = useState<{ id: string; channel: string; recipient: string; status: string; sent_at: string }[]>([])
  const [loading,    setLoading]    = useState(true)
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseBrowser
          .from('profiles')
          .select('full_name, wa_verified, resend_api_key, brevo_api_key')
          .eq('id', user.id)
          .single() as { data: Profile | null }
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')

        // Check contacts + templates counts for onboarding
        const [ctRes, tplRes] = await Promise.all([
          fetch('/api/contacts?limit=1'),
          fetch('/api/templates'),
        ])
        const contacts  = await ctRes.json().then((d: unknown) => Array.isArray(d) ? d : [])
        const templates = await tplRes.json().then((d: unknown) => Array.isArray(d) ? d : [])

        setSetupSteps([
          {
            key: 'whatsapp', label: 'Get a WhatsApp number', sub: 'Buy or connect your business number',
            href: '/settings#whatsapp', done: !!profile?.wa_verified,
          },
          {
            key: 'email', label: 'Set up email sending', sub: 'Add your Resend API key',
            href: '/settings', done: !!profile?.resend_api_key,
          },
          {
            key: 'template', label: 'Create a template', sub: 'Write your first outreach message',
            href: '/templates', done: templates.length > 0,
          },
          {
            key: 'contacts', label: 'Import contacts', sub: 'Add people to reach out to',
            href: '/contacts', done: contacts.length > 0,
          },
        ])
      }

      const [logsRes, leadsRes] = await Promise.all([fetch('/api/logs'), fetch('/api/leads')])
      const allLogs  = await logsRes.json().then(d => Array.isArray(d) ? d : [])
      const allLeads = await leadsRes.json().then(d => Array.isArray(d) ? d : [])

      setStats({
        whatsapp:  allLogs.filter((l: { channel: string }) => l.channel === 'whatsapp').length,
        email:     allLogs.filter((l: { channel: string }) => l.channel === 'email').length,
        sms:       allLogs.filter((l: { channel: string }) => l.channel === 'sms').length,
        leads:     allLeads.length,
        delivered: allLogs.filter((l: { status: string }) => ['delivered','read','opened'].includes(l.status)).length,
        read:      allLogs.filter((l: { status: string }) => ['read','opened'].includes(l.status)).length,
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

      {/* Hero */}
      <div className="rounded-3xl p-6 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#007AFF 0%,#5856D6 100%)', boxShadow: '0 8px 32px rgba(0,122,255,0.25)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.08]" style={{ background: 'white' }} />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">{greeting}</p>
          <h1 className="text-white text-2xl font-black mt-0.5">{userName}</h1>
          <p className="text-white/55 text-sm mt-1.5">Here&apos;s your outreach overview.</p>
          <div className="flex items-center gap-6 mt-5">
            {[
              { label: 'Messages sent', value: stats.whatsapp + stats.email + stats.sms },
              { label: 'Read / opened',  value: stats.read },
              { label: 'Leads captured', value: stats.leads },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                {i > 0 && <div className="w-px h-8 bg-white/20" />}
                <div>
                  <p className="text-white text-2xl font-black tabular-nums">{s.value.toLocaleString()}</p>
                  <p className="text-white/55 text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding checklist — hidden once all steps complete or dismissed */}
      {setupSteps.length > 0 && <OnboardingCard steps={setupSteps} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WhatsApp" value={stats.whatsapp} icon={CHANNEL_ICON.whatsapp} color="#25D366" bg="linear-gradient(135deg,#F0FFF4,#DCFCE7)" href="/contacts"  />
        <StatCard label="Email"    value={stats.email}    icon={CHANNEL_ICON.email}    color="#AF52DE" bg="linear-gradient(135deg,#FAF5FF,#EDE9FE)" href="/campaigns" />
        <StatCard label="SMS"      value={stats.sms}      icon={CHANNEL_ICON.sms}      color="#FF9500" bg="linear-gradient(135deg,#FFFBEB,#FEF3C7)" href="/sms"       />
        <StatCard label="Leads"    value={stats.leads}    icon={CHANNEL_ICON.leads}    color="#007AFF" bg="linear-gradient(135deg,#EFF6FF,#DBEAFE)" href="/leads"     />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { href: '/contacts',  icon: CHANNEL_ICON.whatsapp, label: 'WhatsApp Blast', sub: 'Send to contacts',   color: '#25D366' },
          { href: '/campaigns', icon: CHANNEL_ICON.email,    label: 'Email Campaign', sub: 'Create & send',      color: '#AF52DE' },
          { href: '/sms',       icon: CHANNEL_ICON.sms,      label: 'SMS Blast',      sub: 'Bulk text message',  color: '#FF9500' },
        ] as const).map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${a.color}12` }}>
              <Icon d={a.icon} size={17} color={a.color} />
            </div>
            <div className="min-w-0">
              <p className="text-[#1C1C1E] text-sm font-semibold">{a.label}</p>
              <p className="text-[#8E8E93] text-xs">{a.sub}</p>
            </div>
            <svg className="ml-auto shrink-0 text-[#C7C7CC]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
          <h2 className="font-bold text-[#1C1C1E] text-sm">Recent Activity</h2>
          <Link href="/logs" className="text-xs font-semibold" style={{ color: '#007AFF' }}>View all</Link>
        </div>
        <div className="px-6">
          {loading ? (
            <div className="py-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-black/[0.04] rounded-xl animate-pulse" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-3">
                <Icon d="M22 2 11 13 M22 2 15 22l-4-9-9-4 20-7" size={20} color="#007AFF" />
              </div>
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
