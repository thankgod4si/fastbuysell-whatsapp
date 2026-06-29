'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

// â”€â”€â”€ Icon helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Icon({ d, size = 18, color = 'currentColor' }: { d: string | string[]; size?: number; color?: string }) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BookingRow {
  id: string
  customer_name: string
  customer_phone: string
  appointment_date: string
  time_slot: string
  services_menu: { service_name: string; price: number; currency: string } | null
}

interface DashStats {
  todayBookings: number
  todayRevenue: number
  monthRevenue: number
  currency: string
  totalCustomers: number
  inboxToday: number
  aiEnabled: boolean
}

const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }
const fmtMoney = (n: number, cur: string) => `${SYM[cur] ?? cur}${n.toLocaleString()}`

// â”€â”€â”€ Channel logos (inline SVG) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChannelLogo({ channel, size = 16 }: { channel: string; size?: number }) {
  if (channel === 'whatsapp') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  )
  if (channel === 'instagram' || channel === 'social') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
    </svg>
  )
  if (channel === 'facebook') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/>
    </svg>
  )
  // email, sms, etc
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6 12 13 2 6"/></svg>
}

// â”€â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ label, value, sub, color, icon, href }: {
  label: string; value: string; sub: string; color: string; icon: string | string[]; href: string
}) {
  return (
    <Link href={href} className="block bg-white rounded-2xl p-5 hover:shadow-md transition-all group"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}15` }}>
        <Icon d={icon} size={16} color={color} />
      </div>
      <p className="text-2xl font-black tabular-nums text-[#1C1C1E]">{value}</p>
      <p className="text-xs font-semibold text-[#1C1C1E] mt-1">{label}</p>
      <p className="text-xs text-[#8E8E93] mt-0.5">{sub}</p>
    </Link>
  )
}

// â”€â”€â”€ Upcoming appointment row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ApptRow({ b, today }: { b: BookingRow; today: string }) {
  const svc = b.services_menu
  const cur = svc?.currency ?? 'NGN'
  const initials = b.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const isToday = b.appointment_date === today
  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.04] last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: isToday ? 'linear-gradient(135deg,#8B5CF6,#D946EF)' : '#E5E7EB' }}>
        <span style={{ color: isToday ? 'white' : '#6B7280' }}>{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1C1C1E] truncate">{b.customer_name}</p>
        <p className="text-xs text-[#8E8E93]">{svc?.service_name ?? '—'} · {b.time_slot?.slice(0,5)}</p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {svc && <p className="text-sm font-bold text-[#059669]">{fmtMoney(Number(svc.price), cur)}</p>}
        {isToday
          ? <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">Today</span>
          : <span className="text-[10px] text-[#8E8E93]">{b.appointment_date}</span>
        }
      </div>
    </div>
  )
}

// â”€â”€â”€ Inbox preview row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function InboxRow({ item }: { item: { channel: string; recipient: string; content: string | null; sent_at: string; direction: string } }) {
  const mins = Math.floor((Date.now() - new Date(item.sent_at).getTime()) / 60000)
  const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center shrink-0">
        <ChannelLogo channel={item.channel} size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1C1C1E] truncate">{item.recipient}</p>
        <p className="text-xs text-[#8E8E93] truncate">{item.content ?? '(media)'}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-[#C7C7CC]">{ago}</p>
        {item.direction === 'inbound' && (
          <span className="block w-2 h-2 rounded-full bg-[#007AFF] ml-auto mt-1" />
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ Setup prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SetupBanner() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#8B5CF6]/25 bg-[#FAF5FF] p-6 flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
        <Icon d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" size={20} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#1C1C1E] text-sm">Enable AI Booking</p>
        <p className="text-xs text-[#6B7280] mt-0.5">Let customers book appointments 24/7 via WhatsApp, Instagram, and Facebook — fully automated.</p>
      </div>
      <Link href="/settings" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
        Set up →
      </Link>
    </div>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DashboardPage() {
  const [loading,    setLoading]    = useState(true)
  const [userName,   setUserName]   = useState('')
  const [bizName,    setBizName]    = useState('')
  const [stats,      setStats]      = useState<DashStats>({ todayBookings: 0, todayRevenue: 0, monthRevenue: 0, currency: 'NGN', totalCustomers: 0, inboxToday: 0, aiEnabled: false })
  const [upcoming,   setUpcoming]   = useState<BookingRow[]>([])
  const [inbox,      setInbox]      = useState<{ channel: string; recipient: string; content: string | null; sent_at: string; direction: string }[]>([])
  const [outreach,   setOutreach]   = useState({ whatsapp: 0, email: 0, sms: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('full_name, echoes_enabled, business_display_name')
        .eq('id', user.id)
        .maybeSingle()

      setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')
      setBizName(profile?.business_display_name ?? '')

      // â”€â”€ Outreach message counts (all-time) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const { data: msgLogs } = await supabaseBrowser
        .from('message_logs')
        .select('channel, direction, recipient, content, sent_at')
        .eq('direction', 'inbound')
        .order('sent_at', { ascending: false })
        .limit(8)

      setInbox(msgLogs ?? [])

      const { data: allOut } = await supabaseBrowser
        .from('message_logs')
        .select('channel')
        .eq('direction', 'outbound')
      setOutreach({
        whatsapp: (allOut ?? []).filter((l: any) => l.channel === 'whatsapp').length,
        email:    (allOut ?? []).filter((l: any) => l.channel === 'email').length,
        sms:      (allOut ?? []).filter((l: any) => l.channel === 'sms').length,
      })

      // â”€â”€ AI Booking stats (only if enabled) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (profile?.echoes_enabled) {
        const today          = new Date().toISOString().split('T')[0]
        const firstOfMonth   = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const todayStart     = `${today}T00:00:00.000Z`

        const [
          { data: todayBkgs },
          { data: monthTxns },
          { data: customers },
          { data: inboxSessions },
          { data: upcomingBkgs },
        ] = await Promise.all([
          supabaseBrowser.from('bookings').select('id, services_menu(price, currency)').eq('payment_status','paid').eq('appointment_date', today),
          supabaseBrowser.from('booking_transactions').select('amount, currency').eq('status','success').gte('created_at', firstOfMonth),
          supabaseBrowser.from('bookings').select('customer_phone').eq('payment_status','paid'),
          supabaseBrowser.from('booking_sessions').select('id').gte('updated_at', todayStart),
          supabaseBrowser.from('bookings').select('*, services_menu(service_name, price, currency)').eq('payment_status','paid').gte('appointment_date', today).order('appointment_date').order('time_slot').limit(5),
        ])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const todayRev = (todayBkgs ?? []).reduce((s: number, b: any) => s + Number((b as any).services_menu?.price ?? 0), 0)
        const monthRev = (monthTxns ?? []).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0)
        const currency = (monthTxns ?? [])[0]?.currency ?? 'NGN'

        setStats({
          todayBookings:  todayBkgs?.length ?? 0,
          todayRevenue:   todayRev,
          monthRevenue:   monthRev,
          currency,
          totalCustomers: new Set((customers ?? []).map((c: any) => c.customer_phone)).size,
          inboxToday:     inboxSessions?.length ?? 0,
          aiEnabled:      true,
        })
        setUpcoming((upcomingBkgs ?? []) as BookingRow[])
      }

      setLoading(false)
    }
    load()
  }, [])

  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today   = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-5xl space-y-6">

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-3xl p-6 overflow-hidden relative"
        style={{ background: stats.aiEnabled
          ? 'linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%)'
          : 'linear-gradient(135deg,#007AFF 0%,#5856D6 100%)',
          boxShadow: stats.aiEnabled ? '0 8px 32px rgba(139,92,246,0.3)' : '0 8px 32px rgba(0,122,255,0.25)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm">{greeting}, {userName} 👋</p>
          {bizName && <p className="text-white/50 text-xs mt-0.5">{bizName} · {todayLabel}</p>}

          <div className="flex items-center gap-6 mt-4">
            {(stats.aiEnabled ? [
              { label: "Today's bookings",  value: String(stats.todayBookings)                     },
              { label: "Today's revenue",   value: fmtMoney(stats.todayRevenue, stats.currency)    },
              { label: "This month",        value: fmtMoney(stats.monthRevenue, stats.currency)    },
            ] : [
              { label: 'WhatsApp sent',     value: String(outreach.whatsapp)                        },
              { label: 'Email sent',        value: String(outreach.email)                           },
              { label: 'SMS sent',          value: String(outreach.sms)                             },
            ]).map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                {i > 0 && <div className="w-px h-8 bg-white/20" />}
                <div>
                  <p className="text-white text-xl font-black tabular-nums">{s.value}</p>
                  <p className="text-white/55 text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ AI Booking not yet enabled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && !stats.aiEnabled && <SetupBanner />}

      {/* â”€â”€ Booking stat cards (AI enabled) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && stats.aiEnabled && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's Appointments" value={String(stats.todayBookings)}             sub="Confirmed & paid"      color="#8B5CF6" href="/bookings"             icon={['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z']} />
          <StatCard label="Today's Revenue"      value={fmtMoney(stats.todayRevenue,stats.currency)} sub="From paid bookings"  color="#059669" href="/bookings"             icon={['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} />
          <StatCard label="Month Revenue"        value={fmtMoney(stats.monthRevenue,stats.currency)} sub="All confirmed"       color="#007AFF" href="/bookings?tab=sales"   icon={['M18 20V10','M12 20V4','M6 20v-6']} />
          <StatCard label="Total Customers"      value={String(stats.totalCustomers)}            sub="Unique paid clients"   color="#FF9500" href="/leads"                icon={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75']} />
        </div>
      )}

      {/* â”€â”€ Outreach stat cards (always visible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && !stats.aiEnabled && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'WhatsApp Sent', value: outreach.whatsapp, color: '#25D366', href: '/contacts',   icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z' },
            { label: 'Email Sent',    value: outreach.email,    color: '#AF52DE', href: '/campaigns',  icon: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6 12 13 2 6'] },
            { label: 'SMS Sent',      value: outreach.sms,      color: '#FF9500', href: '/sms',        icon: ['M22 2 11 13','M22 2 15 22l-4-9-9-4 20-7'] },
          ].map(c => (
            <Link key={c.href} href={c.href} className="bg-white rounded-2xl p-4 hover:shadow-md transition-all" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${c.color}15` }}>
                <Icon d={c.icon} size={16} color={c.color} />
              </div>
              <p className="text-2xl font-black tabular-nums" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
              <p className="text-xs text-[#8E8E93] mt-0.5">{c.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* â”€â”€ Two-column: Upcoming bookings + Inbox preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && (
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Upcoming appointments */}
          <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
              <h2 className="font-bold text-[#1C1C1E] text-sm">Upcoming Appointments</h2>
              <Link href="/bookings" className="text-xs font-semibold text-[#8B5CF6]">View all →</Link>
            </div>
            <div className="px-6">
              {stats.aiEnabled ? (
                upcoming.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[#8E8E93] text-sm">No upcoming appointments</p>
                    <p className="text-[#C7C7CC] text-xs mt-1">Your AI receptionist is ready on WhatsApp, Instagram &amp; Facebook</p>
                  </div>
                ) : upcoming.map(b => <ApptRow key={b.id} b={b} today={today} />)
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[#8E8E93] text-sm">AI booking not enabled</p>
                  <Link href="/settings" className="text-xs text-[#8B5CF6] font-semibold mt-1 block">Enable AI booking →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Inbox preview */}
          <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between">
              <h2 className="font-bold text-[#1C1C1E] text-sm">Recent Messages</h2>
              <Link href="/inbox" className="text-xs font-semibold text-[#007AFF]">Open inbox →</Link>
            </div>
            <div className="px-5">
              {inbox.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#8E8E93] text-xs">No messages yet</p>
                </div>
              ) : inbox.map((item, i) => <InboxRow key={i} item={item} />)}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Quick actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/contacts',  label: 'WhatsApp Blast', sub: 'Cold outreach',   color: '#25D366', icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z' },
            { href: '/campaigns', label: 'Email Campaign', sub: 'Bulk email ads',  color: '#AF52DE', icon: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6 12 13 2 6'] },
            { href: '/sms',       label: 'SMS Blast',      sub: 'Text outreach',   color: '#FF9500', icon: ['M22 2 11 13','M22 2 15 22l-4-9-9-4 20-7'] },
            { href: '/marketing', label: 'Meta Ads',        sub: 'Local targeting', color: '#007AFF', icon: ['M3 11l19-9-9 19-2-8-8-2z'] },
          ].map(a => (
            <Link key={a.href} href={a.href} className="bg-white rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}12` }}>
                <Icon d={a.icon} size={16} color={a.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[#1C1C1E] text-xs font-semibold">{a.label}</p>
                <p className="text-[#8E8E93] text-[11px]">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
