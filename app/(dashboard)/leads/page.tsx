'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export const dynamic = 'force-dynamic'

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  service_id: string
  appointment_date: string
  time_slot: string
  payment_status: string
  created_at: string
}
interface Contact {
  id: string; phone: string; wa_name: string | null; name: string | null
  status: string; created_at: string
}
interface Message {
  id: string; direction: 'outbound' | 'inbound'; content: string | null
  msg_type: string; status: string; sent_at: string
}
interface CustomerProfile {
  id: string; full_name: string | null; wa_name: string | null
  hair_type: string | null; preferred_stylist: string | null
  loyalty_tier: string | null; last_visit_date: string | null
}

const PAYMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:     { label: 'Confirmed',        color: '#059669', bg: '#ECFDF5' },
  pending:  { label: 'Awaiting payment', color: '#D97706', bg: '#FFFBEB' },
  failed:   { label: 'Failed',           color: '#DC2626', bg: '#FEF2F2' },
  refunded: { label: 'Refunded',         color: '#6B7280', bg: '#F9FAFB' },
}

const PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#F7DC6F','#BB8FCE','#FF8C94','#52C9A0','#FFB347','#87CEEB']
function avatarColor(seed: string) {
  let h = 0; for (const c of seed) h = ((h << 5) - h) + c.charCodeAt(0)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(name: string | null) {
  if (!name) return 'WA'
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase()
}
function displayName(c: Contact, booking: Booking | null) {
  return booking?.customer_name ?? c.wa_name ?? c.name ?? c.phone
}
function formatServiceId(id: string) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}
function timeStr(iso: string) { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
function dateStr(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function formatApptDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}
function normalizePhone(p: string) { return p.replace(/\D/g, '') }
function activeBookingForPhone(bookings: Booking[], phone: string) {
  const today = new Date().toISOString().slice(0, 10)
  const norm = normalizePhone(phone)
  return bookings
    .filter(b => normalizePhone(b.customer_phone) === norm && b.appointment_date >= today && !['failed', 'refunded'].includes(b.payment_status))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0] ?? null
}

function Avatar({ contact, booking, size = 40 }: { contact: Contact; booking: Booking | null; size?: number }) {
  const name = displayName(contact, booking)
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: avatarColor(contact.phone), fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  )
}

