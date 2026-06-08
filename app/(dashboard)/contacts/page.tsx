'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Contact } from '@/types'

const TEMPLATE = `Hallo,

Wir sind Fast Buy & Sell – eine Plattform, die Fahrzeugverkäufer mit verifizierten Käufern in ganz Europa verbindet.

Haben Sie derzeit Fahrzeuge zum Verkauf verfügbar?`

type ToastItem = { id: number; msg: string; ok: boolean }

function parseNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;\s]+/)
    .map(p => p.trim().replace(/^00/, '+'))
    .filter(p => p.match(/^\+?[0-9]{7,15}$/))
    .map(p => p.startsWith('+') ? p : '+' + p)
    .filter((p, i, arr) => arr.indexOf(p) === i)
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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const detected = parseNumbers(raw)

  const load = useCallback(async () => {
    const res = await fetch('/api/contacts')
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { load() }, [load])

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

  const sendTest = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    setTesting(true)
    const res = await fetch('/api/send/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: testPhone }) })
    const data = await res.json()
    setTesting(false)
    if (!res.ok) notify(data.error, false)
    else notify('Test sent! Check WhatsApp ✓')
  }

  const filtered = contacts.filter(c => !searchQ || c.phone.includes(searchQ))

  const stats = {
    pending: contacts.filter(c => c.status === 'pending').length,
    sent: contacts.filter(c => c.status === 'sent').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-6xl -m-8" style={{ margin: '-2rem' }}>

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
              <h1 className="text-[#1C1C1E] font-bold text-sm">WhatsApp</h1>
              <p className="text-[#8E8E93] text-[11px]">{contacts.length} contacts</p>
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
          <button onClick={()=>setShowAdd(v=>!v)} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all" style={{background:'#25D366',color:'white',boxShadow:'0 2px 8px rgba(37,211,102,0.4)'}}>
            <span>+</span> Add Numbers
          </button>
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
              <button key={c.id} onClick={()=>setSelected(c)} className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] transition-colors ${selected?.id===c.id?'bg-[#25D366]/8':'hover:bg-black/[0.02]'}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold" style={{background:'linear-gradient(135deg,#25D366,#128C7E)'}}>
                  {c.phone.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#1C1C1E] text-sm font-semibold font-mono truncate">{c.phone}</p>
                    <p className="text-[#8E8E93] text-[10px] shrink-0">{formatTime(c.sent_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <DeliveryTick status={c.status} />
                    <p className="text-[#8E8E93] text-xs truncate">
                      {c.status === 'replied' ? 'Replied to your message' : c.status === 'sent' ? 'Template sent' : c.status === 'blacklisted' ? 'Opted out' : 'Queued for sending'}
                    </p>
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
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.08]" style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(20px)'}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{background:'linear-gradient(135deg,#25D366,#128C7E)'}}>
                  {selected.phone.slice(-2)}
                </div>
                <div>
                  <p className="text-[#1C1C1E] font-semibold text-sm font-mono">{selected.phone}</p>
                  <p className="text-[#8E8E93] text-xs capitalize">{selected.status === 'replied' ? '🟢 Replied' : selected.status === 'sent' ? '✓✓ Delivered' : selected.status === 'pending' ? '⏳ Queued' : '⛔ Opted out'}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  {selected.status === 'pending' && (
                    <button onClick={()=>sendOne(selected)} disabled={sendingId===selected.id} className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50" style={{background:'#25D366',boxShadow:'0 2px 6px rgba(37,211,102,0.4)'}}>
                      {sendingId===selected.id?'Sending…':'Send Now'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {/* Date chip */}
                <div className="text-center">
                  <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">
                    {selected.sent_at ? new Date(selected.sent_at).toLocaleDateString(undefined, {weekday:'long',month:'long',day:'numeric'}) : 'Not yet sent'}
                  </span>
                </div>

                {/* Outbound message bubble */}
                {(selected.status !== 'pending' && selected.status !== 'blacklisted') && (
                  <div className="flex justify-end">
                    <div className="max-w-xs rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm" style={{background:'#DCF8C6'}}>
                      <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-line">{TEMPLATE}</p>
                      <div className="flex items-center justify-end gap-1 mt-1.5">
                        <span className="text-[#667781] text-[10px]">{formatTime(selected.sent_at)}</span>
                        <DeliveryTick status={selected.status} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending state */}
                {selected.status === 'pending' && (
                  <div className="flex justify-center">
                    <div className="bg-white/80 rounded-2xl px-5 py-4 max-w-xs text-center shadow-sm">
                      <p className="text-2xl mb-2">⏳</p>
                      <p className="text-[#1C1C1E] text-sm font-semibold">Ready to send</p>
                      <p className="text-[#8E8E93] text-xs mt-1">Cron sends automatically, or click "Send Now" above</p>
                    </div>
                  </div>
                )}

                {/* Replied state */}
                {selected.status === 'replied' && (
                  <div className="flex justify-start">
                    <div className="max-w-xs rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm bg-white">
                      <p className="text-[#1C1C1E] text-sm">Replied to your message 👍</p>
                      <p className="text-[#8E8E93] text-[10px] mt-1">Via WhatsApp Flow</p>
                    </div>
                  </div>
                )}

                {/* Blacklisted */}
                {selected.status === 'blacklisted' && (
                  <div className="flex justify-center">
                    <span className="text-[11px] text-[#5C5C5C] bg-white/60 px-3 py-1 rounded-full">⛔ Opted out — no more messages</span>
                  </div>
                )}
              </div>

              {/* WhatsApp template notice */}
              <div className="px-4 py-2 border-t border-black/[0.06]" style={{background:'rgba(255,255,255,0.9)'}}>
                <div className="flex items-center gap-2 text-[#667781] text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <p>Sends the approved <span className="font-semibold">car_seller_inquiry</span> template · Cron fires every 20 seconds</p>
                </div>
              </div>
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
    </div>
  )
}
