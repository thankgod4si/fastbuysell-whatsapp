'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Lead {
  id: string; phone: string; full_name: string | null; email: string | null
  phone_number: string | null; company: string | null; product_service: string | null
  budget: string | null; location: string | null; timeline: string | null
  car_make: string | null; car_model: string | null; car_year: string | null
  asking_price: string | null; condition: string | null; mileage: string | null
  previous_owners: string | null; notes: string | null
  response_data: Record<string, string> | null; status: string; created_at: string
}
interface Contact {
  id: string; phone: string; wa_name: string | null; name: string | null
  status: string; created_at: string
}
interface Message {
  id: string; direction: 'outbound' | 'inbound'; content: string | null
  msg_type: string; status: string; sent_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: 'New',       color: '#007AFF', bg: '#007AFF12' },
  contacted: { label: 'Contacted', color: '#FF9500', bg: '#FF950012' },
  closed:    { label: 'Closed',    color: '#34C759', bg: '#34C75912' },
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
function displayName(c: Contact, l: Lead | null) { return l?.full_name ?? c.wa_name ?? c.name ?? c.phone }
function timeStr(iso: string) { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
function dateStr(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Avatar({ contact, lead, size = 40 }: { contact: Contact; lead: Lead | null; size?: number }) {
  const name = lead?.full_name ?? contact.wa_name ?? contact.name ?? null
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: avatarColor(contact.phone), fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  )
}

// ── Copyable field row ────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <div className="group flex items-start justify-between gap-3 px-4 py-3 border-b border-[#F2F2F7] last:border-0">
      <span className="text-[11px] text-[#8E8E93] shrink-0 mt-0.5 w-24">{label}</span>
      <div className="flex items-start gap-1 flex-1 min-w-0">
        <span className="text-sm font-semibold text-[#1C1C1E] break-words flex-1">{value}</span>
        <button onClick={copy}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: copied ? '#34C75920' : '#F2F2F7', color: copied ? '#34C759' : '#8E8E93' }}>
          {copied ? '✓' : 'copy'}
        </button>
      </div>
    </div>
  )
}

