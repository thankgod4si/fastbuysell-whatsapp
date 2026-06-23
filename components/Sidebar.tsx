'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

type PathOrPaths = string | readonly string[]

function SvgIcon({ d, size = 16, strokeWidth = 1.8 }: { d: PathOrPaths; size?: number; strokeWidth?: number }) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Icon paths
// ---------------------------------------------------------------------------

const ICON = {
  dashboard:  ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  calendar:   ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  chart:      ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  megaphone:  ['M3 11l19-9-9 19-2-8-8-2z'],
  robot:      ['M12 2a2 2 0 0 1 2 2v2H10V4a2 2 0 0 1 2-2z', 'M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M9 13h2', 'M13 13h2'],
  whatsapp:   'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z',
  leads:      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  sms:        ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7'],
  email:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6 12 13 2 6'],
  templates:  ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M12 11v6', 'M9 14h6'],
  logs:       ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  settings:   ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  billing:    ['M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z', 'M2 11h20'],
  admin:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  logout:     ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  lock:       ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  clock:      ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  zap:        'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  phone:      ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 9.5 19.79 19.79 0 0 1 .14 2.18A2 2 0 0 1 2.18 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 7.91a16 16 0 0 0 6.29 6.29l1.28-1.28a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevronL:   'M15 18l-6-6 6-6',
  chevronR:   'M9 18l6-6-6-6',
  menu:       ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  users:      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:     ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  target:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  sparkles:   'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  alert:      ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4', 'M12 17h.01'],
  trending:   ['M23 6l-9.5 9.5-5-5L1 18'],
  pie:        ['M21.21 15.89A10 10 0 1 1 8 2.83', 'M22 12A10 10 0 0 0 12 2v10z'],
  package:    ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96 12 12.01 20.73 6.96', 'M12 22.08V12.01'],
  report:     ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  shield:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
} as const

// ---------------------------------------------------------------------------
// Nav definition
// ---------------------------------------------------------------------------

type NavItem = { group: string | null; href: string; label: string; icon: PathOrPaths; color: string }

const NAV: NavItem[] = [
  { group: null,         href: '/dashboard',  label: 'Dashboard',         icon: ICON.dashboard, color: '#007AFF' },
  // ── Growth Intelligence ─────────────────────────────────────────────────────────────
  { group: 'Growth',     href: '/customers',  label: 'Customers',         icon: ICON.users,     color: '#007AFF' },
  { group: 'Growth',     href: '/revenue',    label: 'Revenue',           icon: ICON.dollar,    color: '#059669' },
  { group: 'Growth',     href: '/executive',  label: 'Executive',         icon: ICON.chart,      color: '#FF9500' },
  // ── Operations ─────────────────────────────────────────────────────────────────────
  { group: 'Operations', href: '/bookings',   label: 'Appointments',      icon: ICON.calendar,  color: '#007AFF' },
  { group: 'Operations', href: '/staff',      label: 'Staff Portal',      icon: ICON.target,     color: '#007AFF' },
  { group: 'Operations', href: '/staff-management', label: 'Staff Management', icon: ICON.shield,  color: '#007AFF' },
  { group: 'Operations', href: '/inventory',  label: 'Product Inventory', icon: ICON.package,    color: '#007AFF' },
  { group: 'Operations', href: '/reports',    label: 'Customer Reports',  icon: ICON.report,     color: '#DC2626' },
  // ── AI & Automation ────────────────────────────────────────────────────────────────
  { group: 'AI',         href: '/recommendations', label: 'Recommendations', icon: ICON.sparkles,  color: '#FF9500' },
  { group: 'AI',         href: '/follow-up',   label: 'Follow-Up',         icon: ICON.zap,        color: '#007AFF' },
  { group: 'AI',         href: '/reactivation', label: 'Reactivation',     icon: ICON.alert,      color: '#FF6B6B' },
  // ── Outreach ─────────────────────────────────────────────────────────────────────
  { group: 'Outreach',   href: '/contacts',   label: 'WhatsApp Blast',    icon: ICON.whatsapp,  color: '#25D366' },
  { group: 'Outreach',   href: '/campaigns',  label: 'Email Campaigns',   icon: ICON.email,     color: '#007AFF' },
  { group: 'Outreach',   href: '/sms',        label: 'SMS Blast',         icon: ICON.sms,       color: '#FF9500' },
  { group: 'Outreach',   href: '/marketing',  label: 'Meta Ads',          icon: ICON.megaphone, color: '#FF9500' },
  // ── Automation ───────────────────────────────────────────────────────────────────
  { group: 'Automation', href: '/rules',      label: 'Auto Replies',      icon: ICON.zap,       color: '#FF9500' },
  { group: 'Automation', href: '/comments',   label: 'Comment Triggers',  icon: ICON.chart,     color: '#007AFF' },
  // ── Connect ───────────────────────────────────────────────────────────────
  { group: 'Connect',    href: '/meta',          label: 'Meta & WhatsApp',   icon: ICON.phone,     color: '#007AFF' },
  { group: 'Connect',    href: '/catalog',       label: 'Products',          icon: ICON.templates, color: '#007AFF' },
  { group: 'Connect',    href: '/flow-builder',  label: 'Booking Flow',      icon: ICON.zap,       color: '#007AFF' },
  { group: 'Connect',    href: '/templates',     label: 'Templates',         icon: ICON.templates, color: '#007AFF' },
  // ── Analytics ────────────────────────────────────────────────────────────
  { group: 'Analytics',  href: '/logs',       label: 'Delivery Feed',     icon: ICON.robot,     color: '#8E8E93' },
  // ── Account ───────────────────────────────────────────────────────────────
  { group: 'Account',    href: '/billing',    label: 'Credits & Billing', icon: ICON.billing,   color: '#34C759' },
  { group: 'Account',    href: '/settings',   label: 'Settings',          icon: ICON.settings,  color: '#8E8E93' },
]

