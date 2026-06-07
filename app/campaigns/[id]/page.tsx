'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Campaign, CampaignContact } from '@/types'

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

const STATUS_STYLE: Record<CampaignContact['status'], string> = {
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  sent: 'bg-green-500/10 text-green-400 border border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

function parseCSV(text: string): { name: string; email: string }[] {
  const lines = text.trim().split('\n').filter(Boolean)
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('email') || firstLine.includes('name')
  const dataLines = hasHeader ? lines.slice(1) : lines
  return dataLines.map(line => {
    const parts = line.split(/,|\t/).map(s => s.trim().replace(/^"|"$/g, ''))
    const [a, b] = parts
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(a)) return { name: b || 'Contact', email: a }
    if (emailRegex.test(b)) return { name: a || 'Contact', email: b }
    return null
  }).filter(Boolean) as { name: string; email: string }[]
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contacts, setContacts] = useState<CampaignContact[]>([])
  const [tab, setTab] = useState<'template' | 'contacts'>('contacts')
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Template edit state
  const [form, setForm] = useState({ name: '', subject: '', body: '', reply_to: '' })
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Contact add state
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [addingOne, setAddingOne] = useState(false)
  const [importingCSV, setImportingCSV] = useState(false)
  const [blasting, setBlasting] = useState(false)

  const notify = useCallback((msg: string, ok = true) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const loadContacts = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}/contacts`)
    setContacts(await res.json())
  }, [id])

  useEffect(() => {
    async function init() {
      const [cRes] = await Promise.all([fetch(`/api/campaigns/${id}`), loadContacts()])
      const c = await cRes.json()
      if (cRes.ok) {
        setCampaign(c)
        setForm({ name: c.name, subject: c.subject, body: c.body, reply_to: c.reply_to })
      }
    }
    init()
  }, [id, loadContacts])

  async function saveTemplate(e: React.BaseSyntheticEvent) {
    e.preventDefault()
    setSavingTemplate(true)
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSavingTemplate(false)
    if (res.ok) { notify('Template saved'); setCampaign(await res.json()) }
    else notify('Save failed', false)
  }

  async function addOne(e: React.BaseSyntheticEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAddingOne(true)
    const res = await fetch(`/api/campaigns/${id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: [{ name: newName || 'Contact', email: newEmail }] }),
    })
    const data = await res.json()
    setAddingOne(false)
    if (!res.ok) { notify(data.error, false); return }
    notify(`Contact added`)
    setNewEmail(''); setNewName('')
    loadContacts()
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingCSV(true)
    const text = await file.text()
    const parsed = parseCSV(text)
    if (!parsed.length) { notify('No valid emails found in CSV', false); setImportingCSV(false); return }

    const res = await fetch(`/api/campaigns/${id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: parsed }),
    })
    const data = await res.json()
    setImportingCSV(false)
    if (!res.ok) { notify(data.error, false); return }
    notify(`${data.added} contact${data.added !== 1 ? 's' : ''} imported`)
    loadContacts()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeContact(contactId: string) {
    await fetch(`/api/campaigns/${id}/contacts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    })
    loadContacts()
  }

  async function blast() {
    const pending = contacts.filter(c => c.status === 'pending').length
    if (!pending) { notify('No pending contacts to email', false); return }
    setBlasting(true)
    const res = await fetch(`/api/campaigns/${id}/blast`, { method: 'POST' })
    const data = await res.json()
    setBlasting(false)
    if (!res.ok) { notify('Blast failed', false); return }
    notify(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}${data.failed?.length ? ` · ${data.failed.length} failed` : ''}`)
    loadContacts()
  }

  const pending = contacts.filter(c => c.status === 'pending').length
  const sent = contacts.filter(c => c.status === 'sent').length
  const failed = contacts.filter(c => c.status === 'failed').length

  if (!campaign) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600 text-sm">Loading campaign...</div>
    </div>
  )

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <button onClick={() => router.push('/campaigns')} className="text-gray-600 hover:text-gray-400 text-sm mb-2 transition-colors">
            ← Campaigns
          </button>
          <h1 className="text-2xl font-bold text-white truncate">{campaign.name}</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">Subject: {campaign.subject}</p>
        </div>

        {/* Stats + Blast */}
        <div className="flex items-center gap-3 shrink-0">
          {[
            { label: 'Pending', value: pending, color: 'text-amber-400' },
            { label: 'Sent', value: sent, color: 'text-green-400' },
            { label: 'Failed', value: failed, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-center min-w-14">
              <p className={`font-bold text-base tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}

          <button
            onClick={blast}
            disabled={blasting || pending === 0}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 shadow-lg shadow-green-500/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {blasting ? 'Sending...' : `Blast ${pending}`}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(['contacts', 'template'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
            {t === 'contacts' && ` (${contacts.length})`}
          </button>
        ))}
      </div>

      {/* ── Contacts tab ── */}
      {tab === 'contacts' && (
        <div className="flex flex-col gap-5">
          {/* Add controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-white font-semibold text-sm">Add Contacts</p>

            {/* Single add */}
            <form onSubmit={addOne} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name (optional)"
                className="w-36 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
              <button type="submit" disabled={addingOne} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0">
                {addingOne ? '...' : 'Add'}
              </button>
            </form>

            {/* CSV import */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs">or import</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importingCSV}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {importingCSV ? 'Importing...' : 'Upload CSV'}
              </button>
              <p className="text-gray-600 text-xs">CSV format: name, email (one per line)</p>
            </div>
          </div>

          {/* Contact list */}
          {contacts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-gray-500 text-sm">{contacts.length} total contacts</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Sent At</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={c.id} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ${i === contacts.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-3 text-sm text-gray-200">{c.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-400 font-mono">{c.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-sm">
                        {c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => removeContact(c.id)} className="text-gray-700 hover:text-red-400 text-xs transition-colors">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="border border-dashed border-gray-800 rounded-2xl py-12 text-center">
              <p className="text-gray-600 text-sm">No contacts yet — add one above or upload a CSV</p>
            </div>
          )}
        </div>
      )}

      {/* ── Template tab ── */}
      {tab === 'template' && (
        <form onSubmit={saveTemplate} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
          <p className="text-white font-semibold">Edit Campaign Template</p>

          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Campaign Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Email Subject</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Reply-To Email</label>
            <input type="email" value={form.reply_to} onChange={e => setForm(f => ({ ...f, reply_to: e.target.value }))} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">
              Email Body
              <span className="text-gray-600 ml-2 font-normal">{'{{name}}'} = contact name</span>
            </label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={12}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors resize-none font-mono leading-relaxed"
            />
          </div>

          <button type="submit" disabled={savingTemplate}
            className="bg-green-500 hover:bg-green-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20">
            {savingTemplate ? 'Saving...' : 'Save Template'}
          </button>
        </form>
      )}

      <Toast toasts={toasts} />
    </div>
  )
}
