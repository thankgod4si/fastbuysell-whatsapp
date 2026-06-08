'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ─── Icons ──────────────────────────────────────────────────────────────────

function Icon({ d, size = 16 }: { d: string | string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

const ICONS = {
  dashboard: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z',
  leads: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3'],
  sms: ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7'],
  email: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6 12 13 2 6'],
  logs: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  admin: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
}

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV = [
  { group: null, href: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard, color: '#007AFF' },
  { group: 'Channels', href: '/contacts', label: 'WhatsApp', icon: ICONS.whatsapp, color: '#25D366' },
  { group: 'Channels', href: '/leads', label: 'Leads / CRM', icon: ICONS.leads, color: '#34C759' },
  { group: 'Channels', href: '/sms', label: 'SMS', icon: ICONS.sms, color: '#FF9500' },
  { group: 'Channels', href: '/campaigns', label: 'Email', icon: ICONS.email, color: '#AF52DE' },
  { group: 'Analytics', href: '/logs', label: 'Activity Logs', icon: ICONS.logs, color: '#5856D6' },
  { group: 'Account', href: '/settings', label: 'Settings', icon: ICONS.settings, color: '#8E8E93' },
]

// ─── Profile type ────────────────────────────────────────────────────────────

interface Profile {
  full_name?: string
  subscription_status: 'pending_approval' | 'trial' | 'active' | 'suspended'
  trial_sends_remaining: number
  is_admin: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
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
      if (data) setProfile(data as Profile)
    }
    load()
  }, [])

  async function logout() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  // Group nav items
  const groups: string[] = []
  NAV.forEach(item => { if (item.group && !groups.includes(item.group)) groups.push(item.group) })

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <aside className="w-64 shrink-0 min-h-screen flex flex-col"
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(180%)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>

      {/* Brand */}
      <div className="px-5 py-5 border-b border-black/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 12px rgba(37,211,102,0.35)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z" />
            </svg>
          </div>
          <div>
            <p className="text-[#1C1C1E] font-bold text-sm leading-tight">Fast Buy &amp; Sell</p>
            <p className="text-[#8E8E93] text-xs mt-0.5">Outreach Platform</p>
          </div>
        </div>
      </div>

      {/* Subscription banner */}
      {profile && profile.subscription_status !== 'active' && (
        <Link
          href={profile.subscription_status === 'pending_approval' ? '/pending-approval' : '/subscribe'}
          className="mx-3 mt-3 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2.5 transition-all"
          style={{
            background: profile.subscription_status === 'suspended'
              ? 'rgba(255,59,48,0.08)'
              : profile.subscription_status === 'pending_approval'
              ? 'rgba(175,82,222,0.08)'
              : 'rgba(255,149,0,0.08)',
            border: profile.subscription_status === 'suspended'
              ? '1px solid rgba(255,59,48,0.15)'
              : profile.subscription_status === 'pending_approval'
              ? '1px solid rgba(175,82,222,0.15)'
              : '1px solid rgba(255,149,0,0.15)',
          }}
        >
          <span className="text-base leading-none">
            {profile.subscription_status === 'suspended' ? '🔒' : profile.subscription_status === 'pending_approval' ? '⏳' : '⚡'}
          </span>
          <div>
            {profile.subscription_status === 'suspended' && <p className="font-semibold text-[#FF3B30]">Account suspended</p>}
            {profile.subscription_status === 'pending_approval' && <p className="font-semibold text-[#AF52DE]">Pending approval</p>}
            {profile.subscription_status === 'trial' && (
              <>
                <p className="font-semibold text-[#FF9500]">Free trial</p>
                <p className="text-[#FF9500]/70">{profile.trial_sends_remaining} sends remaining</p>
              </>
            )}
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Ungrouped (Dashboard) */}
        {NAV.filter(i => !i.group).map(item => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {/* Grouped items */}
        {groups.map(group => (
          <div key={group} className="pt-3">
            <p className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">{group}</p>
            {NAV.filter(i => i.group === group).map(item => (
              <NavItem key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
        ))}

        {/* Admin */}
        {profile?.is_admin && (
          <div className="pt-3">
            <p className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">Admin</p>
            <NavItem
              item={{ href: '/admin', label: 'User Management', icon: ICONS.admin, color: '#FF9500' }}
              active={pathname.startsWith('/admin')}
            />
          </div>
        )}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-black/[0.05]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.03]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(profile?.full_name || userEmail).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1C1C1E] text-xs font-semibold truncate">{profile?.full_name || 'Account'}</p>
            <p className="text-[#8E8E93] text-[10px] truncate">{userEmail}</p>
          </div>
          <button onClick={logout} title="Sign out" className="text-[#8E8E93] hover:text-[#FF3B30] transition-colors">
            <Icon d={ICONS.logout} size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ item, active }: { item: { href: string; label: string; icon: string | string[]; color: string }; active: boolean }) {
  return (
    <Link href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'font-semibold' : 'font-normal text-[#3C3C43] hover:bg-black/[0.04]'}`}
      style={active ? { background: `${item.color}14`, color: item.color } : {}}>
      <span style={{ color: active ? item.color : '#8E8E93' }}>
        <Icon d={item.icon} size={16} />
      </span>
      {item.label}
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />}
    </Link>
  )
}
