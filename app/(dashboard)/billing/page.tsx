'use client'

import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

const PACKS = [
  { id: 'starter', credits: 200,    price: 22_000,   label: 'Starter', color: '#007AFF', per: 110 },
  { id: 'growth',  credits: 1_000,  price: 100_000,  label: 'Growth',  color: '#5856D6', per: 100, popular: true },
  { id: 'pro',     credits: 5_000,  price: 475_000,  label: 'Pro',     color: '#FF9500', per: 95 },
  { id: 'scale',   credits: 10_000, price: 900_000,  label: 'Scale',   color: '#34C759', per: 90 },
]

interface Profile {
  id: string
  credits: number
  subscription_status: string
  messages_sent_total: number
  full_name: string | null
  email?: string
}

interface Tx {
  id: string; amount: number; type: string
  description: string | null; balance_after: number; created_at: string
}

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? 'First Bank'
const ACCOUNT_NO   = process.env.NEXT_PUBLIC_ACCOUNT_NO   ?? 'Contact admin for details'
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_ACCOUNT_NAME ?? 'FastBuySell Ltd'
const ADMIN_WA     = process.env.NEXT_PUBLIC_ADMIN_WA     ?? ''
const ADMIN_TG     = process.env.NEXT_PUBLIC_ADMIN_TG     ?? ''

function fmt(n: number) { return n.toLocaleString('en-NG') }

