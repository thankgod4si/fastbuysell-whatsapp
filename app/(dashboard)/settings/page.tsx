'use client'

import { useEffect, useRef, useState } from 'react'

export const dynamic = 'force-dynamic'

interface Profile {
  full_name: string
  reply_to_email: string
  resend_api_key: string
  email_from: string
  wa_phone_number: string
  wa_phone_number_id: string
  wa_display_name: string
  wa_verified: boolean
  brevo_api_key: string
  brevo_sms_sender: string
  subscription_status: string
  trial_sends_remaining: number
  messages_sent_total: number
  business_type?: 'salon' | 'nails'
}

interface WaNumber {
  id: string
  phone_number_id: string
  phone_number: string
  display_name: string | null
  is_default: boolean
  verified: boolean
}

type WaStep = 'idle' | 'awaiting_code' | 'verified_pending_reload'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-5 border-b border-black/[0.05]">
      <p className="text-[#1C1C1E] font-bold text-sm">{title}</p>
      {subtitle && <p className="text-[#8E8E93] text-xs mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">{label}</label>
      {hint && <p className="text-[#C7C7CC] text-[11px] mb-2 leading-relaxed">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#007AFF]/25 transition-all"
    />
  )
}

function SaveBtn({ saving, saved, color = '#007AFF' }: { saving: boolean; saved: boolean; color?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
      style={{ background: saved ? '#34C759' : color, boxShadow: `0 4px 12px ${saved ? '#34C759' : color}30` }}
    >
      {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
    </button>
  )
}

function StatusPill({ status, remaining }: { status: string; remaining: number }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:           { label: 'Active',           color: '#34C759', bg: '#34C75912' },
    trial:            { label: `Trial · ${remaining} left`, color: '#FF9500', bg: '#FF950012' },
    suspended:        { label: 'Suspended',         color: '#FF3B30', bg: '#FF3B3012' },
    pending_approval: { label: 'Pending approval',  color: '#AF52DE', bg: '#AF52DE12' },
  }
  const m = map[status] ?? map.trial
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  )
}

