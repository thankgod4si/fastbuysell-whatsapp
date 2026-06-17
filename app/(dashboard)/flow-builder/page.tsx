'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  image_url: string | null
  duration_mins: number | null
  is_popular: boolean
  is_available: boolean
  sort_order: number
  _in_flow: boolean          // local toggle (not persisted separately, uses is_available)
}

type PublishState = 'idle' | 'publishing' | 'done' | 'error'

const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }

// ─── Phone mockup screens ────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[280px] shrink-0">
      {/* Phone shell */}
      <div className="rounded-[40px] border-[6px] border-[#1C1C1E] bg-[#1C1C1E] shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-[#075E54] px-4 pt-2 pb-1 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">👤</div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">Business Name</p>
            <p className="text-white/60 text-[10px]">WhatsApp</p>
          </div>
        </div>
        {/* Screen content */}
        <div className="bg-white min-h-[500px] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

function FlowScreen({ product, idx, total, onPrev, onNext, onSelect }: {
  product: Product
  idx: number
  total: number
  onPrev?: () => void
  onNext?: () => void
  onSelect: () => void
}) {
  const sym = SYM[product.currency] ?? product.currency
  const dur = product.duration_mins ? ` · ${product.duration_mins}min` : ''
  return (
    <div>
      {/* Product image */}
      <div className="relative h-44 bg-[#F2F2F7] overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
        }
        {product.is_popular && (
          <span className="absolute top-2 left-2 text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">⭐ Popular</span>
        )}
        <span className="absolute top-2 right-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">{idx + 1}/{total}</span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-1">
        <p className="font-bold text-[#1C1C1E] text-sm">{product.name}</p>
        <p className="text-[#8B5CF6] font-black text-base">{sym}{Number(product.price).toLocaleString()}{dur}</p>
        {product.description && <p className="text-xs text-[#6B7280] line-clamp-2">{product.description}</p>}
      </div>

      {/* Nav links */}
      <div className="px-4 flex justify-between text-xs text-[#007AFF] font-semibold pb-2">
        {onPrev ? <button onClick={onPrev}>← Previous</button> : <span />}
        {onNext ? <button onClick={onNext}>Next →</button> : <span />}
      </div>

      {/* Select button */}
      <div className="px-4 pb-4">
        <button onClick={onSelect}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#25D366' }}>
          Select — {sym}{Number(product.price).toLocaleString()}
        </button>
      </div>
    </div>
  )
}

function DetailsScreen({ productName }: { productName: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold text-[#8B5CF6] bg-[#F3F0FF] px-3 py-2 rounded-xl">
        Selected: {productName}
      </div>
      {['Your full name', 'Preferred date (e.g. June 25)', 'Preferred time (e.g. 2:00pm)'].map(label => (
        <div key={label}>
          <p className="text-xs text-[#6B7280] mb-1">{label}</p>
          <div className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#C7C7CC]">Tap to fill…</div>
        </div>
      ))}
      <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: '#25D366' }}>
        Continue to Payment →
      </button>
    </div>
  )
}