// ── Lead details panel (always visible) ──────────────────────────────────────
function LeadPanel({ contact, lead, onStatusChange }: {
  contact: Contact; lead: Lead | null; onStatusChange: (id: string, s: string) => void
}) {
  const name = displayName(contact, lead)

  const fields: { label: string; value: string }[] = []
  if (lead) {
    if (lead.full_name)       fields.push({ label: 'Full Name',     value: lead.full_name })
    if (lead.email)           fields.push({ label: 'Email',         value: lead.email })
    if (lead.phone_number)    fields.push({ label: 'Phone',         value: lead.phone_number })
    if (lead.company)         fields.push({ label: 'Company',       value: lead.company })
    if (lead.product_service) fields.push({ label: 'Selling',       value: lead.product_service })
    if (lead.car_make) {
      const car = [lead.car_year, lead.car_make, lead.car_model].filter(Boolean).join(' ')
      fields.push({ label: 'Vehicle', value: car })
    }
    if (lead.asking_price)    fields.push({ label: 'Asking Price',  value: lead.asking_price })
    if (lead.mileage)         fields.push({ label: 'Mileage',       value: lead.mileage })
    if (lead.condition)       fields.push({ label: 'Condition',     value: lead.condition })
    if (lead.previous_owners) fields.push({ label: 'Prev. Owners',  value: lead.previous_owners })
    if (lead.budget)          fields.push({ label: 'Budget',        value: lead.budget })
    if (lead.location)        fields.push({ label: 'Location',      value: lead.location })
    if (lead.timeline)        fields.push({ label: 'Timeline',      value: lead.timeline })
    if (lead.notes)           fields.push({ label: 'Notes',         value: lead.notes })

    // Extra keys from response_data not already shown
    const knownKeys = ['full_name','email','phone_number','company','product_service','budget','location',
      'timeline','car_make','car_model','car_year','asking_price','condition','mileage',
      'previous_owners','notes','flow_db_id','user_id']
    if (lead.response_data) {
      for (const k of Object.keys(lead.response_data)) {
        if (!knownKeys.includes(k) && lead.response_data[k]) {
          fields.push({ label: k.replace(/_/g, ' '), value: String(lead.response_data[k]) })
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-[#F2F2F7] bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#F2F2F7] text-center"
        style={{ background: `linear-gradient(160deg,${avatarColor(contact.phone)}18,${avatarColor(contact.phone)}06)` }}>
        <Avatar contact={contact} lead={lead} size={56} />
        <h3 className="text-[#1C1C1E] font-black text-base mt-2 leading-tight">{name}</h3>
        <p className="text-[#8E8E93] text-xs font-mono mt-0.5">{contact.phone}</p>
        {lead && (
          <div className="flex gap-1.5 mt-3 justify-center">
            {(['new','contacted','closed'] as const).map(s => {
              const m = STATUS_META[s]
              return (
                <button key={s} onClick={() => onStatusChange(lead.id, s)}
                  className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all max-w-[72px]"
                  style={lead.status === s ? { background: m.color, color: 'white' } : { background: m.bg, color: m.color }}>
                  {m.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto">
        {fields.length > 0 ? (
          <>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest px-4 pt-3 pb-1">Form Details</p>
            <div className="bg-white">
              {fields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
            </div>
            <p className="text-[10px] text-[#C7C7CC] text-center py-3">
              Submitted {new Date(lead!.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
            <div className="w-10 h-10 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p className="text-[#8E8E93] text-sm font-semibold">No form yet</p>
            <p className="text-[#C7C7CC] text-xs mt-1">Waiting for seller to fill the form</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: Message }) {
  const out    = msg.direction === 'outbound'
  const isForm = msg.msg_type === 'form_submission'
  const label  = isForm ? msg.content ?? 'Form submitted'
    : !out ? msg.content ?? ''
    : msg.msg_type === 'template' ? '📨  Outreach sent'
    : msg.msg_type === 'flow' ? '📋  Form sent'
    : msg.content ?? ''

  return (
    <div className={`flex mb-1.5 ${out ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm"
          style={isForm ? { background: '#34C75910', border: '1px solid #34C75930' }
            : out ? { background: '#DCF8C6' }
            : { background: 'white', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ color: isForm ? '#34C759' : '#1C1C1E' }}>{isForm && '✅ '}{label}</p>
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

// ── Conversation panel ────────────────────────────────────────────────────────
function ConversationPanel({ contactId }: { contactId: string }) {
  const [msgs,    setMsgs]    = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reply,   setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${contactId}`)
    if (res.ok) { const d = await res.json(); setMsgs(d.messages ?? []) }
    setLoading(false)
  }, [contactId])

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
      {/* Messages */}
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

      {/* Reply input */}
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

// ── Contact list item ─────────────────────────────────────────────────────────
function ContactItem({ contact, lead, active, onClick }: {
  contact: Contact; lead: Lead | null; active: boolean; onClick: () => void
}) {
  const name = displayName(contact, lead)
  const sm   = lead ? STATUS_META[lead.status] : null
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-black/[0.04] transition-colors"
      style={{ background: active ? `${avatarColor(contact.phone)}12` : 'transparent' }}>
      <Avatar contact={contact} lead={lead} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[#1C1C1E] font-bold text-sm truncate">{name}</p>
          {lead && <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: sm?.bg, color: sm?.color }}>{sm?.label}</span>}
        </div>
        <p className="text-[#8E8E93] text-[11px] font-mono mt-0.5 truncate">{contact.phone}</p>
        <p className="text-[#C7C7CC] text-[11px] truncate mt-0.5">
          {lead
            ? [lead.full_name, lead.product_service ?? lead.car_make, lead.asking_price ?? lead.budget].filter(Boolean).join(' · ')
            : 'No form submitted'}
        </p>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all'|'new'|'contacted'|'closed'>('all')

  const load = useCallback(async () => {
    const [cRes, lRes] = await Promise.all([fetch('/api/contacts'), fetch('/api/leads')])
    const [cs, ls]     = await Promise.all([cRes.json(), lRes.json()])
    setContacts(Array.isArray(cs) ? cs : [])
    setLeads(Array.isArray(ls) ? ls : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateLeadStatus(id: string, status: string) {
    await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const pairs = contacts.map(c => ({ contact: c, lead: leads.find(l => l.phone === c.phone) ?? null }))
  const counts = {
    all:       pairs.length,
    new:       pairs.filter(p => p.lead?.status === 'new').length,
    contacted: pairs.filter(p => p.lead?.status === 'contacted').length,
    closed:    pairs.filter(p => p.lead?.status === 'closed').length,
  }
  const filtered   = filter === 'all' ? pairs : pairs.filter(p => p.lead?.status === filter)
  const selContact = contacts.find(c => c.id === selected) ?? null
  const selLead    = selContact ? leads.find(l => l.phone === selContact.phone) ?? null : null

  return (
    <div className="flex rounded-3xl overflow-hidden" style={{ height: 'calc(100vh - 4rem)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

      {/* ── Left: contact list ── */}
      <div className="w-64 xl:w-72 shrink-0 border-r border-black/[0.06] bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-black/[0.05]">
          <h1 className="text-[#1C1C1E] font-black text-sm">Leads & Conversations</h1>
          <p className="text-[#8E8E93] text-xs mt-0.5">{counts.all} contacts</p>
        </div>

        <div className="flex gap-0.5 px-2 py-2 border-b border-black/[0.04]">
          {(['all','new','contacted','closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 text-[10px] font-bold py-1.5 rounded-xl transition-all"
              style={filter === f
                ? { background: STATUS_META[f]?.bg ?? '#007AFF12', color: STATUS_META[f]?.color ?? '#007AFF' }
                : { color: '#8E8E93' }}>
              {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
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
              <p className="text-[#8E8E93] text-xs mt-1">Start blasting to see leads here</p>
            </div>
          ) : filtered.map(({ contact, lead }) => (
            <ContactItem key={contact.id} contact={contact} lead={lead}
              active={selected === contact.id}
              onClick={() => setSelected(contact.id)} />
          ))}
        </div>
      </div>

      {selected && selContact ? (
        <>
          {/* ── Middle: chat ── */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-black/[0.06]">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.05] bg-white shrink-0">
              <Avatar contact={selContact} lead={selLead} size={34} />
              <div className="flex-1 min-w-0">
                <p className="text-[#1C1C1E] font-bold text-sm truncate">{displayName(selContact, selLead)}</p>
                <p className="text-[#8E8E93] text-[11px] font-mono">{selContact.phone}</p>
              </div>
              {selLead && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0"
                  style={{ background: STATUS_META[selLead.status]?.bg, color: STATUS_META[selLead.status]?.color }}>
                  {STATUS_META[selLead.status]?.label}
                </span>
              )}
            </div>
            <ConversationPanel key={selected} contactId={selected} />
          </div>

          {/* ── Right: lead details (always visible) ── */}
          <div className="w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden">
            <LeadPanel contact={selContact} lead={selLead} onStatusChange={updateLeadStatus} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#F2F2F7]">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <p className="text-[#1C1C1E] font-bold">Select a contact</p>
          <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Chat and lead details appear side by side</p>
        </div>
      )}
    </div>
  )
}
