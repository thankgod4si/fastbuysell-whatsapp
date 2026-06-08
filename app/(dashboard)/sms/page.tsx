'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Contact } from '@/types'

const STATUS_STYLE: Record<Contact['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  replied: 'bg-green-500/10 text-green-400 border border-green-500/20',
  blacklisted: 'bg-gray-500/10 text-gray-500 border border-gray-700',
}

type ToastItem = { id: number; msg: string; ok: boolean }

function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border ${
            t.ok
              ? 'bg-gray-900 border-green-500/30 text-green-400'
              : 'bg-gray-900 border-red-500/30 text-red-400'
          }`}
        >
          {t.ok ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function SmsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkSending, setBulkSending] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [message, setMessage] = useState(
    "Hi, this is Fast Buy & Sell – we buy used cars across Europe. Want a quick offer on your vehicle? Reply YES and we'll be in touch. Reply STOP to opt out."
  )
  const [showMessageEditor, setShowMessageEditor] = useState(false)
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)

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
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), channel: 'sms' }),
    })
    setAdding(false)
    if (res.ok) {
      setPhone('')
      notify('Contact added')
      load()
    } else {
      const d = await res.json()
      notify(d.error || 'Failed to add', false)
    }
  }

  async function sendOne(contact: Contact) {
    setSendingId(contact.id)
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, message }),
    })
    setSendingId(null)
    const data = await res.json()
    if (res.ok) {
      notify(`Sent to ${contact.phone}`)
      load()
    } else {
      notify(data.error || 'Send failed', false)
    }
  }

  async function sendAll() {
    const pending = contacts.filter(c => c.status === 'pending')
    if (!pending.length) { notify('No pending contacts', false); return }
    setBulkSending(true)
    const params = new URLSearchParams({ message })
    const res = await fetch(`/api/sms/send?${params}`)
    const data = await res.json()
    setBulkSending(false)
    if (res.ok) {
      notify(`Sent to ${data.sent} contact${data.sent !== 1 ? 's' : ''}`)
      load()
    } else {
      notify(data.error || 'Bulk send failed', false)
    }
  }

  const pending = contacts.filter(c => c.status === 'pending').length
  const sent = contacts.filter(c => c.status === 'sent').length
  const replied = contacts.filter(c => c.status === 'replied').length

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SMS Outreach</h1>
          <p className="text-gray-500 text-sm mt-1">Send bulk SMS to potential car sellers via Sinch</p>
        </div>

        <div className="flex items-center gap-3">
          {[
            { label: 'Pending', count: pending, color: 'text-yellow-400' },
            { label: 'Sent', count: sent, color: 'text-blue-400' },
            { label: 'Replied', count: replied, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-center min-w-16">
              <p className={`font-bold text-lg tabular-nums ${s.color}`}>{s.count}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}

          <button
            onClick={sendAll}
            disabled={bulkSending || pending === 0}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {bulkSending ? 'Sending...' : `Send to ${pending} Pending`}
          </button>
        </div>
      </div>

      {/* Message template */}
      <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowMessageEditor(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-sm text-gray-400 font-medium">Message Template</span>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showMessageEditor ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showMessageEditor && (
          <div className="px-5 pb-5 space-y-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500/50 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors resize-none"
            />
            <p className="text-gray-600 text-xs">{message.length} chars · Always include STOP opt-out for compliance</p>
          </div>
        )}
      </div>

      {/* Add contact */}
      <form onSubmit={addContact} className="mb-6 flex gap-3">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+49171234567 (international format)"
          className="flex-1 bg-gray-900 border border-gray-800 focus:border-blue-500/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={adding || !phone.trim()}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {adding ? 'Adding...' : '+ Add Contact'}
        </button>
      </form>

      {/* Contacts list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium text-sm">No SMS contacts yet</p>
          <p className="text-gray-600 text-sm mt-1 max-w-xs">Add phone numbers above to start your SMS campaign</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center justify-between gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-mono">{contact.phone}</p>
                  {contact.sent_at && (
                    <p className="text-gray-600 text-xs mt-0.5">
                      Sent {new Date(contact.sent_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[contact.status]}`}>
                  {contact.status}
                </span>
                {contact.status === 'pending' && (
                  <button
                    onClick={() => sendOne(contact)}
                    disabled={sendingId === contact.id}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    {sendingId === contact.id ? 'Sending...' : 'Send'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  )
}
