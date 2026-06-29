'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Contact, Lead } from '@/types'

export const dynamic = 'force-dynamic'

interface Message {
  id: string; direction: 'outbound' | 'inbound'; content: string | null
  msg_type: string; status: string; sent_at: string
  isAI?: boolean
  media_url?: string | null
  media_type?: string | null
  caption?: string | null
}

interface Conversation {
  id: string
  recipient: string
  channel: string
  content: string | null
  direction: string
  msg_type: string
  status: string
  sent_at: string
  contact_id: string | null
  contacts?: { id: string; wa_name: string | null; name: string | null; profile_picture_url: string | null } | null
}

type CRMTab = 'all' | 'new' | 'contacted' | 'closed'

// Avatar helpers
const PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#F7DC6F','#BB8FCE','#FF8C94','#52C9A0','#FFB347','#87CEEB']
function avatarColor(seed: string) {
  let h = 0; for (const c of seed) h = ((h << 5) - h) + c.charCodeAt(0)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(name: string | null) {
  if (!name) return '??'
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase()
}
function displayName(contact: { wa_name: string | null; name: string | null; recipient?: string }) {
  return contact.wa_name ?? contact.name ?? contact.recipient ?? 'Unknown'
}

function displayNameFromConversation(c: Conversation) {
  return c.contacts?.wa_name ?? c.contacts?.name ?? c.recipient ?? 'Unknown'
}

function Avatar({ name, phone, profilePictureUrl, size = 40 }: { name: string | null; phone: string | null | undefined; profilePictureUrl?: string | null; size?: number }) {
  if (profilePictureUrl) {
    return (
      <img 
        src={profilePictureUrl} 
        alt={name ?? 'Avatar'} 
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback to colored avatar if image fails to load
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }
  const bg = avatarColor(phone ?? 'unknown')
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  )
}

function ChannelLogo({ channel, size = 16 }: { channel: string; size?: number }) {
  if (channel === 'whatsapp') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  )
  if (channel === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="ig2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig2)"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
    </svg>
  )
  if (channel === 'facebook' || channel === 'social') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/>
    </svg>
  )
  if (channel === 'sms') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#AF52DE" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <path d="M22 6 12 13 2 6"/>
    </svg>
  )
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Right Context Panel
function ContextPanel({ contact, lead }: { contact: Contact | null; lead: Lead | null }) {
  if (!contact) {
    return (
      <div className="w-80 border-l border-black/[0.06] flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
          <h3 className="text-sm font-bold text-[#1C1C1E]">Details</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div>
            <p className="text-[#8E8E93] text-sm">Select a conversation</p>
            <p className="text-[#C7C7CC] text-xs mt-1">to view details</p>
          </div>
        </div>
      </div>
    )
  }

  const color = avatarColor(contact.phone ?? 'unknown')
  const name = displayName(contact)

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'Queued',    color: '#FF9500', bg: '#FF950015' },
    sent:        { label: 'Delivered', color: '#007AFF', bg: '#007AFF15' },
    replied:     { label: 'Replied',   color: '#34C759', bg: '#34C75915' },
    blacklisted: { label: 'Opted out', color: '#8E8E93', bg: '#8E8E9315' },
  }
  const sm = statusMap[contact.status] ?? statusMap.pending

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
    <div className="w-80 border-l border-black/[0.06] flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
        <h3 className="text-sm font-bold text-[#1C1C1E]">Details</h3>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <div className="px-4 py-5 text-center" style={{ background: `linear-gradient(160deg, ${color}28 0%, ${color}08 100%)` }}>
          <div className="flex justify-center mb-3">
            <Avatar name={contact.wa_name ?? contact.name} phone={contact.phone} profilePictureUrl={contact.profile_picture_url} size={64} />
          </div>
          <h2 className="text-[#1C1C1E] font-black text-lg leading-tight">{name}</h2>
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

        <div className="px-4 py-4">
          <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">Contact</p>
          <div className="rounded-2xl overflow-hidden border border-[#F2F2F7]">
            {[
              { label: 'WhatsApp', value: contact.wa_name ?? '—' },
              { label: 'Phone',    value: contact.phone ?? '—' },
              { label: 'Added',    value: new Date(contact.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}>
                <span className="text-xs text-[#8E8E93]">{row.label}</span>
                <span className="text-xs font-semibold text-[#1C1C1E] text-right max-w-[60%] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {leadRows.length > 0 ? (
          <div className="px-4 py-4">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">Form Details</p>
            <div className="rounded-2xl overflow-hidden border border-[#F2F2F7]">
              {leadRows.map((row, i) => (
                <div key={row.label} className={`flex items-start justify-between px-4 py-3 gap-3 ${i < leadRows.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}>
                  <span className="text-xs text-[#8E8E93] shrink-0">{row.label}</span>
                  <span className="text-xs font-semibold text-[#1C1C1E] text-right break-words max-w-[65%]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="rounded-2xl bg-[#F2F2F7] px-4 py-4 text-center">
              <p className="text-xs text-[#8E8E93]">No form submitted yet</p>
              <p className="text-[11px] text-[#C7C7CC] mt-0.5">Waiting for reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Page
export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [crmTab, setCrmTab] = useState<CRMTab>('all')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [showContactDetails, setShowContactDetails] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/inbox')
    const data = await res.json()
    setConversations(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadMessages = useCallback(async (contactId: string) => {
    const res = await fetch(`/api/conversations/${contactId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages ?? [])
      setActiveContact(data.contact ?? null)
      setActiveLead(data.lead ?? null)
    }
  }, [])

  useEffect(() => {
    if (!selected?.contact_id) { setMessages([]); setActiveContact(null); return }
    loadMessages(selected.contact_id)
    const ch = supabaseBrowser
      .channel(`inbox-conv-${selected.contact_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, () => selected.contact_id && loadMessages(selected.contact_id))
      .subscribe()
    return () => { supabaseBrowser.removeChannel(ch) }
  }, [selected, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Realtime subscription for new messages
  useEffect(() => {
    const { data: { user } } = supabaseBrowser.auth.getUser()
    if (!user) return

    const channel = supabaseBrowser
      .channel('inbox-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        load()
      })
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [load])

  const filtered = conversations.filter(c => {
    if (!search) return true
    const name = displayNameFromConversation(c)
    return c.recipient.toLowerCase().includes(search.toLowerCase()) ||
           name.toLowerCase().includes(search.toLowerCase()) ||
           (c.content ?? '').toLowerCase().includes(search.toLowerCase())
  })

  const crmCounts = {
    all: conversations.length,
    new: conversations.filter(c => c.direction === 'inbound').length,
    contacted: conversations.filter(c => c.direction === 'outbound').length,
    closed: conversations.filter(c => c.status === 'replied').length,
  }

  async function sendReply(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!selected?.contact_id || (!reply.trim() && !selectedFile)) return
    setSending(true)
    setUploading(true)

    try {
      let mediaId: string | null = null
      let mediaType: string | null = null

      // Upload file to Meta if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('type', selectedFile.type)
        formData.append('messaging_product', 'whatsapp')

        const uploadRes = await fetch('/api/send/media', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.id) {
          mediaId = uploadData.id
          mediaType = selectedFile.type.startsWith('image/') ? 'image' :
                      selectedFile.type.startsWith('video/') ? 'video' :
                      selectedFile.type.startsWith('audio/') ? 'audio' : 'document'
        }
      }

      const res = await fetch('/api/send/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId: selected.contact_id, 
          message: reply.trim(),
          mediaId,
          mediaType,
          caption: reply.trim() || undefined
        }),
      })
      setSending(false)
      setUploading(false)
      setSelectedFile(null)
      if (res.ok) { setReply(''); loadMessages(selected.contact_id) }
    } catch (err) {
      console.error('Failed to send:', err)
      setSending(false)
      setUploading(false)
    }
  }

  function bubbleLabel(m: Message) {
    if (m.msg_type === 'form_submission') return m.content ?? 'Form submitted'
    if (m.direction === 'inbound') return m.content ?? ''
    if (m.msg_type === 'template') return m.content ?? 'Outreach message sent'
    if (m.msg_type === 'flow') return 'Flow form sent'
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
              </svg>
            </div>
            <div>
              <h1 className="text-[#1C1C1E] font-bold text-sm">Unified Inbox</h1>
              <p className="text-[#8E8E93] text-[11px]">{conversations.length} conversations</p>
            </div>
          </div>
        </div>
        <button onClick={load} className="text-xs font-semibold px-3 py-2 rounded-xl" style={{background:'#F2F2F7',color:'#1C1C1E'}}>
          Refresh
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contact list - Left panel */}
        <div className="w-80 border-r border-black/[0.06] flex flex-col" style={{background:'rgba(255,255,255,0.7)'}}>
          {/* CRM tabs */}
          <div className="px-3 py-2 border-b border-black/[0.05] flex gap-1">
            {(['all', 'new', 'contacted', 'closed'] as CRMTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setCrmTab(tab)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  crmTab === tab ? 'bg-[#1C1C1E] text-white' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({crmCounts[tab]})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2 bg-[#F2F2F7] rounded-xl px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="bg-transparent text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none flex-1 min-w-0"/>
            </div>
          </div>

          {/* Conversation list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                <span className="text-4xl mb-3">📬</span>
                <p className="text-[#1C1C1E] font-semibold text-sm">No conversations</p>
                <p className="text-[#8E8E93] text-xs mt-1">Messages will appear here</p>
              </div>
            ) : filtered.map(c => {
              const name = displayNameFromConversation(c)
              const isInbound = c.direction === 'inbound'
              const isSelected = selected?.id === c.id
              
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] transition-colors ${isSelected ? 'bg-[#25D366]/8' : 'hover:bg-black/[0.02]'}`}
                >
                  <Avatar name={c.contacts?.wa_name ?? c.contacts?.name ?? null as string | null} phone={c.recipient ?? 'unknown'} profilePictureUrl={c.contacts?.profile_picture_url} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[#1C1C1E] text-sm font-semibold truncate">{name}</p>
                      <p className="text-[#8E8E93] text-[10px] shrink-0">{timeAgo(c.sent_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ChannelLogo channel={c.channel} size={12} />
                      <p className="text-[#8E8E93] text-xs truncate">
                        {c.content 
                          ? c.content 
                          : c.msg_type === 'image' ? '📷 Image' 
                          : c.msg_type === 'video' ? '🎥 Video'
                          : c.msg_type === 'audio' ? '🎵 Audio'
                          : c.msg_type === 'document' ? '📄 Document'
                          : c.msg_type === 'template' ? '📨 Outreach sent'
                          : '(media)'}
                      </p>
                    </div>
                  </div>
                  {isInbound && (
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0" title="Unread" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat view - Middle panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{background:'#ECE5DD'}}>
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08]" style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)'}}>
                <button 
                  onClick={() => setShowContactDetails(true)}
                  className="cursor-pointer"
                >
                  <Avatar name={selected.contacts?.wa_name ?? selected.contacts?.name ?? null as string | null} phone={selected.recipient ?? 'unknown'} profilePictureUrl={selected.contacts?.profile_picture_url} size={38} />
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowContactDetails(true)}>
                  <p className="text-[#1C1C1E] font-bold text-sm truncate">{displayNameFromConversation(selected)}</p>
                  <p className="text-[#8E8E93] text-[11px] font-mono">{selected.recipient}</p>
                </div>
                <ChannelLogo channel={selected.channel} size={20} />
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="min-h-full flex flex-col justify-end">
                {messages.length === 0 ? (
                  <div className="flex justify-center pt-8">
                    <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">
                      No messages yet
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
                            {/* Media rendering */}
                            {m.msg_type === 'image' && m.media_url ? (
                              <img 
                                src={m.media_url} 
                                alt={m.caption || 'Image'} 
                                className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90"
                                onClick={() => window.open(m.media_url!, '_blank')}
                              />
                            ) : m.msg_type === 'image' && !m.media_url ? (
                              <span className="text-sm">📷 Image loading...</span>
                            ) : null}
                            {m.msg_type === 'video' && m.media_url && (
                              <video 
                                src={m.media_url} 
                                controls 
                                className="rounded-lg mb-2 max-w-full"
                              />
                            )}
                            {m.msg_type === 'audio' && m.media_url && (
                              <audio 
                                src={m.media_url} 
                                controls 
                                className="mb-2 w-full"
                              />
                            )}
                            {m.msg_type === 'document' && m.media_url && (
                              <a 
                                href={m.media_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-black/5 rounded-lg mb-2 hover:bg-black/10"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                  <polyline points="10 9 9 9 8 9"/>
                                </svg>
                                <span className="text-xs">Download file</span>
                              </a>
                            )}
                            {/* Only show text content if not a media message or if media failed to load */}
                            {!m.media_url && m.content && (
                              <p style={{ color: isForm ? '#34C759' : (ai ? 'white' : '#1C1C1E') }} className="whitespace-pre-wrap">
                                {isForm && '✅ '}{bubbleLabel(m)}
                              </p>
                            )}
                            {m.caption && !m.media_url && (
                              <p className="text-xs mt-1 opacity-70">{m.caption}</p>
                            )}
                          </div>
                        </div>
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
              <form onSubmit={sendReply} className="flex items-end gap-2 px-3 py-3 border-t border-black/[0.06]" style={{background:'rgba(255,255,255,0.95)'}}>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{background:'#F2F2F7',color:'#8E8E93'}}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 bg-[#F2F2F7] rounded-2xl px-4 py-2.5 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none"
                />
                <button type="submit" disabled={sending || uploading || (!reply.trim() && !selectedFile)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40" style={{background:'#25D366',color:'white',boxShadow:'0 2px 8px rgba(37,211,102,0.4)'}}>
                  {sending || uploading ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl mb-4">💬</span>
                <p className="text-[#1C1C1E] font-semibold">Select a conversation</p>
                <p className="text-[#8E8E93] text-sm mt-1">to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right context panel */}
        <ContextPanel 
          contact={activeContact} 
          lead={activeLead} 
        />
      </div>

      {/* Contact Details Slide-over */}
      {showContactDetails && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <h2 className="text-[#1C1C1E] font-bold text-lg">Contact Details</h2>
              <button onClick={() => setShowContactDetails(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile section */}
              <div className="text-center mb-6">
                <Avatar 
                  name={selected.contacts?.wa_name ?? selected.contacts?.name ?? null as string | null} 
                  phone={selected.recipient ?? 'unknown'} 
                  profilePictureUrl={selected.contacts?.profile_picture_url} 
                  size={80} 
                />
                <h3 className="text-[#1C1C1E] font-bold text-xl mt-4">
                  {selected.contacts?.wa_name ?? selected.contacts?.name ?? 'Unknown'}
                </h3>
                <p className="text-[#8E8E93] text-sm font-mono mt-1">{selected.recipient}</p>
                {activeContact?.wa_about && (
                  <p className="text-[#8E8E93] text-sm mt-3 italic">"{activeContact.wa_about}"</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <DetailRow label="Email" value={activeContact?.wa_email} />
                <DetailRow label="Business" value={activeContact?.wa_business_name} />
                <DetailRow label="Address" value={activeContact?.wa_address} />
                <DetailRow label="Last seen" value={activeContact?.last_seen_at ? new Date(activeContact.last_seen_at).toLocaleString() : null} />
                <DetailRow label="Type" value={activeContact?.is_business ? 'Business Account' : 'Personal Account'} />
                <DetailRow label="Channel" value={selected.channel} />
                <DetailRow label="Added" value={activeContact?.created_at ? new Date(activeContact.created_at).toLocaleString() : null} />
              </div>

              {/* Message history summary */}
              <div className="mt-8 pt-6 border-t border-black/[0.06]">
                <h4 className="text-[#1C1C1E] font-semibold text-sm mb-3">Message History</h4>
                <p className="text-[#8E8E93] text-sm">Total messages: {messages.length}</p>
                <p className="text-[#8E8E93] text-sm">First contact: {activeContact?.created_at ? new Date(activeContact.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[#8E8E93] text-sm">{label}</span>
      <span className="text-[#1C1C1E] text-sm font-medium">{value}</span>
    </div>
  )
}
