'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CommentTrigger } from '@/types'

const DEFAULT_REPLY = 'Thanks for commenting! Here is your link: {{link}}'

export default function CommentsPage() {
  const [triggers, setTriggers] = useState<CommentTrigger[]>([])
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram')
  const [pageId, setPageId] = useState('')
  const [postId, setPostId] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [replyTemplate, setReplyTemplate] = useState(DEFAULT_REPLY)
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/comment-triggers')
    const data = await res.json()
    setTriggers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setSavedId(null)
    setPlatform('instagram')
    setPageId('')
    setPostId('')
    setLinkUrl('')
    setReplyTemplate(DEFAULT_REPLY)
    setActive(true)
    setError('')
  }

  async function saveTrigger() {
    if (!linkUrl.trim()) {
      setError('Link URL is required.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/comment-triggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: savedId,
        platform,
        page_id: pageId.trim() || null,
        post_id: postId.trim() || null,
        link_url: linkUrl.trim(),
        reply_template: replyTemplate.trim() || DEFAULT_REPLY,
        active,
      }),
    })

    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error || 'Unable to save trigger')
      return
    }

    resetForm()
    load()
  }

  async function editTrigger(trigger: CommentTrigger) {
    setSavedId(trigger.id)
    setPlatform(trigger.platform)
    setPageId(trigger.page_id || '')
    setPostId(trigger.post_id || '')
    setLinkUrl(trigger.link_url)
    setReplyTemplate(trigger.reply_template)
    setActive(trigger.active)
    setError('')
  }

  async function deleteTrigger(id: string) {
    const res = await fetch('/api/comment-triggers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    if (res.ok) load()
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Comment Automation</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">Automatically reply to new comments on your connected Facebook and Instagram pages.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr,1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-semibold text-[#1C1C1E] mb-4">Configure a trigger</p>

          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-wide text-[#8E8E93] font-semibold">Platform</label>
            <div className="flex gap-2">
              {(['instagram', 'facebook'] as const).map(value => (
                <button key={value} type="button" onClick={() => setPlatform(value)}
                  className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${platform === value ? 'bg-[#5856D6] text-white' : 'bg-[#F2F2F7] text-[#1C1C1E]'}`}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>

            <p className="text-sm text-[#6B7280]">Automatic comment replies work for all linked Facebook and Instagram pages, with no post ID required.</p>
            <label className="block text-xs uppercase tracking-wide text-[#8E8E93] font-semibold">Reply link</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://nestuge.com/your-link" className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm text-[#1C1C1E] outline-none" />

            <label className="block text-xs uppercase tracking-wide text-[#8E8E93] font-semibold">Reply template</label>
            <textarea value={replyTemplate} onChange={e => setReplyTemplate(e.target.value)} rows={4} className="w-full rounded-3xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm text-[#1C1C1E] outline-none" />
            <p className="text-[#8E8E93] text-xs">Use <code className="rounded px-1 bg-[#F2F2F7]">{"{{link}}"}</code> to inject your stored URL.</p>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[#1C1C1E]">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 rounded border-[#E5E5EA] text-[#5856D6] focus:ring-[#5856D6]" />
                Active
              </label>
              <button onClick={saveTrigger} disabled={saving} className="rounded-2xl bg-[#5856D6] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? 'Saving…' : savedId ? 'Update trigger' : 'Save trigger'}
              </button>
              <button type="button" onClick={resetForm} className="text-sm text-[#5856D6]">Reset</button>
            </div>
            {error && <p className="text-sm text-[#FF3B30]">{error}</p>}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#1C1C1E]">Triggers</p>
            <p className="text-xs text-[#8E8E93]">{triggers.length} saved</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-3xl bg-[#F2F2F7] animate-pulse" />)}
            </div>
          ) : triggers.length === 0 ? (
            <div className="text-center py-12 text-[#8E8E93] text-sm">No comment triggers yet. Add one to automatically reply with your Nestuge link.</div>
          ) : (
            <div className="space-y-3">
              {triggers.map(trigger => {
                const label = trigger.post_id ? trigger.post_id : trigger.page_id ? trigger.page_id : 'All comments'
                return (
                  <div key={trigger.id} className="rounded-3xl border border-[#E5E5EA] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1C1C1E] truncate">{trigger.platform.toUpperCase()} · {label}</p>
                        <p className="text-xs text-[#8E8E93] mt-1">Link: {trigger.link_url}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editTrigger(trigger)} className="rounded-2xl border border-[#5856D6] px-3 py-2 text-xs font-semibold text-[#5856D6]">Edit</button>
                        <button onClick={() => deleteTrigger(trigger.id)} className="rounded-2xl border border-[#FF3B30] px-3 py-2 text-xs font-semibold text-[#FF3B30]">Delete</button>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-[#F9F9FB] px-4 py-3 text-sm text-[#1C1C1E] whitespace-pre-wrap break-words">{trigger.reply_template}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