export default function BillingPage() {
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [txs,       setTxs]       = useState<Tx[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [copyDone,  setCopyDone]  = useState(false)

  // Payment submission state
  const [step,        setStep]        = useState<'select' | 'pay' | 'submit' | 'done'>('select')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [note,        setNote]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')
      const [{ data: prof }, { data: wallet }, { data: txData }] = await Promise.all([
        supabaseBrowser.from('profiles')
          .select('id, subscription_status, messages_sent_total, full_name')
          .eq('id', user.id).single(),
        supabaseBrowser.from('wallets')
          .select('balance').eq('user_id', user.id).maybeSingle(),
        supabaseBrowser.from('credit_transactions')
          .select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(20),
      ])
      setProfile({ ...(prof as Profile), credits: (wallet?.balance ?? 0) })
      setTxs((txData ?? []) as Tx[])
      setLoading(false)
    }
    load()
  }, [])

  function copyAcct() {
    navigator.clipboard.writeText(ACCOUNT_NO).then(() => {
      setCopyDone(true); setTimeout(() => setCopyDone(false), 1500)
    })
  }

  function selectPack(id: string) {
    setSelected(id); setStep('pay')
    setReceiptFile(null); setNote(''); setSubmitError('')
  }

  async function submitPayment() {
    if (!receiptFile || !selected || !profile) return
    setSubmitting(true); setSubmitError('')
    try {
      const pack = PACKS.find(p => p.id === selected)!
      // Upload receipt to Supabase storage
      const ext  = receiptFile.name.split('.').pop()
      const path = `receipts/${profile.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabaseBrowser.storage
        .from('payment-receipts')
        .upload(path, receiptFile, { upsert: true })
      if (upErr) throw new Error(upErr.message)

      const { data: { publicUrl } } = supabaseBrowser.storage
        .from('payment-receipts').getPublicUrl(path)

      // Save payment request to DB
      await supabaseBrowser.from('payment_requests').insert({
        user_id:          profile.id,
        pack_id:          pack.id,
        credits_requested: pack.credits,
        amount_naira:     pack.price,
        receipt_url:      publicUrl,
        note:             note.trim() || null,
        status:           'pending',
      })

      // Trigger Telegram notification via API
      await fetch('/api/billing/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     profile.full_name ?? userEmail,
          email:    userEmail,
          pack:     pack.label,
          amount:   pack.price,
          credits:  pack.credits,
          receipt:  publicUrl,
          note:     note.trim(),
        }),
      })

      setStep('done')
    } catch (e) {
      setSubmitError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const credits  = profile?.credits ?? 0
  const pack     = PACKS.find(p => p.id === selected)

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-36 bg-white rounded-3xl animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />)}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Credits & Billing</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">1 credit = 1 WhatsApp message. Credits never expire.</p>
      </div>

      {/* Balance hero */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 8px 32px rgba(37,211,102,0.35)' }}>
        <div className="absolute right-4 top-4 opacity-10">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Available Credits</p>
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-5xl font-black tabular-nums">{fmt(credits)}</span>
          <span className="text-white/60 text-sm">credits</span>
        </div>
        <p className="text-white/60 text-sm">≈ ₦{fmt(credits * 100)} messaging value</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
            <p className="text-[11px] text-white/60 mb-0.5">Total Sent</p>
            <p className="font-black text-lg tabular-nums">{fmt(profile?.messages_sent_total ?? 0)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
            <p className="text-[11px] text-white/60 mb-0.5">Rate</p>
            <p className="font-black text-lg">₦90–110<span className="text-sm font-normal">/msg</span></p>
          </div>
        </div>
      </div>

      {/* Pack selection */}
      {step === 'select' && (
        <div>
          <p className="text-[#1C1C1E] font-bold text-sm mb-3">Choose a Credit Pack</p>
          <div className="grid grid-cols-2 gap-3">
            {PACKS.map(p => (
              <button key={p.id} onClick={() => selectPack(p.id)}
                className="relative text-left rounded-3xl p-4 border-2 bg-white hover:shadow-lg transition-all"
                style={{ borderColor: '#E5E5EA' }}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-black px-2.5 py-0.5 rounded-full text-white"
                    style={{ background: p.color }}>Best Value</span>
                )}
                <p className="font-black text-[#1C1C1E] text-sm">{p.label}</p>
                <p className="text-2xl font-black mt-0.5 tabular-nums" style={{ color: p.color }}>{fmt(p.credits)}</p>
                <p className="text-[#8E8E93] text-xs mb-2">credits</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1C1E]">₦{fmt(p.price)}</span>
                  <span className="text-[10px] text-[#8E8E93]">₦{p.per}/msg</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment flow */}
      {(step === 'pay' || step === 'submit') && pack && (
        <div className="bg-white rounded-3xl p-5 space-y-4 border-2"
          style={{ borderColor: `${pack.color}40`, boxShadow: `0 4px 20px ${pack.color}15` }}>

          {/* Pack summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#1C1C1E]">{pack.label} Pack — {fmt(pack.credits)} credits</p>
              <p className="text-[#8E8E93] text-sm">₦{fmt(pack.price)}</p>
            </div>
            <button onClick={() => { setStep('select'); setSelected(null) }}
              className="text-[#8E8E93] text-xs hover:text-[#FF3B30] transition-colors">
              Change
            </button>
          </div>

          {/* Bank details */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">Transfer To</p>
            {[
              { label: 'Bank',           value: BANK_NAME },
              { label: 'Account Name',   value: ACCOUNT_NAME },
              { label: 'Account Number', value: ACCOUNT_NO },
              { label: 'Amount',         value: `₦${fmt(pack.price)}` },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-[#F2F2F7] rounded-2xl px-4 py-3">
                <span className="text-[#8E8E93] text-xs">{r.label}</span>
                <span className="text-[#1C1C1E] text-sm font-bold font-mono">{r.value}</span>
              </div>
            ))}
            <button onClick={copyAcct}
              className="w-full py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{ background: copyDone ? '#34C75912' : '#F2F2F7', color: copyDone ? '#34C759' : '#1C1C1E' }}>
              {copyDone ? '✓ Copied' : 'Copy Account Number'}
            </button>
          </div>

          <div className="border-t border-[#F2F2F7] pt-4 space-y-3">
            <p className="font-bold text-[#1C1C1E] text-sm">After paying, upload your receipt</p>

            {/* Receipt upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all"
              style={{ borderColor: receiptFile ? pack.color : '#E5E5EA', background: receiptFile ? `${pack.color}06` : 'transparent' }}>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
              {receiptFile ? (
                <div className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pack.color} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="text-sm font-semibold truncate max-w-[200px]" style={{ color: pack.color }}>{receiptFile.name}</span>
                  <button onClick={e => { e.stopPropagation(); setReceiptFile(null) }} className="text-[#8E8E93] hover:text-[#FF3B30] ml-1">×</button>
                </div>
              ) : (
                <>
                  <svg className="mx-auto mb-2 text-[#C7C7CC]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-[#8E8E93] text-sm">Tap to upload receipt</p>
                  <p className="text-[#C7C7CC] text-xs mt-0.5">PNG, JPG or PDF</p>
                </>
              )}
            </div>

            {/* Optional note */}
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional) — e.g. your name or transfer reference"
              rows={2}
              className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none resize-none" />

            {submitError && <p className="text-[#FF3B30] text-xs">{submitError}</p>}

            <button onClick={submitPayment}
              disabled={!receiptFile || submitting}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: pack.color }}>
              {submitting ? 'Submitting…' : 'Submit Payment for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {step === 'done' && (
        <div className="bg-white rounded-3xl p-6 text-center space-y-3 border-2 border-[#34C759]/30">
          <div className="w-14 h-14 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <p className="font-black text-[#1C1C1E] text-lg">Payment Submitted!</p>
          <p className="text-[#8E8E93] text-sm">Admin has been notified. Your credits will be added within 1 hour after verification.</p>
          <button onClick={() => { setStep('select'); setSelected(null) }}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-[#F2F2F7] text-[#1C1C1E]">
            Back
          </button>
        </div>
      )}

      {/* Contact admin */}
      <div className="bg-white rounded-3xl p-5 space-y-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <p className="font-bold text-[#1C1C1E] text-sm">Need Help? Message Admin Directly</p>
        <p className="text-[#8E8E93] text-xs">After payment, send your receipt directly — we&apos;ll activate your credits fast.</p>
        <div className="flex gap-3">
          {ADMIN_WA ? (
            <a href={`https://wa.me/${ADMIN_WA.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I just paid for credits on OutreachHQ. My email: ${userEmail}`)}`}
              target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z"/>
              </svg>
              Chat on WhatsApp
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white opacity-50 cursor-not-allowed"
              style={{ background: '#25D366' }} title="WhatsApp contact not configured yet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.102 1.523 5.828L.057 23.428a.5.5 0 0 0 .614.614l5.6-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-4.962-1.363l-.356-.214-3.684.965.982-3.583-.233-.372A9.699 9.699 0 0 1 2.25 12C2.25 6.624 6.623 2.25 12 2.25c5.376 0 9.75 4.374 9.75 9.75S17.376 21.75 12 21.75z"/>
              </svg>
              Chat on WhatsApp
            </div>
          )}
          {ADMIN_TG ? (
            <a href={ADMIN_TG.startsWith('http') ? ADMIN_TG : `https://t.me/${ADMIN_TG}`}
              target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#229ED9' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Chat on Telegram
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white opacity-50 cursor-not-allowed"
              style={{ background: '#229ED9' }} title="Telegram contact not configured yet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Chat on Telegram
            </div>
          )}
        </div>
        {(!ADMIN_WA || !ADMIN_TG) && (
          <p className="text-[#C7C7CC] text-[11px] text-center">Admin contact links will be active soon</p>
        )}
      </div>

      {/* Transaction history */}
      {txs.length > 0 && (
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="px-5 py-4 border-b border-[#F2F2F7]">
            <p className="font-bold text-[#1C1C1E] text-sm">Credit History</p>
          </div>
          <div className="divide-y divide-[#F2F2F7]">
            {txs.map(tx => {
              const pos = tx.amount > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: pos ? '#34C75912' : '#FF3B3012' }}>
                    <span className="text-sm font-black" style={{ color: pos ? '#34C759' : '#FF3B30' }}>{pos ? '+' : '−'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1C1C1E] text-sm font-medium truncate">{tx.description ?? tx.type}</p>
                    <p className="text-[#8E8E93] text-[11px]">
                      {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}balance: {fmt(tx.balance_after)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0"
                    style={{ color: pos ? '#34C759' : '#FF3B30' }}>
                    {pos ? '+' : ''}{tx.amount}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