function PaymentScreen({ productName }: { productName: string }) {
  const [selected, setSelected] = useState<'transfer' | 'card' | null>(null)
  return (
    <div className="p-4 space-y-3">
      <p className="font-bold text-sm text-[#1C1C1E]">Payment Method</p>
      <p className="text-xs text-[#6B7280]">You're almost done for <b>{productName}</b>!</p>
      {(['transfer', 'card'] as const).map(m => (
        <button key={m} onClick={() => setSelected(m)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${selected === m ? 'border-[#25D366] bg-[#F0FDF4]' : 'border-[#E5E7EB]'}`}>
          {m === 'transfer' ? '🏦 Pay with Bank Transfer' : '💳 Pay with Card / Link'}
        </button>
      ))}
      <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#25D366' }}>
        Confirm Booking ✅
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlowBuilderPage() {
  const [products,   setProducts]   = useState<Product[]>([])
  const [loading,    setLoading]    = useState(true)
  const [previewIdx, setPreviewIdx] = useState(0)  // which product is previewed
  const [previewScreen, setPreviewScreen] = useState<'product' | 'details' | 'payment'>('product')
  const [publishState, setPublishState] = useState<PublishState>('idle')
  const [publishMsg,   setPublishMsg]   = useState('')
  const [flowId,       setFlowId]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [prodRes, profileRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/profile'),
    ])
    const prods = await prodRes.json()
    const profile = profileRes.ok ? await profileRes.json() : {}
    setProducts(
      (Array.isArray(prods) ? prods : []).map((p: Product) => ({ ...p, _in_flow: p.is_available }))
    )
    setFlowId(profile.booking_flow_id ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const flowItems = products.filter(p => p._in_flow)

  function toggleInFlow(id: string) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, _in_flow: !p._in_flow } : p))
  }

  function moveUp(id: string) {
    setProducts(ps => {
      const i = ps.findIndex(p => p.id === id)
      if (i <= 0) return ps
      const copy = [...ps]
      ;[copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]
      return copy
    })
  }

  function moveDown(id: string) {
    setProducts(ps => {
      const i = ps.findIndex(p => p.id === id)
      if (i >= ps.length - 1) return ps
      const copy = [...ps]
      ;[copy[i], copy[i + 1]] = [copy[i + 1], copy[i]]
      return copy
    })
  }

  async function publish() {
    // First save the order + availability changes to DB
    await Promise.all(
      products.map((p, idx) =>
        fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, sort_order: idx, is_available: p._in_flow }),
        })
      )
    )

    // Then create/publish the flow in Meta
    setPublishState('publishing')
    setPublishMsg('')
    const res = await fetch('/api/booking-flow', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPublishState('done')
      setPublishMsg(`Published! Flow ID: ${data.metaFlowId}`)
      setFlowId(data.metaFlowId)
    } else {
      setPublishState('error')
      setPublishMsg(data.error ?? 'Unknown error')
    }
  }

  const previewProduct = flowItems[previewIdx] ?? flowItems[0]

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Booking Flow Builder</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">
            Drag to reorder products, toggle which appear in your WhatsApp booking form, then publish.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button onClick={publish} disabled={publishState === 'publishing' || flowItems.length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: publishState === 'done' ? '#34C759' : 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
            {publishState === 'publishing' ? (
              <><span className="animate-spin">⟳</span> Publishing…</>
            ) : publishState === 'done' ? (
              <>✓ Published</>
            ) : (
              <>🚀 Publish to WhatsApp</>
            )}
          </button>
          {publishMsg && (
            <p className={`text-xs ${publishState === 'error' ? 'text-red-500' : 'text-[#34C759]'}`}>{publishMsg}</p>
          )}
          {flowId && publishState !== 'error' && (
            <p className="text-[10px] text-[#8E8E93]">Meta Flow ID: {flowId}</p>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl bg-[#F0F7FF] border border-[#BAD9FF] px-5 py-4 text-sm text-[#1C4ED8] flex gap-3 items-start">
        <span className="text-lg shrink-0">ℹ️</span>
        <div>
          <strong>How it works:</strong> Customers who message your WhatsApp number receive this booking form automatically.
          They swipe through your products, tap &quot;Select&quot;, fill in their name + preferred time, and choose Bank Transfer or Card.
          You get a booking notification + payment automatically.
        </div>
      </div>

      <div className="flex gap-8 items-start flex-wrap lg:flex-nowrap">

        {/* Left: product list editor */}
        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            Products in flow ({flowItems.length}/{products.length})
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-[#F2F2F7] animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] p-8 text-center">
              <p className="text-sm font-bold text-[#1C1C1E]">No products yet</p>
              <p className="text-xs text-[#8E8E93] mt-1">
                Add products in the <a href="/catalog" className="text-[#007AFF] underline">Catalog page</a> first
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p, idx) => {
                const sym = SYM[p.currency] ?? p.currency
                const isPreview = previewProduct?.id === p.id
                return (
                  <div key={p.id}
                    onClick={() => { if (p._in_flow) { setPreviewIdx(flowItems.findIndex(f => f.id === p.id)); setPreviewScreen('product') } }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      p._in_flow
                        ? isPreview
                          ? 'border-[#8B5CF6] bg-[#F5F0FF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#C4B5FD]'
                        : 'border-dashed border-[#E5E7EB] bg-[#F9FAFB] opacity-60'
                    }`}>
                    {/* Image thumb */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F2F2F7] shrink-0">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate">{p.name}</p>
                      <p className="text-xs text-[#6B7280]">{sym}{Number(p.price).toLocaleString()}</p>
                    </div>

                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveUp(p.id)} disabled={idx === 0}
                        className="text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] disabled:opacity-20 leading-none px-1">▲</button>
                      <button onClick={() => moveDown(p.id)} disabled={idx === products.length - 1}
                        className="text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] disabled:opacity-20 leading-none px-1">▼</button>
                    </div>

                    {/* Toggle in/out of flow */}
                    <button onClick={(e) => { e.stopPropagation(); toggleInFlow(p.id) }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 ${p._in_flow ? 'bg-[#8B5CF6]' : 'bg-[#E5E7EB]'}`}
                      style={{ width: 40, height: 22 }}>
                      <span className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${p._in_flow ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {flowItems.length > 0 && (
            <p className="text-xs text-[#8E8E93] pt-1">
              Click any row to preview that screen in the phone mockup →
            </p>
          )}
        </div>

        {/* Right: phone preview */}
        <div className="shrink-0 flex flex-col items-center gap-4">
          <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider self-start">Preview</p>

          {/* Screen tabs */}
          <div className="flex gap-1 bg-[#F2F2F7] p-1 rounded-xl text-xs font-semibold self-start">
            {(['product', 'details', 'payment'] as const).map(s => (
              <button key={s} onClick={() => setPreviewScreen(s)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${previewScreen === s ? 'bg-white shadow text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>
                {s === 'product' ? '🛍 Products' : s === 'details' ? '📋 Details' : '💳 Payment'}
              </button>
            ))}
          </div>

          <PhoneFrame>
            {flowItems.length === 0 ? (
              <div className="p-8 text-center text-[#8E8E93] text-sm">
                Enable at least one product to preview the flow
              </div>
            ) : previewScreen === 'product' ? (
              <FlowScreen
                product={previewProduct}
                idx={previewIdx}
                total={flowItems.length}
                onPrev={previewIdx > 0 ? () => setPreviewIdx(i => i - 1) : undefined}
                onNext={previewIdx < flowItems.length - 1 ? () => setPreviewIdx(i => i + 1) : undefined}
                onSelect={() => setPreviewScreen('details')}
              />
            ) : previewScreen === 'details' ? (
              <DetailsScreen productName={previewProduct?.name ?? ''} />
            ) : (
              <PaymentScreen productName={previewProduct?.name ?? ''} />
            )}
          </PhoneFrame>

          {/* Screen counter dots */}
          {previewScreen === 'product' && flowItems.length > 1 && (
            <div className="flex gap-1.5">
              {flowItems.map((_, i) => (
                <button key={i} onClick={() => setPreviewIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === previewIdx ? 'bg-[#8B5CF6]' : 'bg-[#E5E7EB]'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
