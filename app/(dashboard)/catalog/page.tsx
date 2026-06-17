'use client'

import { useEffect, useState, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  image_url: string | null
  category: string | null
  duration_mins: number | null
  is_available: boolean
  is_popular: boolean
  sort_order: number
}

const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP']
const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }

const EMPTY_FORM = { name: '', description: '', price: '', currency: 'NGN', image_url: '', category: '', duration_mins: '', is_popular: false }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const [products,      setProducts]      = useState<Product[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editId,        setEditId]        = useState<string | null>(null)
  const [form,          setForm]          = useState({ ...EMPTY_FORM })
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [flowStatus,    setFlowStatus]    = useState<'idle' | 'building' | 'done' | 'error'>('idle')
  const [flowMsg,       setFlowMsg]       = useState('')
  const [imgUploading,  setImgUploading]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Image upload via Supabase Storage ──────────────────────────────────────
  async function handleImageFile(file: File) {
    setImgUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `products/${Date.now()}.${ext}`
      const { data: uploadData, error } = await supabaseBrowser.storage.from('product-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabaseBrowser.storage.from('product-images').getPublicUrl(uploadData.path)
      setForm(f => ({ ...f, image_url: publicUrl }))
    } catch {
      // Storage bucket not configured — user can paste URL manually
      alert('Image upload failed. Please paste an image URL instead.')
    } finally {
      setImgUploading(false)
    }
  }

  // ── Save product ────────────────────────────────────────────────────────────
  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const body = {
      ...(editId ? { id: editId } : {}),
      name:         form.name.trim(),
      description:  form.description.trim() || null,
      price:        Number(form.price) || 0,
      currency:     form.currency,
      image_url:    form.image_url.trim() || null,
      category:     form.category.trim() || null,
      duration_mins: form.duration_mins ? Number(form.duration_mins) : null,
      is_popular:   form.is_popular,
    }
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch('/api/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setShowForm(false)
      setEditId(null)
      setForm({ ...EMPTY_FORM })
      await load()
    }
    setSaving(false)
  }

  function startEdit(p: Product) {
    setForm({
      name: p.name, description: p.description ?? '', price: String(p.price),
      currency: p.currency, image_url: p.image_url ?? '', category: p.category ?? '',
      duration_mins: p.duration_mins ? String(p.duration_mins) : '', is_popular: p.is_popular,
    })
    setEditId(p.id)
    setShowForm(true)
  }

  async function toggleAvailable(p: Product) {
    await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, is_available: !p.is_available }) })
    await load()
  }

  async function del(id: string) {
    setDeleting(id)
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  // ── Build booking flow ──────────────────────────────────────────────────────
  async function buildFlow() {
    setFlowStatus('building')
    setFlowMsg('')
    const res = await fetch('/api/booking-flow', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setFlowStatus('done')
      setFlowMsg(`Booking flow published! Flow ID: ${data.metaFlowId}`)
    } else {
      setFlowStatus('error')
      setFlowMsg(data.error ?? 'Unknown error')
    }
  }

  const available = products.filter(p => p.is_available)

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Products & Services</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">
            Add what your business offers — the AI booking assistant and WhatsApp flow pull from this list.
          </p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true) }}
          className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
          + Add Item
        </button>
      </div>

      {/* Booking flow status banner */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex items-center gap-4"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: flowStatus === 'done' ? '#34C759' : flowStatus === 'error' ? '#FF3B30' : 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1C1C1E]">WhatsApp Booking Flow</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {flowStatus === 'done'   ? flowMsg :
             flowStatus === 'error'  ? `Error: ${flowMsg}` :
             flowStatus === 'building' ? 'Publishing to Meta...' :
             `${available.length} item${available.length !== 1 ? 's' : ''} available · Click to publish the booking form customers see in WhatsApp`}
          </p>
        </div>
        <button onClick={buildFlow} disabled={flowStatus === 'building' || available.length === 0}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
          style={{ background: '#007AFF' }}>
          {flowStatus === 'building' ? 'Publishing…' : flowStatus === 'done' ? '↻ Republish' : 'Publish Flow'}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#1C1C1E] text-sm">{editId ? 'Edit Item' : 'New Item'}</h2>
            <button onClick={() => setShowForm(false)} className="text-[#C7C7CC] hover:text-[#8E8E93] text-xl leading-none">×</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Image */}
            <div className="sm:col-span-2 flex items-start gap-4">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E5E7EB]" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0 text-[#C7C7CC] text-2xl">🖼</div>
              )}
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-[#6B7280]">Image</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="Paste image URL…"
                  className="w-full text-sm border border-[#E5E7EB] rounded-xl px-3 py-2 outline-none focus:border-[#8B5CF6]" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E8E93]">or</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
                  <button onClick={() => fileRef.current?.click()} disabled={imgUploading}
                    className="text-xs font-semibold text-[#007AFF] hover:underline disabled:opacity-50">
                    {imgUploading ? 'Uploading…' : 'Upload file'}
                  </button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#6B7280]">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Signature Blowout"
                className="mt-1 w-full text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6]" />
            </div>

            {/* Price + Currency */}
            <div>
              <label className="text-xs font-semibold text-[#6B7280]">Price</label>
              <div className="mt-1 flex gap-2">
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6] bg-white">
                  {CURRENCIES.map(c => <option key={c} value={c}>{SYM[c]} {c}</option>)}
                </select>
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  type="number" min="0" placeholder="0"
                  className="flex-1 text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6]" />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-[#6B7280]">Duration (mins) <span className="font-normal text-[#C7C7CC]">optional</span></label>
              <input value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))}
                type="number" min="0" placeholder="e.g. 60"
                className="mt-1 w-full text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6]" />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-[#6B7280]">Category <span className="font-normal text-[#C7C7CC]">optional</span></label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Hair, Nails, Skin"
                className="mt-1 w-full text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6]" />
            </div>

            {/* Popular toggle */}
            <div className="flex items-center gap-3 pt-5">
              <button onClick={() => setForm(f => ({ ...f, is_popular: !f.is_popular }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.is_popular ? 'bg-[#8B5CF6]' : 'bg-[#E5E7EB]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_popular ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-[#1C1C1E]">Mark as popular ⭐</span>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#6B7280]">Description <span className="font-normal text-[#C7C7CC]">optional</span></label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Short description for customers…"
                className="mt-1 w-full text-sm border border-[#E5E7EB] rounded-xl px-3 py-2.5 outline-none focus:border-[#8B5CF6] resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#6B7280] hover:bg-[#F2F2F7]">
              Cancel
            </button>
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-[#F2F2F7] animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] p-12 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <p className="font-bold text-[#1C1C1E] text-sm">No items yet</p>
          <p className="text-[#8E8E93] text-xs mt-1">Add your services or products — the AI will show them to customers</p>
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true) }}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl overflow-hidden transition-all ${!p.is_available ? 'opacity-50' : ''}`}
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {/* Image */}
              <div className="relative h-36 bg-[#F2F2F7] flex items-center justify-center overflow-hidden">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-4xl">🛍️</span>
                }
                {p.is_popular && (
                  <span className="absolute top-2 left-2 text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">⭐ Popular</span>
                )}
                {!p.is_available && (
                  <span className="absolute top-2 right-2 text-[10px] bg-[#8E8E93] text-white px-2 py-0.5 rounded-full font-bold">Off</span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-bold text-[#1C1C1E] text-sm truncate">{p.name}</p>
                {p.description && <p className="text-xs text-[#8E8E93] mt-0.5 line-clamp-1">{p.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-base font-black text-[#059669]">{SYM[p.currency] ?? p.currency}{Number(p.price).toLocaleString()}</p>
                  {p.duration_mins && <span className="text-xs text-[#8E8E93]">{p.duration_mins}min</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={() => toggleAvailable(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] hover:bg-[#F2F2F7] transition-colors text-[#6B7280]">
                  {p.is_available ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => startEdit(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] hover:bg-[#F2F2F7] transition-colors text-[#6B7280]">
                  Edit
                </button>
                <button onClick={() => del(p.id)} disabled={deleting === p.id}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/5 transition-colors disabled:opacity-50">
                  {deleting === p.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
