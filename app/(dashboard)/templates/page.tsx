'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FlowField } from '@/lib/whatsapp-flows'

type Channel = 'whatsapp' | 'email' | 'sms'
type Tab     = Channel | 'flows'
type WaStatus = 'draft' | 'pending' | 'approved' | 'rejected'
type FlowStatus = 'draft' | 'published' | 'deprecated'

interface Template {
  id: string
  channel: Channel
  name: string
  category: string
  language: string
  header_text: string | null
  body: string
  footer_text: string | null
  subject: string | null
  wa_template_name: string | null
  wa_status: WaStatus | null
  wa_reject_reason: string | null
  is_default: boolean
  created_at: string
}

interface WaNumber {
  id: string
  phone_number_id: string
  phone_number: string
  display_name: string | null
  verified: boolean
  is_default: boolean
}

interface Flow {
  id: string
  name: string
  screen_title: string
  cta_text: string
  fields: FlowField[]
  meta_flow_id: string | null
  meta_status: FlowStatus
  created_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', bg: '#25D36612' },
  email:    { label: 'Email',    color: '#AF52DE', bg: '#AF52DE12' },
  sms:      { label: 'SMS',      color: '#FF9500', bg: '#FF950012' },
}

const WA_STATUS_META: Record<WaStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',    color: '#8E8E93', bg: '#8E8E9312' },
  pending:  { label: 'Pending',  color: '#FF9500', bg: '#FF950012' },
  approved: { label: 'Approved', color: '#34C759', bg: '#34C75912' },
  rejected: { label: 'Rejected', color: '#FF3B30', bg: '#FF3B3012' },
}

const FLOW_STATUS_META: Record<FlowStatus, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Draft',      color: '#8E8E93', bg: '#8E8E9312' },
  published:  { label: 'Published',  color: '#34C759', bg: '#34C75912' },
  deprecated: { label: 'Deprecated', color: '#FF3B30', bg: '#FF3B3012' },
}

const AVAILABLE_FIELDS: FlowField[] = [
  { key: 'full_name',       label: 'Full Name',        type: 'text',     required: true  },
  { key: 'email',           label: 'Email Address',    type: 'email',    required: false },
  { key: 'car_make',        label: 'Car Make',         type: 'text',     required: false },
  { key: 'car_model',       label: 'Car Model',        type: 'text',     required: false },
  { key: 'car_year',        label: 'Year',             type: 'number',   required: false },
  { key: 'mileage',         label: 'Mileage (km)',     type: 'number',   required: false },
  { key: 'asking_price',    label: 'Asking Price',     type: 'number',   required: false },
  { key: 'condition',       label: 'Condition',        type: 'dropdown', required: false, options: ['Excellent','Good','Fair','Poor','For Parts'] },
  { key: 'previous_owners', label: 'Previous Owners',  type: 'number',   required: false },
  { key: 'notes',           label: 'Additional Notes', type: 'textarea', required: false },
]

