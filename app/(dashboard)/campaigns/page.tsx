'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Campaign } from '@/types'

type FormState = { name: string; subject: string; body: string; reply_to: string }
const EMPTY: FormState = { name: '', subject: '', body: '', reply_to: '' }

const STATUS_META: Record<Campaign['status'], { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: '#8E8E93', bg: '#8E8E9312' },
  active:    { label: 'Active',    color: '#34C759', bg: '#34C75912' },
  completed: { label: 'Completed', color: '#007AFF', bg: '#007AFF12' },
}

function ComposeModal({ onClose, onCreate }: { onClose: () => void; onCreate: (id: string) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(f: keyof FormState, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    onCreate(data.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-xl rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <h2 className="font-bold text-[#1C1C1E] text-lg">New Campaign</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:bg-[#E5E5EA] transition-colors text-lg leading-none">×</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Campaign name */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Campaign Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Germany Car Sellers – June" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#AF52DE]/30 transition-all"/>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Subject Line</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} required placeholder="We're interested in buying your car" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#AF52DE]/30 transition-all"/>
          </div>

          {/* Reply-to */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Reply-To Email</label>
            <input type="email" value={form.reply_to} onChange={e => set('reply_to', e.target.value)} required placeholder="team@yourcompany.com" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#AF52DE]/30 transition-all"/>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">Email Body</label>
              <span className="text-[10px] text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-0.5 rounded-full font-mono">{'{{name}}'} for personalisation</span>
            </div>
            <textarea value={form.body} onChange={e => set('body', e.target.value)} required rows={6}
              placeholder={`Hello {{name}},\n\nWe came across your listing and would love to discuss purchasing your vehicle.\n\nBest regards,\nThe Team`}
              className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#AF52DE]/30 transition-all resize-none font-mono leading-relaxed"/>
          </div>

          {error && <p className="text-[#FF3B30] text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-colors"
              style={{ background: 'linear-gradient(135deg,#AF52DE,#5856D6)', boxShadow: '0 4px 12px rgba(175,82,222,0.4)' }}>
              {saving ? 'Creating…' : 'Create Campaign →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Campaign | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    setSelected(null)
    load()
  }

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-6xl" style={{ margin: '-2rem' }}>
      {creating && <ComposeModal onClose={() => setCreating(false)} onCreate={id => { setCreating(false); router.push(`/campaigns/${id}`) }} />}

      {/* Gmail-style top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: '#AF52DE18' }}>✉️</div>
            <div>
              <h1 className="text-[#1C1C1E] font-bold text-sm">Email Campaigns</h1>
              <p className="text-[#8E8E93] text-[11px]">{stats.total} campaigns · {stats.active} active</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            {[{l:'Total',v:stats.total,c:'#AF52DE'},{l:'Active',v:stats.active,c:'#34C759'},{l:'Draft',v:stats.draft,c:'#8E8E93'}].map(s=>(
              <div key={s.l} className="rounded-xl px-3 py-1.5" style={{background:`${s.c}12`}}>
                <span className="font-black text-base tabular-nums" style={{color:s.c}}>{s.v}</span>
                <span className="ml-1.5 font-medium" style={{color:s.c}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg,#AF52DE,#5856D6)', boxShadow: '0 4px 12px rgba(175,82,222,0.35)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Compose
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Campaign inbox list */}
        <div className="w-80 border-r border-black/[0.06] flex flex-col overflow-y-auto" style={{ background: 'rgba(255,255,255,0.7)' }}>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-black/[0.04] rounded-2xl animate-pulse"/>)}</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <span className="text-5xl mb-4">✉️</span>
              <p className="text-[#1C1C1E] font-bold text-sm">No campaigns yet</p>
              <p className="text-[#8E8E93] text-xs mt-1">Hit Compose to create your first</p>
            </div>
          ) : campaigns.map(c => {
            const meta = STATUS_META[c.status]
            const isSelected = selected?.id === c.id
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-4 border-b border-black/[0.04] transition-colors ${isSelected ? 'bg-[#AF52DE]/8' : 'hover:bg-black/[0.02]'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#AF52DE,#5856D6)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-[#1C1C1E] text-sm font-semibold truncate">{c.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    <p className="text-[#8E8E93] text-xs truncate">{c.subject}</p>
                    <p className="text-[#C7C7CC] text-[10px] mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Campaign detail / reading pane */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#F2F2F7' }}>
          {selected ? (
            <div className="max-w-2xl mx-auto py-8 px-6">
              {/* Thread header */}
              <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-[#1C1C1E] font-black text-xl">{selected.subject}</h2>
                    <p className="text-[#8E8E93] text-sm mt-1">{selected.name}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                    style={{ background: STATUS_META[selected.status].bg, color: STATUS_META[selected.status].color }}>
                    {STATUS_META[selected.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8E8E93]">
                  <span>From: <span className="text-[#1C1C1E] font-medium">OutreachHQ</span></span>
                  <span>Reply-to: <span className="text-[#1C1C1E] font-medium">{selected.reply_to}</span></span>
                  <span className="ml-auto">{new Date(selected.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Email body */}
              <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide mb-4">Email Body</p>
                <pre className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap font-sans">{selected.body}</pre>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button onClick={() => router.push(`/campaigns/${selected.id}`)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#AF52DE,#5856D6)', boxShadow: '0 4px 12px rgba(175,82,222,0.3)' }}>
                  Open &amp; Manage →
                </button>
                <button onClick={() => deleteCampaign(selected.id)}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-[#FF3B30] bg-[#FF3B30]/8 hover:bg-[#FF3B30]/15 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(175,82,222,0.1)' }}>✉️</div>
              <div>
                <p className="text-[#1C1C1E] font-bold text-lg">Email Campaigns</p>
                <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Select a campaign to preview it, or compose a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
