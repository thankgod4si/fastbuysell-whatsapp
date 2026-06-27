'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Contact, Lead } from '@/types'

export const dynamic = 'force-dynamic'

interface Message {
  id: string; direction: 'outbound' | 'inbound'; content: string | null
  msg_type: string; status: string; sent_at: string
  isAI?: boolean
  bookingStatus?: 'pending' | 'confirmed' | 'completed'
}

type ToastItem = { id: number; msg: string; ok: boolean }

function generateMockBookingConversation(contactId: string): Message[] {
  const now = new Date()
  const baseTime = now.getTime()
  
  // Nails business conversation flow
  return [
    {
      id: '1',
      direction: 'inbound',
      content: "Hi",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 300000).toISOString()
    },
    {
      id: '2',
      direction: 'outbound',
      content: "👋 Hi, welcome to Pressed by VPH.\n\nI'd love to create your custom press-on nails 💅\n\nChoose an option:\n\n1️⃣ Shop Ready-Made Sets\n2️⃣ Create My Custom Set\n3️⃣ How to Measure My Nails\n4️⃣ Delivery & Pricing\n5️⃣ Speak to a Nail Artist",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 240000).toISOString(),
      isAI: true
    },
    {
      id: '3',
      direction: 'inbound',
      content: "2",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 180000).toISOString()
    },
    {
      id: '4',
      direction: 'outbound',
      content: "✨ Let's create your dream nails.\n\n📌 Upload your inspiration picture.\n\n📌 What length?\n• Short\n• Medium\n• Long\n• XL\n\n📌 What's the occasion?\nBirthday\nWedding\nVacation\nEveryday\n\n📌 Preferred colour?\n\n📌 Your delivery state?",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 120000).toISOString(),
      isAI: true
    },
    {
      id: '5',
      direction: 'inbound',
      content: "Medium length, wedding, nude colour, Lagos",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 60000).toISOString()
    },
    {
      id: '6',
      direction: 'outbound',
      content: "Perfect!\n\nWe'll prepare your quote.\n\nAverage price:\n₦18,000-₦30,000 depending on design.\n\nContinue to payment?",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 30000).toISOString(),
      isAI: true
    },
    {
      id: '7',
      direction: 'inbound',
      content: "Yes",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 15000).toISOString()
    },
    {
      id: '8',
      direction: 'outbound',
      content: "Order Summary\n\nDesign: Custom Medium Nude\nLength: Medium\nColour: Nude\n\nTotal: ₦24,000\n\nPay here 👇\n[Payment Link]",
      msg_type: 'text',
      status: 'read',
      sent_at: new Date(baseTime - 5000).toISOString(),
      isAI: true,
      bookingStatus: 'pending'
    }
  ]
}

function parseNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;\s]+/)
    .map(p => p.trim().replace(/^00/, '+'))
    .filter(p => p.match(/^\+?[0-9]{7,15}$/))
    .map(p => p.startsWith('+') ? p : '+' + p)
    .filter((p, i, arr) => arr.indexOf(p) === i)
}

// ── Avatar helpers ────────────────────────────────────────────────────────
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
function displayName(c: Contact) { return c.wa_name ?? c.name ?? c.phone }

function Avatar({ contact, size = 40 }: { contact: Contact; size?: number }) {
  const bg = avatarColor(contact.phone)
  const name = contact.wa_name ?? contact.name ?? null
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  )
}