const NAV_GROUPS = Array.from(new Set(NAV.map(i => i.group).filter(Boolean))) as string[]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionStatus = 'pending_approval' | 'trial' | 'active' | 'suspended'

interface Profile {
  full_name?: string
  subscription_status: SubscriptionStatus
  trial_sends_remaining: number
  is_admin: boolean
  credits: number
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const STATUS_BANNER: Record<
  Exclude<SubscriptionStatus, 'active'>,
  { icon: PathOrPaths; color: string; bg: string; border: string; label: string; sub?: (p: Profile) => string }
> = {
  suspended:        { icon: ICON.lock,  color: '#FF3B30', bg: 'rgba(255,59,48,0.07)',   border: 'rgba(255,59,48,0.15)',   label: 'Account suspended' },
  pending_approval: { icon: ICON.clock, color: '#AF52DE', bg: 'rgba(175,82,222,0.07)',  border: 'rgba(175,82,222,0.15)',  label: 'Awaiting approval' },
  trial:            { icon: ICON.zap,   color: '#FF9500', bg: 'rgba(255,149,0,0.07)',   border: 'rgba(255,149,0,0.15)',   label: 'Free trial', sub: (p) => `${p.trial_sends_remaining} sends remaining` },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavLink({ item, active, collapsed }: { item: Pick<NavItem, 'href' | 'label' | 'icon' | 'color'>; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-xl text-sm transition-colors ${
        collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
      } ${active ? 'font-semibold' : 'font-normal text-[#3C3C43] hover:bg-black/[0.04]'}`}
      style={active ? { background: `${item.color}14`, color: item.color } : {}}
    >
      <span style={{ color: active ? item.color : '#8E8E93' }}>
        <SvgIcon d={item.icon} size={16} />
      </span>
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && active && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />}
    </Link>
  )
}

function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-px bg-black/[0.06] mx-2 my-2" />
  return <p className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">{children}</p>
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')
      const { data } = await supabaseBrowser
        .from('profiles')
        .select('full_name, subscription_status, trial_sends_remaining, is_admin')
        .eq('id', user.id)
        .single()
      if (data) {
        const { data: wallet } = await supabaseBrowser.from('wallets').select('balance').eq('user_id', user.id).maybeSingle()
        const walletBalance = wallet?.balance ?? 0
        const paidCredits = data.subscription_status === 'trial'
          ? Math.max(0, walletBalance - (data.trial_sends_remaining ?? 0))
          : walletBalance
        setProfile({ ...(data as Profile), credits: paidCredits })
      }
    }
    load()
  }, [])

  async function signOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname === base || (base !== '/dashboard' && pathname.startsWith(base))
  }

  const status = profile?.subscription_status
  const banner = status && status !== 'active' ? STATUS_BANNER[status] : null

  const avatarLetter = (profile?.full_name || userEmail).charAt(0).toUpperCase()

  return (
    <aside
      className="shrink-0 min-h-screen flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? '3rem' : '16rem',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderRight: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Brand + toggle */}
      <div className={`flex items-center border-b border-black/[0.05] ${collapsed ? 'justify-center py-4' : 'px-5 py-5 gap-3'}`}>
        {!collapsed && (
          <>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1C1C1E] font-bold text-sm leading-tight">OutreachHQ</p>
              <p className="text-[#8E8E93] text-xs mt-0.5">AI Booking & Outreach</p>
            </div>
          </>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.06] transition-colors shrink-0"
        >
          <SvgIcon d={collapsed ? ICON.chevronR : ICON.chevronL} size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Configure AI CTA */}
      {!collapsed && (
        <Link href="/bookings"
          className="mx-3 mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)', boxShadow: '0 3px 10px rgba(139,92,246,0.3)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span className="text-white text-xs font-bold">AI Booking Active</span>
        </Link>
      )}

      {/* Subscription status banner */}
      {!collapsed && banner && (
        <Link href={status === 'pending_approval' ? '/pending-approval' : '/subscribe'}
          className="mx-3 mt-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-opacity hover:opacity-80"
          style={{ background: banner.bg, border: `1px solid ${banner.border}` }}>
          <span style={{ color: banner.color }}>
            <SvgIcon d={banner.icon} size={14} strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-semibold leading-tight" style={{ color: banner.color }}>{banner.label}</p>
            {banner.sub && profile && (
              <p className="text-[10px] mt-0.5" style={{ color: `${banner.color}99` }}>{banner.sub(profile)}</p>
            )}
          </div>
        </Link>
      )}

      {/* Credits pill */}
      {!collapsed && profile !== null && (
        <Link href="/billing"
          className="mx-3 mt-2 mb-1 flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-opacity hover:opacity-80"
          style={{ background: (profile.credits ?? 0) > 0 ? 'rgba(37,211,102,0.08)' : 'rgba(255,59,48,0.07)', border: `1px solid ${(profile.credits ?? 0) > 0 ? 'rgba(37,211,102,0.2)' : 'rgba(255,59,48,0.15)'}` }}>
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={(profile.credits ?? 0) > 0 ? '#25D366' : '#FF3B30'} strokeWidth="2.5">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span className="text-xs font-bold" style={{ color: (profile.credits ?? 0) > 0 ? '#25D366' : '#FF3B30' }}>
              {(profile.credits ?? 0).toLocaleString()} credits
            </span>
          </div>
          <span className="text-[10px] font-semibold" style={{ color: (profile.credits ?? 0) > 0 ? '#25D36680' : '#FF3B3080' }}>
            {(profile.credits ?? 0) > 0 ? 'Top up' : 'Buy credits'}
          </span>
        </Link>
      )}

      {/* Navigation */}
      <nav className={`flex-1 py-3 overflow-y-auto space-y-0.5 ${collapsed ? 'px-1.5' : 'px-3'}`}>
        {NAV.filter(i => !i.group).map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        {NAV_GROUPS.map(group => (
          <div key={group} className="pt-4">
            <SectionLabel collapsed={collapsed}>{group}</SectionLabel>
            {NAV.filter(i => i.group === group).map(item => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}
          </div>
        ))}

        {profile?.is_admin && (
          <div className="pt-4">
            <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
            <NavLink
              item={{ href: '/admin', label: 'User Management', icon: ICON.admin, color: '#FF9500' }}
              active={pathname.startsWith('/admin')}
              collapsed={collapsed}
            />
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className={`border-t border-black/[0.05] ${collapsed ? 'p-1.5' : 'p-3'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button onClick={signOut} title="Sign out"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8E8E93] hover:text-[#FF3B30] hover:bg-black/[0.06] transition-colors">
              <SvgIcon d={ICON.logout} size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.03]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1C1C1E] text-xs font-semibold truncate">{profile?.full_name || 'Account'}</p>
              <p className="text-[#8E8E93] text-[10px] truncate">{userEmail}</p>
            </div>
            <button onClick={signOut} title="Sign out"
              className="text-[#8E8E93] hover:text-[#FF3B30] transition-colors">
              <SvgIcon d={ICON.logout} size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