function CustomerBookingPanel({ contact, booking, profile }: {
  contact: Contact; booking: Booking | null; profile: CustomerProfile | null
}) {
  const name = displayName(contact, booking)
  const st = booking ? (PAYMENT_META[booking.payment_status] ?? PAYMENT_META.pending) : null
  const waLink = `https://wa.me/${contact.phone.replace(/\D/g, '')}`

  return (
    <div className="flex flex-col h-full border-l border-[#F2F2F7] bg-white">
      <div className="px-4 py-4 border-b border-[#F2F2F7] text-center"
        style={{ background: `linear-gradient(160deg,${avatarColor(contact.phone)}18,${avatarColor(contact.phone)}06)` }}>
        <Avatar contact={contact} booking={booking} size={56} />
        <h3 className="text-[#1C1C1E] font-black text-base mt-2 leading-tight">{name}</h3>
        <p className="text-[#8E8E93] text-xs font-mono mt-0.5">{contact.phone}</p>
        {st && (
          <span className="inline-block mt-2 text-[10px] font-black px-2.5 py-1 rounded-xl"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {booking ? (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">Active appointment</p>
              <div className="rounded-2xl p-4 space-y-3" style={{ background: st?.bg, border: `1px solid ${st?.color}30` }}>
                <p className="text-[#1C1C1E] font-black text-sm">{formatServiceId(booking.service_id)}</p>
                <div className="space-y-1.5 text-sm">
                  <p className="text-[#1C1C1E]">📅 {formatApptDate(booking.appointment_date)}</p>
                  <p className="text-[#1C1C1E]">🕐 {String(booking.time_slot ?? 'TBC')}</p>
                  <p className="font-semibold" style={{ color: st?.color }}>{st?.label}</p>
                </div>
              </div>
            </div>

            {profile && (profile.hair_type || profile.preferred_stylist || profile.last_visit_date) && (
              <div>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">Customer profile</p>
                <div className="rounded-2xl bg-[#F9FAFB] p-3 space-y-1.5 text-sm text-[#1C1C1E]">
                  {profile.hair_type && <p>Hair type: <span className="font-semibold">{profile.hair_type}</span></p>}
                  {profile.preferred_stylist && <p>Stylist: <span className="font-semibold">{profile.preferred_stylist}</span></p>}
                  {profile.last_visit_date && <p>Last visit: <span className="font-semibold">{profile.last_visit_date}</span></p>}
                  {profile.loyalty_tier && profile.loyalty_tier !== 'standard' && (
                    <p>Loyalty: <span className="font-semibold capitalize">{profile.loyalty_tier}</span></p>
                  )}
                </div>
              </div>
            )}

            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: '#25D366' }}>
              Message on WhatsApp
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
            <div className="w-10 h-10 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="text-[#8E8E93] text-sm font-semibold">No upcoming appointment</p>
            <p className="text-[#C7C7CC] text-xs mt-1">Bookings from WhatsApp will appear here</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="mt-4 text-xs font-bold text-[#25D366]">Open WhatsApp chat →</a>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const out    = msg.direction === 'outbound'
  const isForm = msg.msg_type === 'form_submission'
  const label  = isForm ? msg.content ?? 'Booking submitted'
    : !out ? msg.content ?? ''
    : msg.msg_type === 'template' ? '📨  Outreach sent'
    : msg.msg_type === 'bot_reply' || msg.msg_type === 'ai_reply' ? `🤖 ${msg.content ?? ''}`
    : msg.msg_type === 'booking_confirmed' ? `✅ ${msg.content ?? 'Booking confirmed'}`
    : msg.msg_type === 'flow' ? '📋  Form sent'
    : msg.content ?? ''

  return (
    <div className={`flex mb-1.5 ${out ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm"
          style={isForm ? { background: '#34C75910', border: '1px solid #34C75930' }
            : out ? { background: '#DCF8C6' }
            : { background: 'white', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ color: isForm ? '#34C759' : '#1C1C1E', whiteSpace: 'pre-wrap' }}>{label}</p>
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${out ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#667781]">{timeStr(msg.sent_at)}</span>
          {out && <span style={{ color: msg.status === 'read' ? '#34C759' : '#C7C7CC', fontSize: 10 }}>
            {msg.status === 'sent' ? '✓' : '✓✓'}
          </span>}
        </div>
      </div>
    </div>
  )
}

function ConversationPanel({ contactId, onBookingLoaded }: {
  contactId: string
  onBookingLoaded: (data: { activeBooking: Booking | null; customerProfile: CustomerProfile | null }) => void
}) {
  const [msgs,    setMsgs]    = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reply,   setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${contactId}`)
    if (res.ok) {
      const d = await res.json()
      setMsgs(d.messages ?? [])
      onBookingLoaded({
        activeBooking: d.activeBooking ?? null,
        customerProfile: d.customerProfile ?? null,
      })
    }
    setLoading(false)
  }, [contactId, onBookingLoaded])

  useEffect(() => {
    setLoading(true); setMsgs([]); load()
    const ch = supabaseBrowser
      .channel(`leads-conv-${contactId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, load)
      .subscribe()
    return () => { supabaseBrowser.removeChannel(ch) }
  }, [contactId, load])

  useEffect(() => { if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, loading])

  type G = { date: string; msgs: Message[] }
  const groups = msgs.reduce<G[]>((acc, m) => {
    const d = dateStr(m.sent_at)
    const last = acc[acc.length - 1]
    if (last?.date === d) last.msgs.push(m); else acc.push({ date: d, msgs: [m] })
    return acc
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ background: '#ECE5DD' }}>
        <div className="min-h-full flex flex-col justify-end">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex justify-center pt-8">
            <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">No messages yet</span>
          </div>
        ) : groups.map(g => (
          <div key={g.date}>
            <div className="flex justify-center my-2">
              <span className="text-[10px] text-[#8E8E93] bg-black/[0.05] px-3 py-1 rounded-full">{g.date}</span>
            </div>
            {g.msgs.map(m => <ChatBubble key={m.id} msg={m} />)}
          </div>
        ))}
        <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={async e => {
        e.preventDefault()
        if (!reply.trim()) return
        setSending(true)
        const res = await fetch('/api/send/reply', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, message: reply.trim() }),
        })
        setSending(false)
        if (res.ok) { setReply(''); load() }
      }} className="flex items-end gap-2 px-3 py-3 border-t border-black/[0.05] shrink-0 bg-white">
        <input value={reply} onChange={e => setReply(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-[#F2F2F7] rounded-2xl px-4 py-2.5 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none" />
        <button type="submit" disabled={sending || !reply.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
          style={{ background: '#25D366' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

function ContactItem({ contact, booking, active, onClick }: {
  contact: Contact; booking: Booking | null; active: boolean; onClick: () => void
}) {
  const name = displayName(contact, booking)
  const st   = booking ? (PAYMENT_META[booking.payment_status] ?? PAYMENT_META.pending) : null
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-black/[0.04] transition-colors"
      style={{ background: active ? `${avatarColor(contact.phone)}12` : 'transparent' }}>
      <Avatar contact={contact} booking={booking} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[#1C1C1E] font-bold text-sm truncate">{name}</p>
          {st && <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>}
        </div>
        <p className="text-[#8E8E93] text-[11px] font-mono mt-0.5 truncate">{contact.phone}</p>
        <p className="text-[#C7C7CC] text-[11px] truncate mt-0.5">
          {booking
            ? `${formatServiceId(booking.service_id)} · ${formatApptDate(booking.appointment_date)}`
            : 'No upcoming appointment'}
        </p>
      </div>
    </button>
  )
}

function LeadsPageContent() {
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all'|'upcoming'|'pending'>('all')
  const [panelBooking, setPanelBooking] = useState<Booking | null>(null)
  const [panelProfile, setPanelProfile] = useState<CustomerProfile | null>(null)

  const load = useCallback(async () => {
    const [cRes, bRes] = await Promise.all([fetch('/api/contacts'), fetch('/api/bookings')])
    const [cs, bs]     = await Promise.all([cRes.json(), bRes.json()])
    setContacts(Array.isArray(cs) ? cs : [])
    setBookings(Array.isArray(bs) ? bs : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = searchParams.get('selected')
    if (id) setSelected(id)
  }, [searchParams])

  const pairs = contacts.map(c => ({
    contact: c,
    booking: activeBookingForPhone(bookings, c.phone),
  }))
  const counts = {
    all:       pairs.length,
    upcoming:  pairs.filter(p => p.booking).length,
    pending:   pairs.filter(p => p.booking?.payment_status === 'pending').length,
  }
  const filtered = filter === 'all' ? pairs
    : filter === 'upcoming' ? pairs.filter(p => p.booking)
    : pairs.filter(p => p.booking?.payment_status === 'pending')

  const selContact = contacts.find(c => c.id === selected) ?? null
  const selBooking = selContact ? activeBookingForPhone(bookings, selContact.phone) : null
  const displayBooking = panelBooking ?? selBooking

  const handleBookingLoaded = useCallback((data: { activeBooking: Booking | null; customerProfile: CustomerProfile | null }) => {
    setPanelBooking(data.activeBooking)
    setPanelProfile(data.customerProfile)
  }, [])

  return (
    <div className="flex rounded-3xl overflow-hidden" style={{ height: 'calc(100vh - 4rem)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

      <div className="w-64 xl:w-72 shrink-0 border-r border-black/[0.06] bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-black/[0.05]">
          <h1 className="text-[#1C1C1E] font-black text-sm">Customers</h1>
          <p className="text-[#8E8E93] text-xs mt-0.5">{counts.all} contacts · {counts.upcoming} with appointments</p>
        </div>

        <div className="flex gap-0.5 px-2 py-2 border-b border-black/[0.04]">
          {(['all','upcoming','pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 text-[10px] font-bold py-1.5 rounded-xl transition-all"
              style={filter === f
                ? { background: '#8B5CF612', color: '#8B5CF6' }
                : { color: '#8E8E93' }}>
              {f === 'all' ? 'All' : f === 'upcoming' ? 'Booked' : 'Unpaid'}
              <span className="ml-0.5 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#F2F2F7] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#F2F2F7] rounded-full animate-pulse w-3/4" />
                    <div className="h-2 bg-[#F2F2F7] rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-5 text-center">
              <p className="text-[#1C1C1E] font-semibold text-sm">No contacts</p>
              <p className="text-[#8E8E93] text-xs mt-1">WhatsApp conversations appear here</p>
            </div>
          ) : filtered.map(({ contact, booking }) => (
            <ContactItem key={contact.id} contact={contact} booking={booking}
              active={selected === contact.id}
              onClick={() => { setSelected(contact.id); setPanelBooking(null); setPanelProfile(null) }} />
          ))}
        </div>
      </div>

      {selected && selContact ? (
        <>
          <div className="flex-1 flex flex-col min-w-0 border-r border-black/[0.06]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.05] bg-white shrink-0">
              <Avatar contact={selContact} booking={displayBooking} size={34} />
              <div className="flex-1 min-w-0">
                <p className="text-[#1C1C1E] font-bold text-sm truncate">{displayName(selContact, displayBooking)}</p>
                <p className="text-[#8E8E93] text-[11px] font-mono">{selContact.phone}</p>
                {displayBooking && (
                  <p className="text-[11px] text-[#8B5CF6] font-semibold truncate mt-0.5">
                    {formatServiceId(displayBooking.service_id)} · {formatApptDate(displayBooking.appointment_date)} at {displayBooking.time_slot}
                  </p>
                )}
              </div>
              {displayBooking && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0"
                  style={{
                    background: (PAYMENT_META[displayBooking.payment_status] ?? PAYMENT_META.pending).bg,
                    color: (PAYMENT_META[displayBooking.payment_status] ?? PAYMENT_META.pending).color,
                  }}>
                  {(PAYMENT_META[displayBooking.payment_status] ?? PAYMENT_META.pending).label}
                </span>
              )}
            </div>
            <ConversationPanel key={selected} contactId={selected} onBookingLoaded={handleBookingLoaded} />
          </div>

          <div className="w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden">
            <CustomerBookingPanel contact={selContact} booking={displayBooking} profile={panelProfile} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#F2F2F7]">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <p className="text-[#1C1C1E] font-bold">Select a customer</p>
          <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Chat and their active appointment appear side by side</p>
        </div>
      )}
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <LeadsPageContent />
    </Suspense>
  )
}