// ── Profile Modal ─────────────────────────────────────────────────────────
function ProfileModal({ contact, lead, onClose }: { contact: Contact; lead: Lead | null; onClose: () => void }) {
  const color = avatarColor(contact.phone)
  const name = displayName(contact)

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'Queued',    color: '#FF9500', bg: '#FF950015' },
    sent:        { label: 'Delivered', color: '#007AFF', bg: '#007AFF15' },
    replied:     { label: 'Replied',   color: '#34C759', bg: '#34C75915' },
    blacklisted: { label: 'Opted out', color: '#8E8E93', bg: '#8E8E9315' },
  }
  const sm = statusMap[contact.status] ?? statusMap.pending

  // Build lead info rows — only show fields that have values
  const leadRows: { label: string; value: string }[] = []
  if (lead) {
    if (lead.full_name)       leadRows.push({ label: 'Name',         value: lead.full_name })
    if (lead.email)           leadRows.push({ label: 'Email',        value: lead.email })
    if (lead.phone_number)    leadRows.push({ label: 'Alt Phone',    value: lead.phone_number })
    if (lead.company)         leadRows.push({ label: 'Company',      value: lead.company })
    if (lead.product_service) leadRows.push({ label: 'Selling',      value: lead.product_service })
    if (lead.budget)          leadRows.push({ label: 'Budget',       value: lead.budget })
    if (lead.location)        leadRows.push({ label: 'Location',     value: lead.location })
    if (lead.timeline)        leadRows.push({ label: 'Timeline',     value: lead.timeline })
    if (lead.car_make) {
      const car = [lead.car_year, lead.car_make, lead.car_model].filter(Boolean).join(' ')
      leadRows.push({ label: 'Vehicle', value: car })
    }
    if (lead.asking_price)    leadRows.push({ label: 'Asking Price', value: lead.asking_price })
    if (lead.mileage)         leadRows.push({ label: 'Mileage',      value: lead.mileage })
    if (lead.condition)       leadRows.push({ label: 'Condition',    value: lead.condition })
    if (lead.previous_owners) leadRows.push({ label: 'Prev. Owners', value: lead.previous_owners })
    if (lead.notes)           leadRows.push({ label: 'Notes',        value: lead.notes })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'white', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center flex-shrink-0"
          style={{ background: `linear-gradient(160deg, ${color}28 0%, ${color}08 100%)` }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:bg-black/[0.08] transition-colors text-lg"
            style={{ background: 'rgba(0,0,0,0.06)' }}>
            ×
          </button>

          <div className="flex justify-center mb-3">
            <Avatar contact={contact} size={80} />
          </div>

          <h2 className="text-[#1C1C1E] font-black text-xl leading-tight">{name}</h2>
          {lead?.full_name && lead.full_name !== name && (
            <p className="text-[#8E8E93] text-sm mt-0.5">{lead.full_name}</p>
          )}
          <p className="text-[#8E8E93] text-sm font-mono mt-1">{contact.phone}</p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: sm.bg, color: sm.color }}>
              {sm.label}
            </span>
            {lead && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#34C75915', color: '#34C759' }}>
                Form submitted
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Contact info */}
          <div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2 px-1">Contact</p>
            <div className="rounded-2xl overflow-hidden border border-[#F2F2F7]">
              {[
                { label: 'WhatsApp', value: contact.wa_name ?? '—' },
                { label: 'Phone',    value: contact.phone },
                { label: 'Added',    value: new Date(contact.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
              ].map((row, i, arr) => (
                <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}>
                  <span className="text-xs text-[#8E8E93]">{row.label}</span>
                  <span className="text-xs font-semibold text-[#1C1C1E] text-right max-w-[60%] truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead / form data */}
          {leadRows.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2 px-1">Form Details</p>
              <div className="rounded-2xl overflow-hidden border border-[#F2F2F7]">
                {leadRows.map((row, i) => (
                  <div key={row.label} className={`flex items-start justify-between px-4 py-3 gap-3 ${i < leadRows.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}>
                    <span className="text-xs text-[#8E8E93] shrink-0">{row.label}</span>
                    <span className="text-xs font-semibold text-[#1C1C1E] text-right break-words max-w-[65%]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!lead && (
            <div className="rounded-2xl bg-[#F2F2F7] px-4 py-4 text-center">
              <p className="text-xs text-[#8E8E93]">No form submitted yet</p>
              <p className="text-[11px] text-[#C7C7CC] mt-0.5">Seller hasn&apos;t tapped &quot;Interested&quot; or filled the form</p>
            </div>
          )}

          <div className="pb-2" />
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: Contact['status'] }) {
  const colors: Record<string, string> = { pending: '#FF9500', sent: '#007AFF', replied: '#34C759', blacklisted: '#8E8E93' }
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[status] ?? '#8E8E93' }} />
}

function DeliveryTick({ status }: { status: string }) {
  if (status === 'replied') return <span className="text-[11px] font-bold text-[#34C759]">✓✓</span>
  if (status === 'sent') return <span className="text-[11px] text-[#8E8E93]">✓✓</span>
  if (status === 'pending') return <span className="text-[11px] text-[#C7C7CC]">🕐</span>
  return null
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ContactsPage() {
  const [contacts,    setContacts]    = useState<Contact[]>([])
  const [selected,    setSelected]    = useState<Contact | null>(null)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [activeLead,  setActiveLead]  = useState<Lead | null>(null)
  const [raw,         setRaw]         = useState('')
  const [saving,      setSaving]      = useState(false)
  const [sendingId,   setSendingId]   = useState<string | null>(null)
  const [toasts,      setToasts]      = useState<ToastItem[]>([])
  const [testPhone,   setTestPhone]   = useState('')
  const [testing,     setTesting]     = useState(false)
  const [showAdd,     setShowAdd]     = useState(false)
  const [searchQ,     setSearchQ]     = useState('')
  const [reply,       setReply]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectMode,  setSelectMode]  = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const bottomRef                     = useRef<HTMLDivElement>(null)

  const detected = parseNumbers(raw)

  const load = useCallback(async () => {
    const res = await fetch('/api/contacts')
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { load() }, [load])

  const loadMessages = useCallback(async (contactId: string) => {
    const res = await fetch(`/api/conversations/${contactId}`)
    if (res.ok) {
      const data = await res.json()
      // If no messages, add mock AI booking conversation
      if (!data.messages || data.messages.length === 0) {
        const mockMessages = generateMockBookingConversation(contactId)
        setMessages(mockMessages)
      } else {
        setMessages(data.messages ?? [])
      }
      setActiveLead(data.lead ?? null)
    }
  }, [])

  useEffect(() => {
    if (!selected) { setMessages([]); setActiveLead(null); return }
    loadMessages(selected.id)
    const ch = supabaseBrowser
      .channel(`contacts-conv-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, () => loadMessages(selected.id))
      .subscribe()
    return () => { supabaseBrowser.removeChannel(ch) }
  }, [selected, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function notify(msg: string, ok = true) {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  async function saveToQueue() {
    if (!detected.length) return
    setSaving(true)
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: detected.map(p => ({ phone: p })) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { notify(data.error, false); return }
    notify(`${data.added} number${data.added !== 1 ? 's' : ''} added`)
    setRaw(''); setShowAdd(false)
    load()
  }

  async function sendOne(contact: Contact) {
    setSendingId(contact.id)
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id }),
    })
    const data = await res.json()
    setSendingId(null)
    if (!res.ok) notify(data.error || 'Send failed', false)
    else { notify('Message sent!'); load() }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    if (!selectedIds.size) return
    const ids = [...selectedIds]
    const res = await fetch('/api/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const data = await res.json()
    if (!res.ok) { notify(data.error || 'Delete failed', false); return }
    notify(`${data.deleted} contact${data.deleted !== 1 ? 's' : ''} deleted`)
    if (selected && ids.includes(selected.id)) setSelected(null)
    setSelectedIds(new Set())
    setSelectMode(false)
    load()
  }

  async function sendReply(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!selected || !reply.trim()) return
    setSending(true)
    const res = await fetch('/api/send/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: selected.id, message: reply.trim() }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) notify(data.error || 'Send failed', false)
    else { setReply(''); loadMessages(selected.id) }
  }

  const sendTest = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    setTesting(true)
    const res = await fetch('/api/send/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: testPhone }) })
    const data = await res.json()
    setTesting(false)
    if (!res.ok) notify(data.error, false)
    else notify('Test sent! Check WhatsApp ✓')
  }

  const filtered = contacts.filter(c => !searchQ || c.phone.includes(searchQ) || (c.wa_name ?? '').toLowerCase().includes(searchQ.toLowerCase()))

  const stats = {
    pending: contacts.filter(c => c.status === 'pending').length,
    sent: contacts.filter(c => c.status === 'sent').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }

  function bubbleLabel(m: Message) {
    if (m.msg_type === 'form_submission') return m.content ?? 'Form submitted'
    if (m.direction === 'inbound') return m.content ?? ''
    if (m.msg_type === 'template') return m.content ?? '📨  Outreach message sent'
    if (m.msg_type === 'flow') return '📋  Flow form sent'
    return m.content ?? ''
  }

  function isAIMessage(m: Message) {
    return m.isAI === true && m.direction === 'outbound'
  }

  return (
    <div className="flex flex-col" style={{ position: 'fixed', top: 0, left: 'var(--sb-w, 16rem)', right: 0, bottom: 0, zIndex: 10 }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#25D36618' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[#1C1C1E] font-bold text-sm">AI Booking Assistant</h1>
              <p className="text-[#8E8E93] text-[11px]">{contacts.length} conversations</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            {[{l:'Queue',v:stats.pending,c:'#FF9500'},{l:'Sent',v:stats.sent,c:'#007AFF'},{l:'Replied',v:stats.replied,c:'#34C759'}].map(s=>(
              <div key={s.l} className="rounded-xl px-3 py-1.5 text-center" style={{background:`${s.c}12`}}>
                <span className="font-black text-base tabular-nums" style={{color:s.c}}>{s.v}</span>
                <span className="ml-1.5 font-medium" style={{color:s.c}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={sendTest} className="flex gap-2">
            <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="Test: +49…" className="bg-[#F2F2F7] rounded-xl px-3 py-2 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] border-0 outline-none w-44"/>
            <button type="submit" disabled={testing||!testPhone.trim()} className="text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-40" style={{background:'#007AFF18',color:'#007AFF'}}>{testing?'…':'Test'}</button>
          </form>
          {selectMode ? (
            <>
              <button onClick={() => setSelectedIds(new Set(filtered.map(c => c.id)))} className="text-xs font-semibold px-3 py-2 rounded-xl" style={{background:'#007AFF12',color:'#007AFF'}}>
                All
              </button>
              <button onClick={deleteSelected} disabled={!selectedIds.size} className="text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 transition-all" style={{background:'#FF3B3015',color:'#FF3B30'}}>
                Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
              <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{background:'#F2F2F7',color:'#1C1C1E'}}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={()=>setSelectMode(true)} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{background:'#F2F2F7',color:'#1C1C1E'}}>
                Select
              </button>
              <button onClick={()=>setShowAdd(v=>!v)} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all" style={{background:'#25D366',color:'white',boxShadow:'0 2px 8px rgba(37,211,102,0.4)'}}>
                <span>+</span> Add Numbers
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contact list */}
        <div className="w-80 border-r border-black/[0.06] flex flex-col" style={{background:'rgba(255,255,255,0.7)'}}>
          <div className="px-3 py-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2 bg-[#F2F2F7] rounded-xl px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search…" className="bg-transparent text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none flex-1 min-w-0"/>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                <span className="text-4xl mb-3">📱</span>
                <p className="text-[#1C1C1E] font-semibold text-sm">No contacts yet</p>
                <p className="text-[#8E8E93] text-xs mt-1">Add numbers using the button above</p>
              </div>
            ) : filtered.map(c => (
              <button key={c.id} onClick={()=>{ if (selectMode) { toggleSelect(c.id); return } setSelected(c); setShowProfile(false) }} className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] transition-colors ${!selectMode && selected?.id===c.id?'bg-[#25D366]/8':'hover:bg-black/[0.02]'}`}>
                {selectMode && (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedIds.has(c.id)?'bg-[#FF3B30] border-[#FF3B30]':'border-[#C7C7CC]'}`}>
                    {selectedIds.has(c.id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </div>
                )}
                <Avatar contact={c} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#1C1C1E] text-sm font-semibold truncate">{displayName(c)}</p>
                    <p className="text-[#8E8E93] text-[10px] shrink-0">{formatTime(c.sent_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <DeliveryTick status={c.status} />
                    <p className="text-[#8E8E93] text-xs truncate font-mono">{c.phone}</p>
                  </div>
                </div>
                <StatusDot status={c.status} />
              </button>
            ))}
          </div>
        </div>

        {/* Chat view / Add panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{background:'#ECE5DD'}}>
          {showAdd ? (
            <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm max-w-lg mx-auto w-full">
                <h2 className="text-[#1C1C1E] font-bold text-lg mb-1">Add Numbers to Queue</h2>
                <p className="text-[#8E8E93] text-sm mb-4">Paste any format — one per line, comma, or space separated. International format preferred (+49…)</p>
                <textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={8} placeholder={`+49 171 234 5678\n+49 172 345 6789\n+4915123456789`} className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm font-mono text-[#1C1C1E] placeholder-[#C7C7CC] outline-none resize-none leading-relaxed" />
                {detected.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {detected.slice(0,20).map(p=>(
                      <span key={p} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-[#34C759]/10 text-[#34C759]">{p}</span>
                    ))}
                    {detected.length>20&&<span className="text-xs text-[#8E8E93]">+{detected.length-20} more</span>}
                  </div>
                )}
                <div className="flex gap-3 mt-4">
                  <button onClick={()=>{setRaw('');setShowAdd(false)}} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#F2F2F7] text-[#1C1C1E]">Cancel</button>
                  <button onClick={saveToQueue} disabled={saving||detected.length===0} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-colors disabled:opacity-40" style={{background:'#25D366',boxShadow:'0 4px 12px rgba(37,211,102,0.4)'}}>
                    {saving?'Saving…':`Save ${detected.length} Number${detected.length!==1?'s':''}`}
                  </button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <>
              {/* Chat header — click to open profile */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08]" style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)'}}>
                <button onClick={()=>setShowProfile(true)} className="flex items-center gap-3 hover:opacity-75 flex-1 min-w-0 text-left transition-opacity">
                  <Avatar contact={selected} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1C1C1E] font-bold text-sm truncate">{displayName(selected)}</p>
                    <p className="text-[#8E8E93] text-[11px] font-mono">{selected.phone}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl capitalize"
                    style={selected.status==='replied'?{background:'#34C75912',color:'#34C759'}:selected.status==='sent'?{background:'#007AFF12',color:'#007AFF'}:{background:'#FF950012',color:'#FF9500'}}>
                    {selected.status==='replied'?'Replied':selected.status==='sent'?'Delivered':selected.status==='pending'?'Queued':'Opted out'}
                  </span>
                  {selected.status === 'pending' && (
                    <button onClick={()=>sendOne(selected)} disabled={sendingId===selected.id} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50" style={{background:'#25D366',boxShadow:'0 2px 6px rgba(37,211,102,0.4)'}}>
                      {sendingId===selected.id?'Sending…':'Send Now'}
                    </button>
                  )}
                  {/* Profile button */}
                  <button onClick={()=>setShowProfile(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/[0.06] transition-colors"
                    title="View profile">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages area — flex-col + justify-end keeps messages pinned to bottom */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="min-h-full flex flex-col justify-end">
                {messages.length === 0 ? (
                  <div className="flex justify-center pt-8">
                    <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">
                      {selected.status === 'pending' ? '⏳ Ready to send — cron fires automatically' : 'No messages yet'}
                    </span>
                  </div>
                ) : messages.map(m => {
                  const out = m.direction === 'outbound'
                  const isForm = m.msg_type === 'form_submission'
                  const ai = isAIMessage(m)
                  return (
                    <div key={m.id} className={`flex mb-2 ${out ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[72%]">
                        <div className="relative">
                          {ai && (
                            <div className="absolute -top-2 left-0 bg-[#007AFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              </svg>
                              AI
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${ai ? 'mt-4' : ''}`}
                            style={
                              isForm ? { background: '#34C75910', border: '1px solid #34C75930' } :
                              out ? { background: ai ? '#007AFF' : '#DCF8C6', color: ai ? 'white' : '#1C1C1E' } :
                              { background: 'white', border: '1px solid rgba(0,0,0,0.06)' }
                            }>
                            <p style={{ color: isForm ? '#34C759' : (ai ? 'white' : '#1C1C1E') }} className="whitespace-pre-wrap">
                              {isForm && '✅ '}{bubbleLabel(m)}
                            </p>
                          </div>
                        </div>
                        {m.bookingStatus === 'confirmed' && (
                          <div className="mt-1 flex items-center gap-1 px-1">
                            <span className="text-[10px] font-semibold text-[#34C759]">✓ Booking Confirmed</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${out ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-[#667781]">
                            {new Date(m.sent_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}
                          </span>
                          {out && <span style={{color: m.status==='read'?'#34C759':'#C7C7CC',fontSize:10}}>
                            {m.status==='sent'?'✓':'✓✓'}
                          </span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
                </div>
              </div>

              {/* Reply input */}
              {selected.status !== 'blacklisted' && (
                <form onSubmit={sendReply} className="flex items-end gap-2 px-3 py-3 border-t border-black/[0.06]" style={{background:'rgba(255,255,255,0.95)'}}>
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 bg-[#F2F2F7] rounded-2xl px-4 py-2.5 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none"
                  />
                  <button type="submit" disabled={sending || !reply.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                    style={{background:'#25D366'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{background:'rgba(37,211,102,0.12)'}}>💬</div>
              <div>
                <p className="text-[#1C1C1E] font-bold text-lg">WhatsApp Outreach</p>
                <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Select a contact to view their conversation, or add new numbers to start outreach.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className={`px-4 py-3 rounded-2xl text-sm font-semibold shadow-lg backdrop-blur-xl border ${t.ok?'bg-white/90 border-[#34C759]/30 text-[#34C759]':'bg-white/90 border-[#FF3B30]/30 text-[#FF3B30]'}`}>
            {t.ok?'✓':'✕'} {t.msg}
          </div>
        ))}
      </div>

      {/* Profile modal */}
      {showProfile && selected && (
        <ProfileModal
          contact={selected}
          lead={activeLead}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}
