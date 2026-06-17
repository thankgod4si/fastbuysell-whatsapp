"use client"

import React, { useEffect, useState } from 'react'

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/triggers')
      .then(r => r.json())
      .then(d => setRules(d || []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auto Rules</h1>
      <p className="mb-4">Create keyword or regex rules that automatically reply to incoming messages or comments.</p>

      <div className="mb-4">
        <a href="/rules/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Create Rule</a>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : rules.length ? (
        <ul className="space-y-3">
          {rules.map(r => (
            <li key={r.id} className="p-3 border rounded">
              <div><strong>Channel:</strong> {r.channel}</div>
              <div><strong>Match:</strong> {r.match_type} — {r.keyword}</div>
              <div><strong>Reply:</strong> {r.reply_template}</div>
              <div className="text-sm text-gray-500">Active: {r.active ? 'Yes' : 'No'}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div>No rules yet.</div>
      )}
    </div>
  )
}