function LiveChatButtons() {
  const wa = process.env.NEXT_PUBLIC_ADMIN_WA
  const tg = process.env.NEXT_PUBLIC_ADMIN_TG
  if (!wa && !tg) return null
  return (
    <div className="flex items-center justify-center gap-3 mt-2">
      {wa && (
        <a href={`https://wa.me/${wa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#25D366' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 0C5.366 0 0 5.373 0 12a11.952 11.952 0 001.636 6.062L0 24l6.134-1.612A11.944 11.944 0 0012 24c6.624 0 12-5.373 12-12S18.614 0 11.99 0zM12 22c-1.848 0-3.588-.495-5.09-1.36l-.365-.217-3.779.993.988-3.703-.238-.383A10.005 10.005 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Chat on WhatsApp
        </a>
      )}
      {tg && (
        <a href={tg} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#229ED9' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.196 13.9l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.952.659z"/></svg>
          Chat on Telegram
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [profile,  setProfile]  = useState<Partial<Profile>>({})
  const [loading,  setLoading]  = useState(true)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile,  setSavedProfile]  = useState(false)
  const [savingEmail,   setSavingEmail]   = useState(false)
  const [savedEmail,    setSavedEmail]    = useState(false)
  const [savingSms,     setSavingSms]     = useState(false)
  const [savedSms,      setSavedSms]      = useState(false)

  // Buy a number flow
  const [buyStep,      setBuyStep]      = useState<'idle'|'pay'|'done'>('idle')
  const [buyReceipt,   setBuyReceipt]   = useState<File | null>(null)
  const [buyNote,      setBuyNote]      = useState('')
  const [buyWorking,   setBuyWorking]   = useState(false)
  const [buyError,     setBuyError]     = useState('')
  const buyFileRef = useRef<HTMLInputElement>(null)

  // WhatsApp numbers
  const [waNumbers,      setWaNumbers]      = useState<WaNumber[]>([])
  const [waStep,         setWaStep]         = useState<WaStep>('idle')
  const [showRegForm,    setShowRegForm]    = useState(false)
  const [showAddExisting, setShowAddExisting] = useState(false)
  const [regCc,          setRegCc]          = useState('')
  const [regPhone,       setRegPhone]       = useState('')
  const [regName,        setRegName]        = useState('')
  const [regPin,         setRegPin]         = useState('')
  const [regCodeMethod,  setRegCodeMethod]  = useState<'SMS' | 'VOICE'>('SMS')
  const [verifyCode,     setVerifyCode]     = useState('')
  const [waWorking,      setWaWorking]      = useState(false)
  const [waError,        setWaError]        = useState('')
  
  // Add existing number
  const [existingPhoneId, setExistingPhoneId] = useState('')
  const [existingPhone, setExistingPhone] = useState('')
  const [existingName, setExistingName] = useState('')
  const [addExistingWorking, setAddExistingWorking] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/whatsapp/numbers').then(r => r.json()),
    ]).then(([prof, nums]: [Partial<Profile>, WaNumber[]]) => {
      setProfile(prof)
      const list: WaNumber[] = Array.isArray(nums) ? nums : []
      // If the profile has a WA number not yet in wa_numbers table, show it
      if (prof.wa_phone_number_id && !list.find(n => n.phone_number_id === prof.wa_phone_number_id)) {
        list.unshift({
          id: '__profile__',
          phone_number_id: prof.wa_phone_number_id,
          phone_number: prof.wa_phone_number ?? '',
          display_name: prof.wa_display_name ?? null,
          is_default: true,
          verified: prof.wa_verified ?? false,
        })
      }
      setWaNumbers(list)
      setLoading(false)
    })
  }, [])

  function patch(body: Record<string, unknown>) {
    return fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProfile(true)
    await patch({ full_name: profile.full_name, reply_to_email: profile.reply_to_email })
    setSavingProfile(false); setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault(); setSavingEmail(true)
    await patch({ resend_api_key: profile.resend_api_key, email_from: profile.email_from })
    setSavingEmail(false); setSavedEmail(true)
    setTimeout(() => setSavedEmail(false), 2500)
  }

  async function saveSms(e: React.FormEvent) {
    e.preventDefault(); setSavingSms(true)
    await patch({ brevo_api_key: profile.brevo_api_key, brevo_sms_sender: profile.brevo_sms_sender })
    setSavingSms(false); setSavedSms(true)
    setTimeout(() => setSavedSms(false), 2500)
  }

  function resetRegForm() {
    setRegCc(''); setRegPhone(''); setRegName(''); setRegPin('')
    setVerifyCode(''); setWaError(''); setWaStep('idle'); setShowRegForm(false)
  }

  async function addExistingNumber(e: React.SyntheticEvent) {
    e.preventDefault()
    setAddExistingWorking(true)
    setWaError('')
    
    try {
      const res = await fetch('/api/whatsapp/add-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: existingPhoneId,
          phone_number: existingPhone,
          display_name: existingName
        })
      })
      
      const data = await res.json()
      if (data.error) {
        setWaError(data.error)
      } else {
        // Refresh numbers
        const nums = await fetch('/api/whatsapp/numbers').then(r => r.json())
        setWaNumbers(Array.isArray(nums) ? nums : [])
        setShowAddExisting(false)
        setExistingPhoneId('')
        setExistingPhone('')
        setExistingName('')
      }
    } catch (err) {
      setWaError('Failed to add number')
    } finally {
      setAddExistingWorking(false)
    }
  }

  async function registerNumber(e: React.SyntheticEvent) {
    e.preventDefault(); setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cc: regCc, phone_number: regPhone, display_name: regName, pin: regPin }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) { setWaError(data.error ?? 'Registration failed'); return }
    // Auto-request the verification code right away
    await requestCode()
    setWaStep('awaiting_code')
  }

  async function requestCode() {
    setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: regCodeMethod }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) setWaError(data.error ?? 'Could not send code')
  }

  async function verifyNumber(e: React.SyntheticEvent) {
    e.preventDefault(); setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: verifyCode }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) { setWaError(data.error ?? 'Verification failed'); return }
    // Reload numbers list
    const nums = await fetch('/api/whatsapp/numbers').then(r => r.json())
    setWaNumbers(Array.isArray(nums) ? nums : [])
    resetRegForm()
  }

  async function setDefaultNumber(id: string, num: WaNumber) {
    if (id !== '__profile__') await fetch('/api/whatsapp/numbers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_default: true }),
    })
    await patch({
      wa_phone_number_id: num.phone_number_id,
      wa_phone_number:    num.phone_number,
      wa_display_name:    num.display_name,
      wa_verified:        true,
    })
    setWaNumbers(prev => prev.map(n => ({ ...n, is_default: n.id === id })))
  }

  async function removeNumber(id: string, wasDefault: boolean) {
    if (id !== '__profile__') await fetch(`/api/whatsapp/numbers?id=${id}`, { method: 'DELETE' })
    const remaining = waNumbers.filter(n => n.id !== id)
    setWaNumbers(remaining)
    if (wasDefault && remaining.length > 0) {
      await setDefaultNumber(remaining[0].id, remaining[0])
    }
    if (remaining.length === 0) {
      await patch({ wa_phone_number_id: null, wa_phone_number: null, wa_display_name: null, wa_verified: false })
    }
  }

  async function submitBuyNumber() {
    if (!buyReceipt) return
    setBuyWorking(true); setBuyError('')
    try {
      const { supabaseBrowser } = await import('@/lib/supabase-browser')
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const ext  = buyReceipt.name.split('.').pop()
      const path = `number-requests/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabaseBrowser.storage
        .from('payment-receipts').upload(path, buyReceipt, { upsert: true })
      if (upErr) throw new Error(upErr.message)

      const { data: { publicUrl } } = supabaseBrowser.storage
        .from('payment-receipts').getPublicUrl(path)

      const res = await fetch('/api/billing/number-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_url: publicUrl, note: buyNote.trim() || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      setBuyStep('done')
    } catch (e) {
      setBuyError((e as Error).message)
    } finally {
      setBuyWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />)}
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Settings</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">Profile, email domain, SMS, and WhatsApp setup</p>
      </div>

      {/* Account status */}
      <Card>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#1C1C1E] font-semibold text-sm">{profile.full_name || 'Your account'}</p>
            <p className="text-[#8E8E93] text-xs mt-0.5">{profile.messages_sent_total ?? 0} messages sent total</p>
          </div>
          <StatusPill status={profile.subscription_status ?? 'trial'} remaining={profile.trial_sends_remaining ?? 0} />
        </div>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" />
        <form onSubmit={saveProfile} className="p-6 space-y-4">
          <Field label="Full Name">
            <TextInput value={profile.full_name ?? ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Hans Müller" />
          </Field>
          <Field label="Reply-To Email" hint="Seller replies land here. Leave blank to use the platform default.">
            <TextInput type="email" value={profile.reply_to_email ?? ''} onChange={e => setProfile(p => ({ ...p, reply_to_email: e.target.value }))} placeholder="you@yourcompany.com" />
          </Field>
          <SaveBtn saving={savingProfile} saved={savedProfile} />
        </form>
      </Card>

      {/* WhatsApp Numbers — anchor for onboarding link */}
      <div id="whatsapp" />
      <Card>
        <CardHeader
          title="WhatsApp Numbers"
          subtitle="Buy a managed number or register your own SIM."
        />
        <div className="p-6 space-y-4">

          {/* Registered numbers list */}
          {waNumbers.length > 0 && (
            <div className="space-y-2">
              {waNumbers.map(num => (
                <div key={num.id} className="rounded-2xl border border-[#E5E5EA] px-4 py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#25D36615' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 0C5.366 0 0 5.373 0 12a11.952 11.952 0 001.636 6.062L0 24l6.134-1.612A11.944 11.944 0 0012 24c6.624 0 12-5.373 12-12S18.614 0 11.99 0zM12 22c-1.848 0-3.588-.495-5.09-1.36l-.365-.217-3.779.993.988-3.703-.238-.383A10.005 10.005 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1C1C1E] font-mono">{num.phone_number}</span>
                      {num.is_default && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#25D36615', color: '#25D366' }}>DEFAULT</span>}
                      {!num.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FF950015', color: '#FF9500' }}>UNVERIFIED</span>}
                    </div>
                    {num.display_name && <p className="text-xs text-[#8E8E93] mt-0.5">{num.display_name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {!num.is_default && (
                      <button onClick={() => setDefaultNumber(num.id, num)} className="text-[11px] font-semibold text-[#007AFF] hover:opacity-70 transition-opacity whitespace-nowrap">
                        Set default
                      </button>
                    )}
                    <button onClick={() => removeNumber(num.id, num.is_default)} className="text-[11px] font-semibold text-[#FF3B30] hover:opacity-70 transition-opacity">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Add Existing Number (for testing) ── */}
          {buyStep === 'idle' && (
            <div className="rounded-2xl overflow-hidden border border-[#007AFF]/25" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#007AFF' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1C1C1E] text-sm">Add Existing WhatsApp Number</p>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: '#007AFF' }}>Test</span>
                  </div>
                  <p className="text-[#3C3C43] text-xs mt-1 leading-relaxed">Already have a WhatsApp number from Meta Business? Add it directly to start testing.</p>
                  <button onClick={() => setShowAddExisting(true)}
                    className="mt-3 px-5 py-2 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#007AFF', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>
                    Add Existing Number
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Add Existing Number Form ── */}
          {showAddExisting && (
            <div className="rounded-2xl border-2 border-[#007AFF]/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#1C1C1E] text-sm">Add Existing WhatsApp Number</p>
                <button onClick={() => { setShowAddExisting(false); setWaError('') }}
                  className="text-xs text-[#8E8E93] hover:text-[#FF3B30]">Cancel</button>
              </div>
              <form onSubmit={addExistingNumber} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6C6C70] mb-1.5">Phone Number ID (from Meta)</label>
                  <input
                    type="text"
                    value={existingPhoneId}
                    onChange={e => setExistingPhoneId(e.target.value)}
                    placeholder="683628188046191"
                    required
                    className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#007AFF40' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6C6C70] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={existingPhone}
                    onChange={e => setExistingPhone(e.target.value)}
                    placeholder="+234 805 648 7759"
                    required
                    className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#007AFF40' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6C6C70] mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={existingName}
                    onChange={e => setExistingName(e.target.value)}
                    placeholder="Pressed by VPH"
                    required
                    className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#007AFF40' } as React.CSSProperties}
                  />
                </div>
                {waError && (
                  <div className="rounded-xl px-4 py-2.5 text-xs"
                    style={{ background: '#FF3B3010', border: '1px solid #FF3B3030', color: '#FF3B30' }}>
                    {waError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={addExistingWorking}
                  className="w-full text-white font-bold py-2.5 rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#007AFF' }}
                >
                  {addExistingWorking ? 'Adding...' : 'Add Number'}
                </button>
              </form>
            </div>
          )}

          {/* ── Buy a Number (managed) ── */}
          {buyStep === 'idle' && (
            <div className="rounded-2xl overflow-hidden border border-[#25D366]/25" style={{ background: 'linear-gradient(135deg,#F0FFF4,#DCFCE7)' }}>
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#25D366' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1C1C1E] text-sm">Buy a WhatsApp Number</p>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: '#25D366' }}>₦15,000</span>
                  </div>
                  <p className="text-[#3C3C43] text-xs mt-1 leading-relaxed">We buy and register the number on Meta for you — fully managed. You&apos;ll receive your number within a few hours after payment is confirmed.</p>
                  <ul className="mt-2 space-y-0.5">
                    {['Virtual number in your preferred country','Registered on WhatsApp Cloud API','Ready to blast immediately','Full support included'].map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-[#3C3C43]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setBuyStep('pay')}
                    className="mt-3 px-5 py-2 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
                    Buy Number — ₦15,000
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Buy: payment step ── */}
          {buyStep === 'pay' && (
            <div className="rounded-2xl border-2 border-[#25D366]/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#1C1C1E] text-sm">Pay ₦15,000 — WhatsApp Number</p>
                <button onClick={() => { setBuyStep('idle'); setBuyReceipt(null); setBuyNote(''); setBuyError('') }}
                  className="text-xs text-[#8E8E93] hover:text-[#FF3B30]">Cancel</button>
              </div>
              {[
                { label: 'Bank',           value: process.env.NEXT_PUBLIC_BANK_NAME    ?? 'First Bank' },
                { label: 'Account Name',   value: process.env.NEXT_PUBLIC_ACCOUNT_NAME ?? 'FastBuySell Ltd' },
                { label: 'Account Number', value: process.env.NEXT_PUBLIC_ACCOUNT_NO   ?? 'Contact admin' },
                { label: 'Amount',         value: '₦15,000' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between bg-[#F2F2F7] rounded-2xl px-4 py-2.5">
                  <span className="text-[#8E8E93] text-xs">{r.label}</span>
                  <span className="text-[#1C1C1E] text-sm font-bold font-mono">{r.value}</span>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] mb-2">Upload Payment Receipt</p>
                <div onClick={() => buyFileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all"
                  style={{ borderColor: buyReceipt ? '#25D366' : '#E5E5EA', background: buyReceipt ? '#25D36606' : 'transparent' }}>
                  <input ref={buyFileRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => setBuyReceipt(e.target.files?.[0] ?? null)} />
                  {buyReceipt
                    ? <p className="text-sm font-semibold text-[#25D366] truncate">{buyReceipt.name}</p>
                    : <p className="text-[#8E8E93] text-sm">Tap to upload receipt (PNG, JPG, PDF)</p>
                  }
                </div>
              </div>
              <textarea value={buyNote} onChange={e => setBuyNote(e.target.value)}
                placeholder="Note (optional) — e.g. preferred country for the number"
                rows={2} className="w-full bg-[#F2F2F7] rounded-2xl px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C7C7CC] outline-none resize-none" />
              {buyError && <p className="text-[#FF3B30] text-xs">{buyError}</p>}
              <button onClick={submitBuyNumber} disabled={!buyReceipt || buyWorking}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#25D366' }}>
                {buyWorking ? 'Submitting…' : 'Submit Payment for Review'}
              </button>
              <div className="pt-1">
                <p className="text-center text-[#8E8E93] text-xs mb-2">Questions? Chat with us directly</p>
                <LiveChatButtons />
              </div>
            </div>
          )}

          {/* ── Buy: success ── */}
          {buyStep === 'done' && (
            <div className="rounded-2xl border border-[#34C759]/30 bg-[#34C759]/05 p-5 text-center space-y-2">
              <p className="text-2xl">🎉</p>
              <p className="font-bold text-[#1C1C1E] text-sm">Request Submitted!</p>
              <p className="text-[#8E8E93] text-xs">Admin has been notified. Your number will be ready within a few hours. You&apos;ll see it appear here automatically.</p>
              <LiveChatButtons />
            </div>
          )}

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#F2F2F7]" />
            <span className="text-[#C7C7CC] text-xs">or register your own SIM</span>
            <div className="flex-1 h-px bg-[#F2F2F7]" />
          </div>

          {/* Step 1: Register form */}
          {waStep === 'idle' && !showRegForm && (
            <div className="rounded-2xl border-2 border-dashed border-[#E5E5EA] px-5 py-4 text-center space-y-2">
              {waNumbers.length === 0 && <p className="text-[#8E8E93] text-xs">Already have a SIM? We&apos;ll register it on Meta for you.</p>}
              <button
                onClick={() => setShowRegForm(true)}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-[#1C1C1E] bg-[#F2F2F7]">
                {waNumbers.length > 0 ? '+ Register another number' : 'Register your own number'}
              </button>
            </div>
          )}

          {waStep === 'idle' && showRegForm && (
            <form onSubmit={registerNumber} className="space-y-4 border-t border-[#F2F2F7] pt-4">
              <p className="text-[#1C1C1E] font-semibold text-sm">Register your WhatsApp number</p>
              <div className="flex gap-3">
                <div className="w-24">
                  <Field label="Country Code" hint="Digits only">
                    <TextInput value={regCc} onChange={e => setRegCc(e.target.value.replace(/\D/g, ''))} placeholder="234" maxLength={4} />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Phone Number" hint="Without country code">
                    <TextInput value={regPhone} onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} placeholder="8104611794" />
                  </Field>
                </div>
              </div>
              <Field label="Display Name" hint="Shown to people you message on WhatsApp">
                <TextInput value={regName} onChange={e => setRegName(e.target.value)} placeholder="Fast Buy & Sell" />
              </Field>
              <Field label="2FA PIN" hint="Set a 6-digit PIN — WhatsApp requires this for registration">
                <TextInput type="password" value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" maxLength={6} />
              </Field>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">Send code via</span>
                {(['SMS', 'VOICE'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setRegCodeMethod(m)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={regCodeMethod === m
                      ? { background: '#25D36612', color: '#25D366', borderColor: '#25D36630' }
                      : { background: 'transparent', color: '#8E8E93', borderColor: '#E5E5EA' }}>
                    {m}
                  </button>
                ))}
              </div>
              {waError && <p className="text-[#FF3B30] text-xs">{waError}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={waWorking || !regCc || !regPhone || !regName || regPin.length < 6}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.25)' }}>
                  {waWorking ? 'Registering…' : 'Register & Send Code'}
                </button>
                <button type="button" onClick={resetRegForm}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-[#8E8E93] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Verify code */}
          {waStep === 'awaiting_code' && (
            <form onSubmit={verifyNumber} className="space-y-4 border-t border-[#F2F2F7] pt-4">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: '#007AFF10', border: '1px solid #007AFF20' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5 19.79 19.79 0 01.14 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <p className="text-sm text-[#007AFF]">Code sent to <span className="font-bold font-mono">+{regCc}{regPhone}</span> via {regCodeMethod}</p>
              </div>
              <Field label="Verification Code" hint="Enter the 6-digit code you received">
                <TextInput value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" maxLength={6} />
              </Field>
              {waError && <p className="text-[#FF3B30] text-xs">{waError}</p>}
              <div className="flex items-center gap-3">
                <button type="submit" disabled={waWorking || verifyCode.length < 6}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#25D366' }}>
                  {waWorking ? 'Verifying…' : 'Verify Number'}
                </button>
                <button type="button" onClick={requestCode} disabled={waWorking}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold text-[#8E8E93] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors disabled:opacity-50">
                  Resend
                </button>
                <button type="button" onClick={resetRegForm}
                  className="text-xs text-[#FF3B30] hover:opacity-70 transition-opacity">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Email / Resend */}
      <Card>
        <CardHeader title="Email" subtitle="Your Resend account — emails go from your domain, not ours." />
        <form onSubmit={saveEmail} className="p-6 space-y-4">
          <Field label="Resend API Key" hint="From resend.com → API Keys. Starts with re_">
            <TextInput type="password" value={profile.resend_api_key ?? ''} onChange={e => setProfile(p => ({ ...p, resend_api_key: e.target.value }))} placeholder="re_xxxxxxxxxxxxxxxxxxxx" />
          </Field>
          <Field label="From Address" hint="Must be a verified domain in your Resend account.">
            <TextInput value={profile.email_from ?? ''} onChange={e => setProfile(p => ({ ...p, email_from: e.target.value }))} placeholder="Fast Buy & Sell <hello@yourdomain.com>" />
          </Field>
          <div className="rounded-2xl bg-[#F2F2F7] px-4 py-3 text-xs text-[#8E8E93] leading-relaxed space-y-1">
            <p className="font-semibold text-[#3C3C43]">Setup</p>
            <ol className="ml-3 list-decimal space-y-0.5">
              <li>Create a free account at resend.com</li>
              <li>Domains → Add Domain → add your domain → add DNS records</li>
              <li>API Keys → copy key → paste above</li>
            </ol>
          </div>
          <SaveBtn saving={savingEmail} saved={savedEmail} color="#AF52DE" />
        </form>
      </Card>

      {/* SMS / Brevo */}
      <Card>
        <CardHeader title="SMS" subtitle="Your Brevo account for bulk SMS sending." />
        <form onSubmit={saveSms} className="p-6 space-y-4">
          <Field label="Brevo API Key" hint="From brevo.com → Settings → API Keys">
            <TextInput type="password" value={profile.brevo_api_key ?? ''} onChange={e => setProfile(p => ({ ...p, brevo_api_key: e.target.value }))} placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx" />
          </Field>
          <Field label="SMS Sender Name" hint="Up to 11 chars. Alphanumeric, no spaces. EU only — US needs a number.">
            <TextInput value={profile.brevo_sms_sender ?? ''} onChange={e => setProfile(p => ({ ...p, brevo_sms_sender: e.target.value }))} placeholder="FastBuySell" maxLength={11} />
          </Field>
          <SaveBtn saving={savingSms} saved={savedSms} color="#FF9500" />
        </form>
      </Card>
    </div>
  )
}