const DEFAULT_TEMPLATES: Record<Channel, { name: string; body: string; subject?: string; header_text?: string; footer_text?: string }[]> = {
  whatsapp: [
    {
      name: 'Car Buyer Inquiry',
      body: 'Hi, we are Fast Buy & Sell – we purchase used cars across Europe. Are you interested in a quick, fair offer for your vehicle? Reply YES and we will be in touch within 24 hours. Reply STOP to opt out.',
      footer_text: 'Fast Buy & Sell – Quick car valuations',
    },
    {
      name: 'Follow-Up',
      body: 'Hello, we recently reached out about buying your car. We are still interested and can offer a fast, hassle-free purchase. Reply YES to proceed or STOP to opt out.',
    },
  ],
  email: [
    {
      name: 'Car Purchase Inquiry',
      subject: 'We\'re interested in buying your car',
      body: `Hello {{name}},

We came across your listing for the {{car}} and would love to arrange a viewing.

We offer fast, transparent purchases with same-day payment. No dealers, no waiting.

Would you be available for a call this week?

Best regards,
The Fast Buy & Sell Team`,
    },
  ],
  sms: [
    {
      name: 'Car Buyer Outreach',
      body: 'Hi, this is Fast Buy & Sell – we buy used cars across Europe. Want a quick offer on your vehicle? Reply YES and we\'ll be in touch. Reply STOP to opt out.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Create Template Modal
// ---------------------------------------------------------------------------

function CreateModal({ channel, onClose, onCreated }: { channel: Channel; onClose: () => void; onCreated: () => void }) {
  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('MARKETING')
  const [language, setLanguage]   = useState('en_US')
  const [headerText, setHeaderText] = useState('')
  const [body, setBody]           = useState('')
  const [footerText, setFooterText] = useState('')
  const [subject, setSubject]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function useExample(ex: { name: string; body: string; subject?: string; header_text?: string; footer_text?: string }) {
    setName(ex.name)
    setBody(ex.body)
    if (ex.subject)      setSubject(ex.subject)
    if (ex.header_text)  setHeaderText(ex.header_text)
    if (ex.footer_text)  setFooterText(ex.footer_text)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, name, category, language, header_text: headerText || null, body, footer_text: footerText || null, subject: subject || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    onCreated()
  }

  const ch = CHANNEL_META[channel]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-xl rounded-3xl overflow-hidden my-4"
        style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl" style={{ background: ch.bg, color: ch.color }}>{ch.label}</span>
            <h2 className="font-bold text-[#1C1C1E]">New Template</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:bg-[#E5E5EA] text-lg">×</button>
        </div>

        {DEFAULT_TEMPLATES[channel].length > 0 && (
          <div className="px-6 pt-4">
            <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Start from example</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TEMPLATES[channel].map(ex => (
                <button key={ex.name} onClick={() => useExample(ex)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-black/[0.08] text-[#3C3C43] hover:bg-[#F2F2F7] transition-colors">
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="Car Buyer Inquiry" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
          </div>

          {channel === 'whatsapp' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] outline-none">
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] outline-none">
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="nl">Dutch</option>
                  <option value="it">Italian</option>
                  <option value="pl">Polish</option>
                </select>
              </div>
            </div>
          )}

          {channel === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Subject Line</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} required={channel === 'email'}
                placeholder="We're interested in buying your car" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
            </div>
          )}

          {channel === 'whatsapp' && (
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Header Text <span className="text-[#C7C7CC] font-normal normal-case">(optional)</span></label>
              <input value={headerText} onChange={e => setHeaderText(e.target.value)}
                placeholder="Fast Buy & Sell" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">Message Body</label>
              {channel !== 'sms' && (
                <span className="text-[10px] text-[#007AFF] bg-[#007AFF]/8 px-2 py-0.5 rounded-full font-mono">
                  {'{{name}}'} {'{{car}}'} for personalisation
                </span>
              )}
              {channel === 'sms' && (
                <span className="text-[10px] text-[#8E8E93]">{body.length} / 160 chars</span>
              )}
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value)} required rows={channel === 'email' ? 8 : 5}
              placeholder={channel === 'email' ? 'Hello {{name}},\n\nWe came across your listing...' : 'Hi, we are Fast Buy & Sell...'}
              className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25 resize-none leading-relaxed"/>
          </div>

          {channel === 'whatsapp' && (
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Footer Text <span className="text-[#C7C7CC] font-normal normal-case">(optional)</span></label>
              <input value={footerText} onChange={e => setFooterText(e.target.value)}
                placeholder="Reply STOP to opt out" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
            </div>
          )}

          {channel === 'whatsapp' && (
            <div className="rounded-2xl bg-[#FF9500]/8 border border-[#FF9500]/20 px-4 py-3 text-xs text-[#8E8E93] leading-relaxed">
              <span className="font-semibold text-[#FF9500]">Meta approval required.</span> After saving, submit the template to Meta. Approval usually takes a few minutes for utility templates and up to 24h for marketing templates.
            </div>
          )}

          {error && <p className="text-[#FF3B30] text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: ch.color, boxShadow: `0 4px 12px ${ch.color}35` }}>
              {saving ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({ tpl, onDelete, onSetDefault, onSubmit, onRefreshStatus }: {
  tpl: Template
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  onSubmit: (id: string) => void
  onRefreshStatus: (id: string) => void
}) {
  const ch  = CHANNEL_META[tpl.channel]
  const ws  = tpl.wa_status ? WA_STATUS_META[tpl.wa_status] : null
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    await onSubmit(tpl.id)
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[#1C1C1E] font-bold text-sm">{tpl.name}</p>
            {tpl.is_default && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">Default</span>
            )}
          </div>
          {tpl.subject && <p className="text-[#8E8E93] text-xs mt-0.5 truncate">Subject: {tpl.subject}</p>}
          {tpl.category && tpl.channel === 'whatsapp' && (
            <p className="text-[#8E8E93] text-[10px] mt-0.5 uppercase tracking-wide">{tpl.category} · {tpl.language}</p>
          )}
        </div>
        {ws && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0" style={{ background: ws.bg, color: ws.color }}>
            {ws.label}
          </span>
        )}
      </div>

      {tpl.header_text && <p className="text-[#1C1C1E] text-xs font-semibold mb-1">{tpl.header_text}</p>}

      <div className="rounded-2xl bg-[#F2F2F7] px-4 py-3 mb-3">
        <p className="text-[#3C3C43] text-xs leading-relaxed line-clamp-3">{tpl.body}</p>
      </div>

      {tpl.footer_text && <p className="text-[#C7C7CC] text-[11px] mb-3 italic">{tpl.footer_text}</p>}
      {tpl.wa_template_name && <p className="text-[#C7C7CC] text-[10px] font-mono mb-3">{tpl.wa_template_name}</p>}

      {tpl.wa_status === 'rejected' && tpl.wa_reject_reason && (
        <div className="rounded-xl bg-[#FF3B30]/8 px-3 py-2 mb-3">
          <p className="text-[#FF3B30] text-xs">{tpl.wa_reject_reason}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {tpl.channel === 'whatsapp' && (tpl.wa_status === 'draft' || tpl.wa_status === 'rejected') && (
          <button onClick={handleSubmit} disabled={submitting}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-white disabled:opacity-50"
            style={{ background: ch.color }}>
            {submitting ? 'Submitting…' : 'Submit to Meta'}
          </button>
        )}
        {tpl.channel === 'whatsapp' && tpl.wa_status === 'pending' && (
          <button onClick={() => onRefreshStatus(tpl.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: '#FF950012', color: '#FF9500' }}>
            Refresh Status
          </button>
        )}
        {!tpl.is_default && (
          <button onClick={() => onSetDefault(tpl.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA] transition-colors">
            Set Default
          </button>
        )}
        <button onClick={() => onDelete(tpl.id)}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl text-[#FF3B30] bg-[#FF3B30]/8 hover:bg-[#FF3B30]/15 transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WA Numbers Panel
// ---------------------------------------------------------------------------

function WaNumbersPanel({ numbers, onSetDefault }: { numbers: WaNumber[]; onSetDefault: (id: string) => void }) {
  if (numbers.length === 0) return null
  return (
    <div className="bg-white rounded-3xl p-5 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#1C1C1E] font-bold text-sm">Registered Numbers</p>
        <a href="/settings" className="text-xs font-semibold" style={{ color: '#007AFF' }}>Add number →</a>
      </div>
      <div className="space-y-2">
        {numbers.map(n => (
          <div key={n.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F2F2F7]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
              {(n.display_name || n.phone_number).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1C1C1E] text-sm font-semibold">{n.display_name || 'Unnamed'}</p>
              <p className="text-[#8E8E93] text-xs font-mono">{n.phone_number}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.verified
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759]">Verified</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500]">Unverified</span>
              }
              {n.is_default
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">Default</span>
                : (
                  <button onClick={() => onSetDefault(n.id)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:bg-[#E5E5EA] border border-black/[0.06]">
                    Set default
                  </button>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Flow Modal
// ---------------------------------------------------------------------------

function CreateFlowModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]             = useState('')
  const [screenTitle, setScreenTitle] = useState('Your Vehicle Details')
  const [ctaText, setCtaText]       = useState('Submit Details')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(['full_name', 'car_make', 'car_model', 'car_year', 'asking_price']))
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  function toggleField(key: string) {
    if (key === 'full_name') return // always required
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const fields = AVAILABLE_FIELDS.filter(f => selectedKeys.has(f.key))
    const res = await fetch('/api/whatsapp/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, screen_title: screenTitle, cta_text: ctaText, fields }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-xl rounded-3xl overflow-hidden my-4"
        style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#007AFF]/10 text-[#007AFF]">Flow</span>
            <h2 className="font-bold text-[#1C1C1E]">New Lead Flow</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:bg-[#E5E5EA] text-lg">×</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Flow Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="Vehicle Lead Form" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Screen Title</label>
              <input value={screenTitle} onChange={e => setScreenTitle(e.target.value)} required
                placeholder="Your Vehicle Details" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Submit Button</label>
              <input value={ctaText} onChange={e => setCtaText(e.target.value)} required
                placeholder="Submit Details" className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">Fields to Collect</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_FIELDS.map(f => {
                const checked = selectedKeys.has(f.key)
                const locked  = f.key === 'full_name'
                return (
                  <button key={f.key} type="button" onClick={() => toggleField(f.key)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all"
                    style={checked
                      ? { background: '#007AFF', boxShadow: '0 2px 8px rgba(0,122,255,0.25)' }
                      : { background: '#F2F2F7' }
                    }>
                    <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0"
                      style={checked ? { background: 'rgba(255,255,255,0.25)' } : { background: 'white', border: '1.5px solid #C7C7CC' }}>
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: checked ? 'white' : '#3C3C43' }}>
                      {f.label}
                      {locked && <span className="ml-1 opacity-60 text-[10px]">(required)</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#007AFF]/8 border border-[#007AFF]/15 px-4 py-3 text-xs text-[#3C3C43] leading-relaxed">
            <span className="font-semibold text-[#007AFF]">How it works:</span> Save the flow, then click <strong>Publish to Meta</strong>. Once published, it automatically attaches when contacts reply INTERESTED to your WhatsApp templates.
          </div>

          {error && <p className="text-[#FF3B30] text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#007AFF', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>
              {saving ? 'Saving…' : 'Save Flow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flow Card
// ---------------------------------------------------------------------------

function FlowCard({ flow, onDelete, onPublish }: {
  flow: Flow
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}) {
  const sm = FLOW_STATUS_META[flow.meta_status]
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')

  async function handlePublish() {
    setPublishing(true)
    setPublishError('')
    const res = await fetch(`/api/whatsapp/flows/${flow.id}`, { method: 'POST' })
    const data = await res.json()
    setPublishing(false)
    if (!res.ok || !data.published) {
      setPublishError(data.error ?? data.publish_error ?? 'Publish failed')
      return
    }
    onPublish(flow.id)
  }

  return (
    <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[#1C1C1E] font-bold text-sm">{flow.name}</p>
          <p className="text-[#8E8E93] text-xs mt-0.5">Screen: {flow.screen_title} · Button: {flow.cta_text}</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0" style={{ background: sm.bg, color: sm.color }}>
          {sm.label}
        </span>
      </div>

      {/* Fields preview */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {flow.fields.map(f => (
          <span key={f.key} className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#F2F2F7] text-[#3C3C43]">
            {f.label}
          </span>
        ))}
      </div>

      {flow.meta_flow_id && (
        <p className="text-[#C7C7CC] text-[10px] font-mono mb-3">Meta ID: {flow.meta_flow_id}</p>
      )}

      {publishError && (
        <div className="rounded-xl bg-[#FF3B30]/8 px-3 py-2 mb-3">
          <p className="text-[#FF3B30] text-xs">{publishError}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {flow.meta_status === 'draft' && (
          <button onClick={handlePublish} disabled={publishing}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-white disabled:opacity-50"
            style={{ background: '#007AFF', boxShadow: '0 2px 8px rgba(0,122,255,0.25)' }}>
            {publishing ? 'Publishing…' : 'Publish to Meta'}
          </button>
        )}
        {flow.meta_status === 'published' && (
          <span className="text-xs text-[#34C759] font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Live — auto-attached on INTERESTED
          </span>
        )}
        <button onClick={() => onDelete(flow.id)}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl text-[#FF3B30] bg-[#FF3B30]/8 hover:bg-[#FF3B30]/15 transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flows Tab
// ---------------------------------------------------------------------------

function FlowsTab({ flows, loading, onDelete, onPublish, onCreateNew }: {
  flows: Flow[]
  loading: boolean
  onDelete: (id: string) => void
  onPublish: (id: string) => void
  onCreateNew: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-3xl animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}/>)}
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[#007AFF]/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/><path d="M12 11v6"/><path d="M9 14h6"/>
          </svg>
        </div>
        <p className="text-[#1C1C1E] font-bold">No flows yet</p>
        <p className="text-[#8E8E93] text-sm mt-1 max-w-xs">Create a flow to collect lead details — car make, model, price and more — directly in WhatsApp</p>
        <button onClick={onCreateNew} className="mt-4 text-sm font-bold px-5 py-2.5 rounded-2xl text-white"
          style={{ background: '#007AFF', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>
          Create First Flow
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {flows.map(f => (
        <FlowCard key={f.id} flow={f} onDelete={onDelete} onPublish={onPublish} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const [tab, setTab]             = useState<Tab>('whatsapp')
  const [templates, setTemplates] = useState<Template[]>([])
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([])
  const [flows, setFlows]         = useState<Flow[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [tplRes, numRes, flowRes] = await Promise.all([
      fetch('/api/templates'),
      fetch('/api/whatsapp/numbers'),
      fetch('/api/whatsapp/flows'),
    ])
    const [tpls, nums, fls] = await Promise.all([tplRes.json(), numRes.json(), flowRes.json()])
    setTemplates(Array.isArray(tpls) ? tpls : [])
    setWaNumbers(Array.isArray(nums) ? nums : [])
    setFlows(Array.isArray(fls) ? fls : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    setTemplates(t => t.filter(x => x.id !== id))
  }

  async function setDefault(id: string) {
    await fetch(`/api/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    load()
  }

  async function submitToMeta(id: string) {
    const res = await fetch(`/api/templates/${id}/submit`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) alert(data.error)
    load()
  }

  async function refreshStatus(id: string) {
    await fetch(`/api/templates/${id}`)
    load()
  }

  async function setDefaultNumber(id: string) {
    await fetch('/api/whatsapp/numbers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_default: true }),
    })
    load()
  }

  async function deleteFlow(id: string) {
    if (!confirm('Delete this flow?')) return
    await fetch(`/api/whatsapp/flows/${id}`, { method: 'DELETE' })
    setFlows(f => f.filter(x => x.id !== id))
  }

  const isFlowsTab  = tab === 'flows'
  const channel     = isFlowsTab ? 'whatsapp' : tab as Channel
  const visible     = templates.filter(t => t.channel === channel)
  const ch          = CHANNEL_META[channel]

  return (
    <div className="max-w-3xl space-y-6">
      {creating && !isFlowsTab && (
        <CreateModal channel={channel} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      )}
      {creating && isFlowsTab && (
        <CreateFlowModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Templates</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">Create and manage your outreach templates and lead flows</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl text-white"
          style={{ background: isFlowsTab ? '#007AFF' : ch.color, boxShadow: `0 4px 12px ${isFlowsTab ? 'rgba(0,122,255,0.3)' : ch.color + '35'}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {isFlowsTab ? 'New Flow' : 'New Template'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {(Object.keys(CHANNEL_META) as Channel[]).map(c => {
          const m     = CHANNEL_META[c]
          const count = templates.filter(t => t.channel === c).length
          return (
            <button key={c} onClick={() => setTab(c)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === c ? { background: m.bg, color: m.color } : { color: '#8E8E93' }}>
              {m.label}
              <span className="text-[11px] font-black tabular-nums px-1.5 py-0.5 rounded-full"
                style={tab === c ? { background: m.color, color: 'white' } : { background: '#F2F2F7', color: '#8E8E93' }}>
                {count}
              </span>
            </button>
          )
        })}
        <button onClick={() => setTab('flows')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={tab === 'flows' ? { background: '#007AFF14', color: '#007AFF' } : { color: '#8E8E93' }}>
          Flows
          <span className="text-[11px] font-black tabular-nums px-1.5 py-0.5 rounded-full"
            style={tab === 'flows' ? { background: '#007AFF', color: 'white' } : { background: '#F2F2F7', color: '#8E8E93' }}>
            {flows.length}
          </span>
        </button>
      </div>

      {/* WA Numbers panel — only on WhatsApp tab */}
      {tab === 'whatsapp' && (
        <WaNumbersPanel numbers={waNumbers} onSetDefault={setDefaultNumber} />
      )}

      {/* Flows tab */}
      {isFlowsTab ? (
        <FlowsTab
          flows={flows}
          loading={loading}
          onDelete={deleteFlow}
          onPublish={() => load()}
          onCreateNew={() => setCreating(true)}
        />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-44 bg-white rounded-3xl animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}/>)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: ch.bg }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ch.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
            </svg>
          </div>
          <p className="text-[#1C1C1E] font-bold">No {ch.label} templates yet</p>
          <p className="text-[#8E8E93] text-sm mt-1">Create one or start from an example</p>
          <button onClick={() => setCreating(true)} className="mt-4 text-sm font-bold px-5 py-2.5 rounded-2xl text-white"
            style={{ background: ch.color }}>
            Create First Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(tpl => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onDelete={deleteTemplate}
              onSetDefault={setDefault}
              onSubmit={submitToMeta}
              onRefreshStatus={refreshStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
