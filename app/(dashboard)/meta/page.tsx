"use client"

import React, { useEffect, useState } from 'react'

export default function MetaPage() {
  const [linked, setLinked] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/meta/linked')
      .then((r) => r.json())
      .then((d) => setLinked(d || []))
      .catch(() => setLinked([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Meta Connect</h1>
      <p className="mb-4">Connect your Facebook, Instagram, and WhatsApp accounts so the platform can handle comments, DMs, and WhatsApp handoffs.</p>
      <div className="mb-6">
        <a href={`/api/meta/oauth/start?returnTo=/dashboard/meta`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Connect Meta</a>
      </div>

      <h2 className="text-lg font-semibold mb-2">Linked Accounts</h2>
      {loading ? (
        <div>Loading…</div>
      ) : linked.length ? (
        <ul className="space-y-2">
          {linked.map((l) => (
            <li key={l.id} className="p-3 border rounded">
              <div><strong>FB Page:</strong> {l.fb_page_name || l.fb_page_id || '—'}</div>
              <div><strong>Instagram:</strong> {l.ig_username || l.ig_user_id || '—'}</div>
              <div><strong>WhatsApp:</strong> {l.whatsapp_name || l.whatsapp_phone_id || '—'}</div>
              <div><strong>Catalog:</strong> {l.catalog_name ? `${l.catalog_name} (${l.catalog_id})` : (l.catalog_id || 'Not configured')}</div>
              <div className="text-sm text-gray-500">Connected: {new Date(l.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div>No linked accounts yet.</div>
      )}
    </div>
  )
}
