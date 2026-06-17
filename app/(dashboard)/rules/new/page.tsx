"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRulePage() {
  const router = useRouter()
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [channel, setChannel] = useState('any')
  const [matchType, setMatchType] = useState('contains')
  const [keyword, setKeyword] = useState('')
  const [replyTemplate, setReplyTemplate] = useState('Thanks, I will get back to you shortly.')
  const [active, setActive] = useState(true)
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/meta/linked')
      .then(r => r.json())
      .then(data => setLinkedAccounts(Array.isArray(data) ? data : []))
      .catch(() => setLinkedAccounts([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      channel,
      match_type: matchType,
      keyword,
      reply_template: replyTemplate,
      active,
      linked_account_id: linkedAccountId || undefined,
    }

    const res = await fetch('/api/triggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || 'Unable to save rule')
      setSubmitting(false)
      return
    }

    router.push('/rules')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Auto Rule</h1>
      <p className="mb-6 text-sm text-[#6B7280]">Create a rule to auto-respond to incoming WhatsApp, Instagram, or Facebook messages and comments.</p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#111827]">Channel</span>
            <select value={channel} onChange={e => setChannel(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm">
              <option value="any">Any</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#111827]">Match type</span>
            <select value={matchType} onChange={e => setMatchType(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm">
              <option value="contains">Contains</option>
              <option value="exact">Exact</option>
              <option value="regex">Regex</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#111827]">Keyword or phrase</span>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. price, stock, info"
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#111827]">Reply template</span>
          <textarea value={replyTemplate} onChange={e => setReplyTemplate(e.target.value)} rows={4}
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm" />
          <p className="text-xs text-[#6B7280] mt-2">Use a message that sounds natural, like “Thanks for reaching out! I’ll get back to you soon.”</p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#111827]">Apply to connected account</span>
          <select value={linkedAccountId ?? ''} onChange={e => setLinkedAccountId(e.target.value || null)}
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm" disabled={loading}>
            <option value="">All connected accounts</option>
            {linkedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.fb_page_name ? `${account.fb_page_name} (FB)` : account.ig_username ? `@${account.ig_username}` : account.whatsapp_name || account.whatsapp_phone_id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 rounded border-[#D1D5DB] text-blue-600" />
          <span className="text-sm text-[#111827]">Active immediately</span>
        </label>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save rule'}
          </button>
          <button type="button" onClick={() => router.push('/rules')}
            className="text-sm text-[#6B7280] hover:text-[#111827]">Cancel</button>
        </div>
      </form>
    </div>
  )
}
