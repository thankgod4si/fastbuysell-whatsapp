'use client'

import { useEffect, useState } from 'react'

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
}

type WaStep = 'idle' | 'awaiting_code' | 'verified'

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

  const [waStep,     setWaStep]     = useState<WaStep>('idle')
  const [waError,    setWaError]    = useState('')
  const [waWorking,  setWaWorking]  = useState(false)
  const [cc,          setCc]         = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin,         setPin]         = useState('')
  const [codeMethod,  setCodeMethod]  = useState<'SMS' | 'VOICE'>('SMS')
  const [verifyCode,  setVerifyCode]  = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: Partial<Profile>) => {
        setProfile(d)
        if (d.wa_verified)          setWaStep('verified')
        else if (d.wa_phone_number_id) setWaStep('awaiting_code')
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

  async function registerNumber(e: React.FormEvent) {
    e.preventDefault(); setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cc, phone_number: phoneNumber, display_name: displayName, pin }),
    })
    const data = await res.json()
    if (!res.ok) { setWaError(data.error); setWaWorking(false); return }
    await requestCode()
    setWaStep('awaiting_code')
  }

  async function requestCode() {
    setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: codeMethod }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) setWaError(data.error)
  }

  async function verifyNumber(e: React.FormEvent) {
    e.preventDefault(); setWaError(''); setWaWorking(true)
    const res = await fetch('/api/whatsapp/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: verifyCode }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) { setWaError(data.error); return }
    setWaStep('verified')
    setProfile(p => ({ ...p, wa_phone_number: `+${cc}${phoneNumber}`, wa_verified: true }))
  }

  function disconnectNumber() {
    patch({ wa_phone_number_id: null, wa_phone_number: null, wa_display_name: null, wa_verified: false })
    setWaStep('idle')
    setProfile(p => ({ ...p, wa_phone_number: '', wa_phone_number_id: '', wa_verified: false }))
    setCc(''); setPhoneNumber(''); setDisplayName(''); setPin(''); setVerifyCode('')
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

      {/* WhatsApp */}
      <Card>
        <CardHeader title="WhatsApp" subtitle="Register your own number under this platform's Business Account." />
        <div className="p-6">

          {waStep === 'verified' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: '#34C75910', border: '1px solid #34C75920' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#34C759' }}>Number connected</p>
                  <p className="text-[#8E8E93] text-xs font-mono mt-0.5">{profile.wa_phone_number}</p>
                </div>
              </div>
              <p className="text-[#8E8E93] text-xs leading-relaxed">
                Contacts you add will be sent from this number. Your WhatsApp template must be approved in Meta Business Manager under this number.
              </p>
              <button onClick={disconnectNumber} className="text-xs font-semibold text-[#FF3B30] hover:opacity-70 transition-opacity">
                Disconnect number
              </button>
            </div>
          )}

          {waStep === 'awaiting_code' && (
            <form onSubmit={verifyNumber} className="space-y-4">
              <p className="text-[#8E8E93] text-sm">
                Verification code sent to <span className="text-[#1C1C1E] font-mono font-semibold">+{cc}{phoneNumber}</span> via {codeMethod}.
              </p>
              <Field label="Verification Code">
                <TextInput value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="123456" maxLength={6} />
              </Field>
              {waError && <p className="text-[#FF3B30] text-xs">{waError}</p>}
              <div className="flex items-center gap-3">
                <button type="submit" disabled={waWorking || verifyCode.length < 6}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#25D366' }}>
                  {waWorking ? 'Verifying…' : 'Verify'}
                </button>
                <button type="button" onClick={requestCode} disabled={waWorking}
                  className="text-sm text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                  Resend via {codeMethod === 'SMS' ? 'Voice' : 'SMS'}
                </button>
              </div>
            </form>
          )}

          {waStep === 'idle' && (
            <form onSubmit={registerNumber} className="space-y-4">
              <p className="text-[#8E8E93] text-xs leading-relaxed">
                The number must not be registered on personal WhatsApp or another Business Account.
              </p>
              <div className="flex gap-3">
                <div className="w-24">
                  <Field label="Country Code">
                    <TextInput value={cc} onChange={e => setCc(e.target.value.replace(/\D/g, ''))} placeholder="49" maxLength={4} />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Phone Number">
                    <TextInput value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="1712345678" />
                  </Field>
                </div>
              </div>
              <Field label="Business Display Name" hint="Shown to recipients. Must match your Meta verified name.">
                <TextInput value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Fast Buy & Sell Berlin" />
              </Field>
              <Field label="2FA PIN" hint="6-digit PIN required by WhatsApp for two-step verification.">
                <TextInput type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" maxLength={6} />
              </Field>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">Verify via</span>
                {(['SMS', 'VOICE'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setCodeMethod(m)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={codeMethod === m
                      ? { background: '#25D36612', color: '#25D366', borderColor: '#25D36630' }
                      : { background: 'transparent', color: '#8E8E93', borderColor: '#E5E5EA' }}>
                    {m}
                  </button>
                ))}
              </div>
              {waError && <p className="text-[#FF3B30] text-xs">{waError}</p>}
              <button type="submit" disabled={waWorking || !cc || !phoneNumber || !displayName || pin.length < 6}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
                {waWorking ? 'Registering…' : 'Register Number'}
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}
