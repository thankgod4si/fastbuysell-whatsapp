'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Contact } from '@/types'

const STATUS_STYLE: Record<Contact['status'], string> = {
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  replied: 'bg-green-500/10 text-green-400 border border-green-500/20',
  blacklisted: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

type ToastItem = { id: number; msg: string; ok: boolean }

function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border ${t.ok ? 'bg-gray-900 border-green-500/30 text-green-400' : 'bg-gray-900 border-red-500/30 text-red-400'}`}>
          {t.ok ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

function parseNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;\s]+/)
    .map(p => p.trim().replace(/^00/, '+'))
    .filter(p => p.match(/^\+?[0-9]{7,15}$/))
    .map(p => p.startsWith('+') ? p : '+' + p)
    .filter((p, i, arr) => arr.indexOf(p) === i) // dedupe
}

const TEMPLATE_PREVIEW = `Hallo,

Wir sind Fast Buy & Sell – eine Plattform, die Fahrzeugverkäufer mit verifizierten Käufern in ganz Europa verbindet.

Haben Sie derzeit Fahrzeuge zum Verkauf verfügbar?`

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)

  const detected = parseNumbers(raw)

  const load = useCallback(async () => {
    const res = await fetch('/api/contacts')
    setContacts(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  function notify(msg: string, ok = true) {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  const sendTest = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) return
    setTesting(true)
    const res = await fetch('/api/send/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone }),
    })
    const data = await res.json()
    setTesting(false)
    if (!res.ok) notify(data.error, false)
    else notify('Test message sent! Check your WhatsApp ✓')
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
    notify(`${data.added} number${data.added !== 1 ? 's' : ''} saved to queue`)
    setRaw('')
    load()
  }

  async function sendOne(contactId: string) {
    setSendingId(contactId)
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    })
    const data = await res.json()
    setSendingId(null)
    if (!res.ok) notify(data.error, false)
    else notify('Message sent!')
    load()
  }

  const stats = {
    queued: contacts.filter(c => c.status === 'pending').length,
    sent: contacts.filter(c => c.status === 'sent').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Sender</h1>
          <p className="text-gray-500 text-sm mt-1">
            Paste numbers, save to queue, cron sends 1 every 20 seconds
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {[
            { label: 'In Queue', value: stats.queued, color: 'text-amber-400' },
            { label: 'Sent', value: stats.sent, color: 'text-blue-400' },
            { label: 'Replied', value: stats.replied, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-center">
              <p className={`font-bold text-xl tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Test Banner */}
      <form onSubmit={sendTest} className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <p className="text-blue-400 text-sm font-medium">API Test</p>
        </div>
        <p className="text-gray-500 text-sm shrink-0">Send a plain text message to confirm connection:</p>
        <input
          type="text"
          value={testPhone}
          onChange={e => setTestPhone(e.target.value)}
          placeholder="Your WhatsApp number e.g. +2348012345678"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={testing || !testPhone.trim()}
          className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 shrink-0"
        >
          {testing ? 'Sending...' : 'Send Test'}
        </button>
      </form>

      {/* Main: Input + Preview */}
      <div className="grid grid-cols-2 gap-5 mb-5">

        {/* Left — Paste numbers */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Paste Phone Numbers</p>
            {detected.length > 0 && (
              <span className="text-green-400 text-xs font-medium bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                {detected.length} detected
              </span>
            )}
          </div>

          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder={`Paste numbers here — one per line or comma separated:\n\n+49 171 234 5678\n+49 172 345 6789\n+4915123456789`}
            rows={10}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-green-500 transition-colors resize-none leading-relaxed"
          />

          {detected.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 max-h-28 overflow-y-auto">
              <p className="text-gray-500 text-xs mb-2">Preview ({detected.length} numbers)</p>
              <div className="flex flex-wrap gap-1.5">
                {detected.slice(0, 30).map(p => (
                  <span key={p} className="text-xs font-mono text-gray-300 bg-gray-700 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
                {detected.length > 30 && (
                  <span className="text-xs text-gray-600">+{detected.length - 30} more</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveToQueue}
              disabled={saving || detected.length === 0}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30"
            >
              {saving ? 'Saving...' : 'Save to Queue'}
            </button>
            <button
              onClick={saveToQueue}
              disabled={saving || detected.length === 0}
              className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30 shadow-lg shadow-green-500/20"
            >
              {saving ? 'Saving...' : `Save & Let Cron Send`}
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Cron sends 1 message every 20 seconds automatically
          </p>
        </div>

        {/* Right — Template preview */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-white font-semibold text-sm">Template Preview</p>

          {/* WhatsApp-style bubble */}
          <div className="bg-[#0b141a] rounded-xl p-4 flex-1 flex flex-col gap-3">
            <p className="text-gray-600 text-xs text-center">Today</p>
            <div className="flex flex-col items-start gap-1 max-w-xs">
              <div className="bg-[#202c33] rounded-xl rounded-tl-none p-3 text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                {TEMPLATE_PREVIEW}
              </div>
              <p className="text-gray-600 text-xs ml-1">Fast Buy & Sell · now</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-1.5 max-w-xs w-full">
              <div className="bg-[#202c33] border border-[#2a3942] rounded-xl py-2.5 text-center text-green-400 text-sm font-medium">
                Ja, ich bin interessiert
              </div>
              <div className="bg-[#202c33] border border-[#2a3942] rounded-xl py-2.5 text-center text-green-400 text-sm font-medium">
                Keine Nachrichten mehr
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 mb-0.5">Template</p>
              <p className="text-white font-mono">car_seller_inquiry</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 mb-0.5">Language</p>
              <p className="text-white">German (de)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue table */}
      {contacts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Queue</p>
            <p className="text-gray-500 text-sm">{contacts.length} total</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="px-5 py-3 font-medium">Phone Number</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent At</th>
                <th className="px-5 py-3 font-medium text-right">Manual Send</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors ${i === contacts.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-3 font-mono text-sm text-gray-200">{c.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-sm">
                    {c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => sendOne(c.id)}
                      disabled={c.status !== 'pending' || sendingId === c.id}
                      className="text-xs font-medium px-4 py-1.5 rounded-lg transition-all border
                        enabled:bg-green-500/10 enabled:text-green-400 enabled:border-green-500/20 enabled:hover:bg-green-500/20
                        disabled:text-gray-700 disabled:border-gray-800 disabled:cursor-not-allowed"
                    >
                      {sendingId === c.id ? '...' : 'Send Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  )
}
