'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  id: string; phone: string; full_name: string | null; email: string | null
  company: string | null; product_service: string | null; budget: string | null
  car_make: string | null; car_model: string | null; car_year: string | null
  asking_price: string | null; condition: string | null; notes: string | null
  response_data: Record<string, string> | null; status: string; created_at: string
}

interface Contact {
  id: string; phone: string; wa_name: string | null; name: string | null; status: string; created_at: string
}

interface Message {
  id: string; direction: 'outbound' | 'inbound'; content: string | null
  msg_type: string; status: string; sent_at: string
}

interface ConvData { contact: Contact; messages: Message[]; lead: Lead | null }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: 'New',       color: '#007AFF', bg: '#007AFF12' },
  contacted: { label: 'Contacted', color: '#FF9500', bg: '#FF950012' },
  closed:    { label: 'Closed',    color: '#34C759', bg: '#34C75912' },
}

function avatarColor(seed: string): string {
  const palette = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#F7DC6F','#BB8FCE','#FF8C94','#52C9A0','#FFB347','#87CEEB']
  let h = 0
  for (const c of seed) h = ((h << 5) - h) + c.charCodeAt(0)
  return palette[Math.abs(h) % palette.length]
}

function initials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return phone.slice(-2)
}

function displayName(contact: Contact, lead: Lead | null): string {
  return lead?.full_name ?? contact.wa_name ?? contact.name ?? contact.phone
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function dateStr(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86400000)  return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Avatar — colored initials, consistent per phone
// ---------------------------------------------------------------------------

function Avatar({ name, phone, size = 40 }: { name: string | null; phone: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: avatarColor(phone), fontSize: size * 0.36 }}>
      {initials(name, phone)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile drawer
// ---------------------------------------------------------------------------

function LeadProfileDrawer({ contact, lead, onClose, onStatusChange }: {
  contact: Contact; lead: Lead | null
  onClose: () => void; onStatusChange: (id: string, s: string) => void
}) {
  const name = displayName(contact, lead)

  const fields = lead ? [
    { label: 'Email',           value: lead.email },
    { label: 'Company',         value: lead.company },
    { label: 'Product/Service', value: lead.product_service },
    { label: 'Budget',          value: lead.budget },
    { label: 'Car Make',        value: lead.car_make },
    { label: 'Car Model',       value: lead.car_model },
    { label: 'Year',            value: lead.car_year },
    { label: 'Asking Price',    value: lead.asking_price },
    { label: 'Condition',       value: lead.condition },
    { label: 'Notes',           value: lead.notes },
  ].filter(f => f.value) : []

  const extraKeys = lead?.response_data
    ? Object.keys(lead.response_data).filter(k =>
        !['full_name','email','company','product_service','budget','car_make','car_model',
          'car_year','asking_price','condition','notes','flow_db_id','user_id'].includes(k))
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:w-80 h-[88vh] sm:h-full sm:max-h-[82vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto"
        style={{ background: 'white', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}>

        <div className="p-6 text-center relative"
          style={{ background: `linear-gradient(135deg,${avatarColor(contact.phone)}20,${avatarColor(contact.phone)}06)` }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/[0.07] flex items-center justify-center text-[#8E8E93] hover:bg-black/[0.12] text-xl leading-none">
            ×
          </button>
          <Avatar name={name} phone={contact.phone} size={72} />
          <h2 className="text-[#1C1C1E] font-black text-lg mt-3">{name}</h2>
          <p className="text-[#8E8E93] text-sm font-mono mt-0.5">{contact.phone}</p>
          {contact.wa_name && contact.wa_name !== name && (
            <p className="text-[#C7C7CC] text-xs mt-0.5">WA name: {contact.wa_name}</p>
          )}
        </div>

        <div className="p-5 space-y-5">
          {lead && (
            <div>
              <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Lead Status</p>
              <div className="flex gap-2">
                {(['new','contacted','closed'] as const).map(s => {
                  const m = STATUS_META[s]
                  return (
                    <button key={s} onClick={() => onStatusChange(lead.id, s)}
                      className="flex-1 py-2 rounded-2xl text-xs font-bold transition-all"
                      style={lead.status === s ? { background: m.color, color: 'white' } : { background: m.bg, color: m.color }}>
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Contact</p>
            <div className="space-y-1.5">
              <Row label="Phone" value={contact.phone} mono />
              {lead?.email && <Row label="Email" value={lead.email} />}
            </div>
          </div>

          {fields.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Form Details</p>
              <div className="space-y-1.5">
                {fields.map(f => <Row key={f.label} label={f.label} value={f.value!} />)}
                {extraKeys.map(k => (
                  <Row key={k} label={k.replace(/_/g, ' ')} value={String(lead!.response_data![k])} />
                ))}
              </div>
            </div>
          )}

          {!lead && (
            <p className="text-center text-[#C7C7CC] text-sm py-6">No form submitted yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between bg-[#F2F2F7] rounded-2xl px-4 py-2.5">
      <span className="text-[#8E8E93] text-xs capitalize">{label}</span>
      <span className={`text-[#1C1C1E] text-xs font-semibold text-right max-w-[60%] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------

function ChatBubble({ msg }: { msg: Message }) {
  const out = msg.direction === 'outbound'
  const isForm = msg.msg_type === 'form_submission'

  const label = () => {
    if (isForm) return msg.content ?? 'Form submitted'
    if (!out)   return msg.content ?? ''
    if (msg.msg_type === 'template') return '📨  Outreach message sent'
    if (msg.msg_type === 'flow')     return '📋  Form sent — tap button to fill'
    return msg.content ?? ''
  }

  return (
    <div className={`flex mb-2 ${out ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[78%]">
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isForm ? '' : out ? '' : 'bg-white border border-black/[0.06]'
        }`}
          style={
            isForm ? { background: '#34C75910', border: '1px solid #34C75930' } :
            out ? { background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 2px 8px rgba(37,211,102,0.25)' } :
            undefined
          }>
          <p style={{ color: isForm ? '#34C759' : out ? 'white' : '#1C1C1E' }}>{isForm && '✅ '}{label()}</p>
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${out ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#C7C7CC]">{timeStr(msg.sent_at)}</span>
          {out && (
            <span style={{ color: msg.status === 'read' ? '#34C759' : '#C7C7CC', fontSize: 10 }}>
              {msg.status === 'sent' ? '✓' : '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Conversation panel (live via Supabase Realtime)
// ---------------------------------------------------------------------------

function ConversationPanel({ contactId, onProfile }: { contactId: string; onProfile: () => void }) {
  const [data,    setData]    = useState<ConvData | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef             = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${contactId}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [contactId])

  useEffect(() => {
    setLoading(true); setData(null)
    load()
    const ch = supabaseBrowser
      .channel(`conv-${contactId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, load)
      .subscribe()
    return () => { supabaseBrowser.removeChannel(ch) }
  }, [contactId, load])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages?.length, loading])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return null

  const { contact, messages, lead } = data
  const name = displayName(contact, lead)

  type DateGroup = { date: string; msgs: Message[] }
  const groups = messages.reduce<DateGroup[]>((acc, m) => {
    const d = dateStr(m.sent_at)
    const last = acc[acc.length - 1]
    if (last?.date === d) last.msgs.push(m)
    else acc.push({ date: d, msgs: [m] })
    return acc
  }, [])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/[0.05] bg-white flex items-center gap-3 shrink-0">
        <button onClick={onProfile} className="flex items-center gap-3 hover:opacity-75 flex-1 min-w-0">
          <Avatar name={name} phone={contact.phone} size={36} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[#1C1C1E] font-bold text-sm truncate">{name}</p>
            <p className="text-[#8E8E93] text-[11px] font-mono">{contact.phone}</p>
          </div>
        </button>
        {lead && (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0"
            style={{ background: STATUS_META[lead.status]?.bg, color: STATUS_META[lead.status]?.color }}>
            {STATUS_META[lead.status]?.label}
          </span>
        )}
        <button onClick={onProfile} title="View profile"
          className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center hover:bg-[#E5E5EA]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: 'linear-gradient(180deg,#F0FFF420 0%,#F2F2F7 100%)' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#C7C7CC] text-sm">No messages yet</div>
        ) : (
          groups.map(g => (
            <div key={g.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] font-medium text-[#8E8E93] bg-black/[0.05] px-3 py-1 rounded-full">{g.date}</span>
              </div>
              {g.msgs.map(m => <ChatBubble key={m.id} msg={m} />)}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contact list item
// ---------------------------------------------------------------------------

function ContactItem({ contact, lead, active, onClick }: {
  contact: Contact; lead: Lead | null; active: boolean; onClick: () => void
}) {
  const name = displayName(contact, lead)
  const sm   = lead ? STATUS_META[lead.status] : null

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-black/[0.04]"
      style={{ background: active ? `${avatarColor(contact.phone)}12` : 'transparent' }}>
      <Avatar name={name} phone={contact.phone} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <p className="text-[#1C1C1E] font-bold text-sm truncate">{name}</p>
          {lead && <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: sm?.bg, color: sm?.color }}>{sm?.label}</span>}
        </div>
        <p className="text-[#8E8E93] text-[11px] font-mono mt-0.5 truncate">{contact.phone}</p>
        <p className="text-[#C7C7CC] text-[11px] mt-0.5 truncate">
          {lead
            ? [lead.full_name, lead.product_service ?? lead.car_make, lead.asking_price ?? lead.budget].filter(Boolean).join(' · ')
            : 'No form submitted'}
        </p>
      </div>
      {lead && (
        <p className="text-[#C7C7CC] text-[10px] shrink-0 ml-1">
          {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const [contacts,    setContacts]    = useState<Contact[]>([])
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [selected,    setSelected]    = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<'all'|'new'|'contacted'|'closed'>('all')

  const load = useCallback(async () => {
    const [cRes, lRes] = await Promise.all([fetch('/api/contacts'), fetch('/api/leads')])
    const [cs, ls] = await Promise.all([cRes.json(), lRes.json()])
    setContacts(Array.isArray(cs) ? cs : [])
    setLeads(Array.isArray(ls) ? ls : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateLeadStatus(id: string, status: string) {
    await fetch('/api/leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const pairs = contacts.map(c => ({ contact: c, lead: leads.find(l => l.phone === c.phone) ?? null }))
  const counts = {
    all: pairs.length,
    new: pairs.filter(p => p.lead?.status === 'new').length,
    contacted: pairs.filter(p => p.lead?.status === 'contacted').length,
    closed: pairs.filter(p => p.lead?.status === 'closed').length,
  }
  const filtered = filter === 'all' ? pairs : pairs.filter(p => p.lead?.status === filter)
  const selContact = contacts.find(c => c.id === selected) ?? null
  const selLead    = selContact ? leads.find(l => l.phone === selContact.phone) ?? null : null

  return (
    <div className="flex rounded-3xl overflow-hidden"
      style={{ height: 'calc(100vh - 80px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

      {/* Left — contacts */}
      <div className="w-72 xl:w-80 shrink-0 border-r border-black/[0.06] bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-black/[0.05]">
          <h1 className="text-[#1C1C1E] font-black">Leads & Conversations</h1>
          <p className="text-[#8E8E93] text-xs mt-0.5">{counts.all} contacts</p>
        </div>

        <div className="flex gap-1 px-2 py-2 border-b border-black/[0.04]">
          {(['all','new','contacted','closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 text-[10px] font-bold py-1.5 rounded-xl transition-all capitalize"
              style={filter === f
                ? { background: STATUS_META[f]?.bg ?? '#007AFF12', color: STATUS_META[f]?.color ?? '#007AFF' }
                : { color: '#8E8E93' }}>
              {f === 'all' ? `All` : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-0.5 opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-11 h-11 rounded-full bg-[#F2F2F7] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#F2F2F7] rounded-full animate-pulse w-3/4" />
                    <div className="h-2 bg-[#F2F2F7] rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-[#1C1C1E] font-semibold text-sm">No contacts yet</p>
              <p className="text-[#8E8E93] text-xs mt-1">Start blasting to see conversations here</p>
            </div>
          ) : (
            filtered.map(({ contact, lead }) => (
              <ContactItem key={contact.id} contact={contact} lead={lead}
                active={selected === contact.id}
                onClick={() => { setSelected(contact.id); setShowProfile(false) }} />
            ))
          )}
        </div>
      </div>

      {/* Right — conversation */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F2F2F7]">
        {selected ? (
          <ConversationPanel key={selected} contactId={selected} onProfile={() => setShowProfile(true)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-[#1C1C1E] font-bold">Select a contact</p>
            <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Pick someone from the list to view their full conversation in real time</p>
          </div>
        )}
      </div>

      {/* Profile drawer */}
      {showProfile && selContact && (
        <LeadProfileDrawer contact={selContact} lead={selLead}
          onClose={() => setShowProfile(false)} onStatusChange={updateLeadStatus} />
      )}
    </div>
  )
}
