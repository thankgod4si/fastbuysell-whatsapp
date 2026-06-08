'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Contact } from '@/types'

type ToastItem = { id: number; msg: string; ok: boolean }

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Queued',    color: '#FF9500' },
  sent:        { label: 'Sent',      color: '#007AFF' },
  replied:     { label: 'Replied',   color: '#34C759' },
  blacklisted: { label: 'Opted out', color: '#8E8E93' },
}

function Avatar({ phone }: { phone: string }) {
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg,#FF9500,#FF6B00)' }}>
      {phone.slice(-2)}
    </div>
  )
}

export default function SmsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [bulkSending, setBulkSending] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [message, setMessage] = useState("Hi, this is Fast Buy & Sell – we buy used cars across Europe. Want a quick offer on your vehicle? Reply YES and we'll be in touch. Reply STOP to opt out.")
  const [showEditor, setShowEditor] = useState(false)
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/contacts?channel=sms')
    const data = await res.json()
    setContacts(Array.isArray(data) ? data.filter((c: Contact) => c.channel === 'sms') : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function notify(msg: string, ok = true) {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setAdding(true)
    const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone.trim(), channel: 'sms' }) })
    setAdding(false)
    if (res.ok) { setPhone(''); notify('Contact added'); load() }
    else { const d = await res.json(); notify(d.error || 'Failed', false) }
  }

  async function sendOne(contact: Contact) {
    setSendingId(contact.id)
    const res = await fetch('/api/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId: contact.id, message }) })
    setSendingId(null)
    if (res.ok) { notify(`Sent to ${contact.phone}`); load() }
    else { const d = await res.json(); notify(d.error || 'Failed', false) }
  }

  async function sendAll() {
    const pending = contacts.filter(c => c.status === 'pending')
    if (!pending.length) { notify('No pending contacts', false); return }
    setBulkSending(true)
    const res = await fetch(`/api/sms/send?${new URLSearchParams({ message })}`)
    const data = await res.json()
    setBulkSending(false)
    if (res.ok) { notify(`Sent to ${data.sent} contact${data.sent !== 1 ? 's' : ''}`); load() }
    else notify(data.error || 'Failed', false)
  }

  const pendingCount = contacts.filter(c => c.status === 'pending').length
  const filtered = contacts.filter(c => !searchQ || c.phone.includes(searchQ))

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-6xl" style={{ margin: '-2rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: '#FF950018' }}>📱</div>
            <div>
              <h1 className="text-[#1C1C1E] font-bold text-sm">SMS Outreach</h1>
              <p className="text-[#8E8E93] text-[11px]">{contacts.length} contacts · Brevo</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            {[{l:'Queued',v:pendingCount,c:'#FF9500'},{l:'Sent',v:contacts.filter(c=>c.status==='sent').length,c:'#007AFF'},{l:'Replied',v:contacts.filter(c=>c.status==='replied').length,c:'#34C759'}].map(s=>(
              <div key={s.l} className="rounded-xl px-3 py-1.5" style={{background:`${s.c}12`}}>
                <span className="font-black text-base tabular-nums" style={{color:s.c}}>{s.v}</span>
                <span className="ml-1.5 font-medium" style={{color:s.c}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditor(v => !v)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-black/[0.08] text-[#3C3C43] hover:bg-black/[0.04] transition-colors">
            ✏️ Message
          </button>
          <button onClick={sendAll} disabled={bulkSending || pendingCount === 0}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white disabled:opacity-40"
            style={{ background: '#FF9500', boxShadow: '0 2px 8px rgba(255,149,0,0.35)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {bulkSending ? 'Sending…' : `Blast ${pendingCount}`}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contact list */}
        <div className="w-80 border-r border-black/[0.06] flex flex-col" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="p-3 space-y-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2 bg-[#F2F2F7] rounded-xl px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…" className="bg-transparent text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none flex-1"/>
            </div>
            <form onSubmit={addContact} className="flex gap-2">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 171…" className="flex-1 bg-[#F2F2F7] rounded-xl px-3 py-2 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none"/>
              <button type="submit" disabled={adding || !phone.trim()} className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40" style={{ background: '#FF9500' }}>
                {adding ? '…' : '+ Add'}
              </button>
            </form>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 bg-black/[0.04] rounded-2xl animate-pulse"/>)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                <span className="text-4xl mb-3">📱</span>
                <p className="text-[#1C1C1E] font-semibold text-sm">No SMS contacts</p>
                <p className="text-[#8E8E93] text-xs mt-1">Add a phone number above</p>
              </div>
            ) : filtered.map(c => {
              const meta = STATUS_META[c.status] ?? STATUS_META.pending
              return (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] transition-colors ${selected?.id === c.id ? 'bg-[#FF9500]/8' : 'hover:bg-black/[0.02]'}`}>
                  <Avatar phone={c.phone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1C1C1E] text-sm font-semibold font-mono truncate">{c.phone}</p>
                    <p className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
                  </div>
                  {c.status === 'pending' && (
                    <button onClick={e => { e.stopPropagation(); sendOne(c) }} disabled={sendingId === c.id}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 disabled:opacity-40"
                      style={{ background: '#FF950015', color: '#FF9500' }}>
                      {sendingId === c.id ? '…' : 'Send'}
                    </button>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col" style={{ background: '#F0EAE0' }}>
          {showEditor && (
            <div className="px-6 py-4 border-b border-black/[0.08]" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <p className="text-[#1C1C1E] font-semibold text-sm mb-2">SMS Template</p>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] outline-none resize-none"/>
              <p className="text-[#8E8E93] text-xs mt-1.5">{message.length} chars · Include STOP opt-out for compliance</p>
            </div>
          )}

          {selected ? (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.08]" style={{ background: 'rgba(255,255,255,0.9)' }}>
                <Avatar phone={selected.phone} />
                <div>
                  <p className="text-[#1C1C1E] font-semibold text-sm font-mono">{selected.phone}</p>
                  <p className="text-xs" style={{ color: STATUS_META[selected.status]?.color ?? '#8E8E93' }}>{STATUS_META[selected.status]?.label}</p>
                </div>
                {selected.status === 'pending' && (
                  <button onClick={() => sendOne(selected)} disabled={sendingId === selected.id}
                    className="ml-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                    style={{ background: '#FF9500' }}>
                    {sendingId === selected.id ? 'Sending…' : 'Send Now'}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <div className="text-center">
                  <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">
                    {selected.sent_at ? new Date(selected.sent_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Not yet sent'}
                  </span>
                </div>

                {selected.status !== 'pending' && (
                  <div className="flex justify-end">
                    <div className="max-w-xs rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm" style={{ background: '#007AFF', color: 'white' }}>
                      <p className="text-sm leading-relaxed">{message}</p>
                      <p className="text-white/60 text-[10px] mt-1.5 text-right">
                        {selected.sent_at ? new Date(selected.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} ✓
                      </p>
                    </div>
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div className="flex justify-center">
                    <div className="bg-white/80 rounded-2xl px-5 py-4 max-w-xs text-center shadow-sm">
                      <p className="text-2xl mb-2">📱</p>
                      <p className="text-[#1C1C1E] text-sm font-semibold">Ready to send</p>
                      <p className="text-[#8E8E93] text-xs mt-1">Hit "Send Now" to deliver this SMS</p>
                    </div>
                  </div>
                )}

                {selected.status === 'replied' && (
                  <div className="flex justify-start">
                    <div className="max-w-xs rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm bg-white text-sm text-[#1C1C1E]">YES ✓</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(255,149,0,0.12)' }}>📱</div>
              <div>
                <p className="text-[#1C1C1E] font-bold text-lg">SMS Outreach</p>
                <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Select a contact to view or add numbers to start a campaign.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-2xl text-sm font-semibold shadow-lg bg-white/90 backdrop-blur-xl border ${t.ok ? 'border-[#34C759]/30 text-[#34C759]' : 'border-[#FF3B30]/30 text-[#FF3B30]'}`}>
            {t.ok ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
