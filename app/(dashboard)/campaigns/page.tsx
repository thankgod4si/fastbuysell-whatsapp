'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Campaign } from '@/types'

const STATUS_STYLE: Record<Campaign['status'], string> = {
  draft: 'bg-gray-500/10 text-gray-400 border border-gray-700',
  active: 'bg-green-500/10 text-green-400 border border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}

type FormState = { name: string; subject: string; body: string; reply_to: string }

const EMPTY: FormState = { name: '', subject: '', body: '', reply_to: '' }

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/campaigns')
    setCampaigns(await res.json())
  }

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function create(e: React.BaseSyntheticEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setCreating(false)
    setForm(EMPTY)
    router.push(`/campaigns/${data.id}`)
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create a campaign, add contacts, blast to thousands
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
        >
          + New Campaign
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-white">New Campaign</h2>
              <button onClick={() => setCreating(false)} className="text-gray-600 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={create} className="p-6 flex flex-col gap-4">
              <Field label="Campaign Name" placeholder="e.g. Germany Car Sellers June" value={form.name} onChange={v => set('name', v)} />
              <Field label="Email Subject" placeholder="e.g. We're interested in buying your car" value={form.subject} onChange={v => set('subject', v)} />
              <Field label="Reply-To Email" placeholder="team@yourcompany.com" value={form.reply_to} onChange={v => set('reply_to', v)} type="email" />
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">
                  Email Body
                  <span className="text-gray-600 ml-2 font-normal">use {'{{name}}'} for personalisation</span>
                </label>
                <textarea
                  value={form.body}
                  onChange={e => set('body', e.target.value)}
                  placeholder={`Hello {{name}},\n\nWe came across your listing and would love to discuss...\n\nBest regards,\nThe Team`}
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors resize-none font-mono leading-relaxed"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCreating(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-500 hover:bg-green-400 text-black py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-800 rounded-2xl">
          <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium text-sm">No campaigns yet</p>
          <p className="text-gray-600 text-sm mt-1">Click &quot;New Campaign&quot; to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map(c => (
            <div
              key={c.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-gray-700 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="text-white font-semibold text-sm truncate">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs truncate">{c.subject}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  Reply-to: {c.reply_to} · Created {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => deleteCampaign(c.id)}
                  className="text-gray-700 hover:text-red-400 px-2 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="text-gray-400 text-sm mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
      />
    </div>
  )
}
