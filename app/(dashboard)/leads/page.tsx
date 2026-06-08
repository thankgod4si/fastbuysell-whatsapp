'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Lead } from '@/types'

const STATUS_STYLE: Record<Lead['status'], string> = {
  new: 'bg-green-500/10 text-green-400 border border-green-500/20',
  contacted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border border-gray-700',
}

const SOURCE_BADGE: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  whatsapp: {
    label: 'WhatsApp',
    style: 'bg-green-500/10 text-green-400 border border-green-500/20',
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z" />
      </svg>
    ),
  },
  sms: {
    label: 'SMS',
    style: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
  email: {
    label: 'Email',
    style: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
}

const NEXT: Record<Lead['status'], Lead['status'] | null> = {
  new: 'contacted',
  contacted: 'closed',
  closed: null,
}

const NEXT_LABEL: Record<Lead['status'], string> = {
  new: 'Mark as Contacted',
  contacted: 'Mark as Closed',
  closed: '',
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-500 text-sm shrink-0">{label}</span>
      <span className="text-gray-200 text-sm text-right font-medium">{value}</span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={copy}
      className="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
      title="Copy email"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Lead | null>(null)
  const [advancing, setAdvancing] = useState(false)
  const [blasting, setBlasting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(data)
    if (selected) {
      const updated = data.find((l: Lead) => l.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [selected])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function notify(msg: string, ok = true) {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  async function advance(lead: Lead) {
    const next = NEXT[lead.status]
    if (!next) return
    setAdvancing(true)
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status: next }),
    })
    setAdvancing(false)
    const updated = { ...lead, status: next }
    setSelected(updated)
    setLeads(prev => prev.map(l => l.id === lead.id ? updated : l))
  }

  async function blastNewLeads() {
    const unsent = leads.filter(l => l.status === 'new' && !l.email_sent_at)
    if (!unsent.length) { notify('No new leads without emails', false); return }
    setBlasting(true)
    const res = await fetch('/api/email')
    const data = await res.json()
    setBlasting(false)
    if (!res.ok) { notify('Blast failed', false); return }
    notify(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}${data.failed?.length ? ` (${data.failed.length} failed)` : ''}`)
    load()
  }

  const counts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    closed: leads.filter(l => l.status === 'closed').length,
  }

  const unsentNew = leads.filter(l => l.status === 'new' && !l.email_sent_at).length

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Sellers who responded and filled in the car form</p>
        </div>

        <div className="flex items-center gap-3">
          {[
            { label: 'New', count: counts.new, color: 'text-green-400' },
            { label: 'Contacted', count: counts.contacted, color: 'text-blue-400' },
            { label: 'Closed', count: counts.closed, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-center min-w-16">
              <p className={`font-bold text-lg tabular-nums ${s.color}`}>{s.count}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}

          <button
            onClick={blastNewLeads}
            disabled={blasting || unsentNew === 0}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {blasting ? 'Sending...' : `Notify ${unsentNew} New Lead${unsentNew !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium text-sm">No leads yet</p>
          <p className="text-gray-600 text-sm mt-1 max-w-xs">
            Leads appear here when a seller fills in the WhatsApp form.
          </p>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          {/* Lead cards */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelected(lead)}
                className={`w-full text-left bg-gray-900 border rounded-xl px-5 py-4 transition-all hover:border-gray-600 ${
                  selected?.id === lead.id
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <p className="text-white font-semibold text-sm truncate">{lead.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[lead.status]}`}>
                        {lead.status}
                      </span>
                      {lead.source && SOURCE_BADGE[lead.source] && (
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${SOURCE_BADGE[lead.source].style}`}>
                          {SOURCE_BADGE[lead.source].icon}
                          {SOURCE_BADGE[lead.source].label}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs font-mono">{lead.phone}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">
                      €{Number(lead.asking_price).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {lead.car_year} {lead.car_make} {lead.car_model}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col shrink-0 sticky top-0 overflow-hidden">
              {/* Panel header */}
              <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{selected.full_name}</p>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">{selected.phone}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-600 hover:text-white text-xl leading-none shrink-0 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Email */}
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-gray-600 text-xs mb-1.5">Email</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-green-400 text-sm hover:text-green-300 hover:underline transition-colors break-all flex-1 min-w-0"
                  >
                    {selected.email}
                  </a>
                  <CopyButton text={selected.email} />
                </div>
              </div>

              {/* Car details */}
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider">Car Details</p>
                <DetailRow label="Make" value={selected.car_make} />
                <DetailRow label="Model" value={selected.car_model} />
                <DetailRow label="Year" value={selected.car_year} />
                <DetailRow label="Mileage" value={`${Number(selected.mileage).toLocaleString()} km`} />
                <DetailRow label="Price" value={`€${Number(selected.asking_price).toLocaleString()}`} />
                <DetailRow label="Owners" value={selected.previous_owners} />
              </div>

              {/* Condition */}
              {selected.condition && (
                <div className="px-5 py-3 border-b border-gray-800">
                  <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider">Condition / Notes</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.condition}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-600 text-xs">Status:</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>

                {NEXT[selected.status] && (
                  <button
                    onClick={() => advance(selected)}
                    disabled={advancing}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {advancing ? 'Updating...' : NEXT_LABEL[selected.status]}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  )
}
