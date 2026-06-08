'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Lead } from '@/types'

const STATUS_CONFIG: Record<Lead['status'], { label: string; color: string; bg: string; next: Lead['status'] | null; nextLabel: string }> = {
  new:       { label: 'New',       color: '#007AFF', bg: '#007AFF12', next: 'contacted', nextLabel: 'Mark Contacted' },
  contacted: { label: 'Contacted', color: '#FF9500', bg: '#FF950012', next: 'closed',    nextLabel: 'Mark Closed' },
  closed:    { label: 'Closed',    color: '#34C759', bg: '#34C75912', next: null,         nextLabel: '' },
}

const SOURCE_ICON: Record<Lead['source'], string> = { whatsapp: '💬', sms: '📱', email: '✉️' }

function LeadCard({ lead, onAdvance, onSelect }: { lead: Lead; onAdvance: (id: string, status: Lead['status']) => void; onSelect: (l: Lead) => void }) {
  const cfg = STATUS_CONFIG[lead.status]
  return (
    <div
      onClick={() => onSelect(lead)}
      className="bg-white rounded-3xl p-5 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>
            {lead.full_name ? lead.full_name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-[#1C1C1E] font-bold text-sm leading-tight">{lead.full_name || 'Unknown'}</p>
            <p className="text-[#8E8E93] text-xs font-mono mt-0.5">{lead.phone}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-xl shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* Car info */}
      {(lead.car_make || lead.car_model) && (
        <div className="rounded-2xl p-3 mb-3" style={{ background: '#F2F2F7' }}>
          <p className="text-[#1C1C1E] text-sm font-semibold">
            {[lead.car_year, lead.car_make, lead.car_model].filter(Boolean).join(' ')}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {lead.mileage && <span className="text-[#8E8E93] text-xs">{lead.mileage} km</span>}
            {lead.asking_price && <span className="text-[#8E8E93] text-xs">€{lead.asking_price}</span>}
            {lead.condition && <span className="text-[#8E8E93] text-xs capitalize">{lead.condition}</span>}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
          <span>{SOURCE_ICON[lead.source]}</span>
          <span>via {lead.source}</span>
          <span>·</span>
          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
        </div>
        {cfg.next && (
          <button
            onClick={e => { e.stopPropagation(); onAdvance(lead.id, cfg.next!) }}
            className="text-[10px] font-bold px-2.5 py-1 rounded-xl"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function LeadDrawer({ lead, onClose, onAdvance }: { lead: Lead; onClose: () => void; onAdvance: (id: string, status: Lead['status']) => void }) {
  const cfg = STATUS_CONFIG[lead.status]
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose} style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}>
      <div className="ml-auto w-full max-w-sm h-full overflow-y-auto"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <h2 className="font-bold text-[#1C1C1E]">Lead Detail</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] text-lg hover:bg-[#E5E5EA] transition-colors">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Person */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
              style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>
              {lead.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-[#1C1C1E] font-black text-lg">{lead.full_name || 'Unknown'}</p>
              <p className="text-[#8E8E93] text-sm font-mono">{lead.phone}</p>
              {lead.email && <p className="text-[#8E8E93] text-xs">{lead.email}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-2xl p-4" style={{ background: cfg.bg }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">Status</p>
                <p className="font-bold text-sm mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
              {cfg.next && (
                <button onClick={() => { onAdvance(lead.id, cfg.next!); onClose() }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: cfg.color }}>
                  {cfg.nextLabel}
                </button>
              )}
            </div>
          </div>

          {/* Car details */}
          {(lead.car_make || lead.car_model || lead.car_year) && (
            <div>
              <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Vehicle</p>
              <div className="rounded-2xl p-4 space-y-2" style={{ background: '#F2F2F7' }}>
                <Row label="Make" value={lead.car_make} />
                <Row label="Model" value={lead.car_model} />
                <Row label="Year" value={lead.car_year} />
                <Row label="Mileage" value={lead.mileage ? `${lead.mileage} km` : ''} />
                <Row label="Asking Price" value={lead.asking_price ? `€${lead.asking_price}` : ''} />
                <Row label="Owners" value={lead.previous_owners} />
                <Row label="Condition" value={lead.condition || ''} />
              </div>
            </div>
          )}

          {/* Meta */}
          <div>
            <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Activity</p>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: '#F2F2F7' }}>
              <Row label="Source" value={`${SOURCE_ICON[lead.source]} ${lead.source}`} />
              <Row label="Added" value={new Date(lead.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} />
              {lead.email_sent_at && <Row label="Email sent" value={new Date(lead.email_sent_at).toLocaleString()} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-[#8E8E93]">{label}</span>
      <span className="text-xs font-semibold text-[#1C1C1E] text-right">{value}</span>
    </div>
  )
}

const COLUMNS: Lead['status'][] = ['new', 'contacted', 'closed']

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<Lead['status'] | 'all'>('all')

  const load = useCallback(async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function advance(id: string, status: Lead['status']) {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  const byStatus = (s: Lead['status']) => leads.filter(l => l.status === s)
  const displayed = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const stats = {
    total: leads.length,
    new: byStatus('new').length,
    contacted: byStatus('contacted').length,
    closed: byStatus('closed').length,
  }

  return (
    <div className="max-w-5xl space-y-6">
      {selected && <LeadDrawer lead={selected} onClose={() => setSelected(null)} onAdvance={(id, s) => { advance(id, s); setSelected(null) }} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Leads &amp; CRM</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">Manage your car seller pipeline</p>
        </div>
        <div className="flex gap-2">
          {([
            { s: 'all'       as const, l: 'All',       v: stats.total,     c: '#007AFF' },
            { s: 'new'       as const, l: 'New',        v: stats.new,       c: '#007AFF' },
            { s: 'contacted' as const, l: 'Contacted',  v: stats.contacted, c: '#FF9500' },
            { s: 'closed'    as const, l: 'Closed',     v: stats.closed,    c: '#34C759' },
          ] as const).map(f => (
            <button key={f.s} onClick={() => setFilter(f.s)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all"
              style={{ background: filter === f.s ? `${f.c}18` : '#F2F2F7', color: filter === f.s ? f.c : '#8E8E93' }}>
              <span className="font-black tabular-nums">{f.v}</span> {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban / grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/80 rounded-3xl animate-pulse"/>)}
        </div>
      ) : filter === 'all' ? (
        /* Kanban board when viewing all */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const cfg = STATUS_CONFIG[col]
            const items = byStatus(col)
            return (
              <div key={col}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }}/>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</p>
                  <span className="ml-auto text-xs text-[#8E8E93] font-semibold">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-black/[0.06] p-8 text-center">
                      <p className="text-[#C7C7CC] text-xs">No {cfg.label.toLowerCase()} leads</p>
                    </div>
                  ) : items.map(l => (
                    <LeadCard key={l.id} lead={l} onAdvance={advance} onSelect={setSelected} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Filtered list */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.length === 0 ? (
            <div className="md:col-span-2 flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🎯</span>
              <p className="text-[#1C1C1E] font-bold">No leads yet</p>
              <p className="text-[#8E8E93] text-sm mt-1">Leads are created when contacts reply with car details</p>
            </div>
          ) : displayed.map(l => (
            <LeadCard key={l.id} lead={l} onAdvance={advance} onSelect={setSelected} />
          ))}
        </div>
      )}
    </div>
  )
}
