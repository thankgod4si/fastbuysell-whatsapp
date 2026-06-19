'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// â”€â”€â”€ Channel logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChannelLogo({ channel }: { channel: string }) {
  if (channel === 'whatsapp') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  )
  if (channel === 'instagram') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="ig2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig2)"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
    </svg>
  )
  if (channel === 'facebook' || channel === 'social') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/>
    </svg>
  )
  if (channel === 'sms') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>
    </svg>
  )
  // email / other
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AF52DE" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <path d="M22 6 12 13 2 6"/>
    </svg>
  )
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MsgLog {
  id: string
  channel: string
  recipient: string
  content: string | null
  direction: string
  msg_type: string
  status: string
  sent_at: string
  contact_id: string | null
  contacts?: { id: string; wa_name: string | null; name: string | null } | null
}

type FilterTab = 'all' | 'whatsapp' | 'instagram' | 'facebook' | 'sms' | 'email'

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function channelLabel(ch: string) {
  const map: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', social: 'Social', sms: 'SMS', email: 'Email' }
  return map[ch] ?? ch
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InboxPage() {
  const [items,   setItems]   = useState<MsgLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [tab,     setTab]     = useState<FilterTab>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/inbox')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Group into conversations (latest message per contact/phone)
  const conversations = (() => {
    const map = new Map<string, MsgLog>()
    for (const item of items) {
      // Normalise channel: facebook/social both show as 'social' in DB
      const ch = item.channel === 'social' ? 'facebook' : item.channel
      const normalised = { ...item, channel: ch }
      const key = item.contact_id ?? item.recipient
      if (!map.has(key)) map.set(key, normalised)
    }
    return Array.from(map.values())
      .filter(item => {
        if (tab !== 'all' && item.channel !== tab) return false
        if (!search) return true
        const name = (item.contacts as MsgLog['contacts'])?.wa_name ?? (item.contacts as MsgLog['contacts'])?.name ?? ''
        return item.recipient.toLowerCase().includes(search.toLowerCase()) ||
               name.toLowerCase().includes(search.toLowerCase()) ||
               (item.content ?? '').toLowerCase().includes(search.toLowerCase())
      })
  })()

  // Tab counts
  const counts: Record<FilterTab, number> = {
    all:       items.length,
    whatsapp:  items.filter(i => i.channel === 'whatsapp').length,
    instagram: items.filter(i => i.channel === 'instagram').length,
    facebook:  items.filter(i => i.channel === 'facebook' || i.channel === 'social').length,
    sms:       items.filter(i => i.channel === 'sms').length,
    email:     items.filter(i => i.channel === 'email').length,
  }

  const inboundCount = items.filter(i => i.direction === 'inbound').length

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',       label: `All (${counts.all})` },
    { id: 'whatsapp',  label: `WhatsApp (${counts.whatsapp})` },
    { id: 'instagram', label: `Instagram (${counts.instagram})` },
    { id: 'facebook',  label: `Facebook (${counts.facebook})` },
    { id: 'sms',       label: `SMS (${counts.sms})` },
    { id: 'email',     label: `Email (${counts.email})` },
  ]

  return (
    <div className="max-w-4xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Unified Inbox</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">All conversations â€” WhatsApp, Instagram, Facebook, SMS, Email</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#007AFF]/10 text-[#007AFF] px-3 py-1.5 rounded-full font-semibold">
            {inboundCount} inbound
          </span>
          <button onClick={load}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] bg-white hover:bg-black/[0.04] transition-colors"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            â†»
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, number, or messageâ€¦"
          className="bg-transparent text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none flex-1" />
      </div>

      {/* Channel filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.filter(t => t.id === 'all' || counts[t.id] > 0).map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {t.id !== 'all' && <ChannelLogo channel={t.id} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">ðŸ“¬</div>
          <p className="text-[#1C1C1E] font-bold text-sm">No conversations</p>
          <p className="text-[#8E8E93] text-xs mt-1">
            {tab !== 'all' ? `No ${channelLabel(tab)} messages yet.` : 'Messages from WhatsApp, Instagram, and Facebook will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(item => {
            const contact = item.contacts as MsgLog['contacts']
            const displayName = contact?.wa_name ?? contact?.name ?? item.recipient
            const isAiHandled = item.msg_type === 'auto_reply' || item.msg_type === 'dm_auto'
            const isInbound   = item.direction === 'inbound'
            const href = item.contact_id ? `/leads?selected=${item.contact_id}` : '/inbox'

            return (
              <Link key={item.id} href={href}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 hover:shadow-md transition-all"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* Avatar with channel badge */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ChannelLogo channel={item.channel} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1C1C1E] truncate">{displayName}</p>
                    {isAiHandled && (
                      <span className="shrink-0 text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E8E93] truncate mt-0.5">
                    {isInbound ? '' : 'â†© '}{item.content ?? '(media message)'}
                  </p>
                </div>

                {/* Meta */}
                <div className="shrink-0 text-right space-y-1">
                  <p className="text-[11px] text-[#C7C7CC]">{timeAgo(item.sent_at)}</p>
                  {isInbound && (
                    <span className="block w-2 h-2 rounded-full bg-[#007AFF] ml-auto" title="Unread" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

