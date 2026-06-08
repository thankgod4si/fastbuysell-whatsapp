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
}

type WaStep = 'idle' | 'registering' | 'awaiting_code' | 'verified'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      <p className="text-white font-semibold text-sm">{title}</p>
      {children}
    </div>
  )
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-gray-600 text-xs mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-gray-800 border border-gray-700 focus:border-green-500/50 text-white text-sm rounded-lg px-4 py-2.5 outline-none transition-colors placeholder:text-gray-600"
    />
  )
}

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
    >
      {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
    </button>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  // Email save state
  const [savingEmail, setSavingEmail] = useState(false)
  const [savedEmail, setSavedEmail] = useState(false)

  // SMS save state
  const [savingSms, setSavingSms] = useState(false)
  const [savedSms, setSavedSms] = useState(false)

  // WhatsApp registration state
  const [waStep, setWaStep] = useState<WaStep>('idle')
  const [waError, setWaError] = useState('')
  const [waWorking, setWaWorking] = useState(false)

  // WhatsApp form fields
  const [cc, setCc] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [codeMethod, setCodeMethod] = useState<'SMS' | 'VOICE'>('SMS')
  const [verifyCode, setVerifyCode] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: Partial<Profile>) => {
        setProfile(d)
        if (d.wa_verified) setWaStep('verified')
        else if (d.wa_phone_number_id) setWaStep('awaiting_code')
        setLoading(false)
      })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: profile.full_name,
        reply_to_email: profile.reply_to_email,
      }),
    })
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
  }

  async function saveSms(e: React.FormEvent) {
    e.preventDefault()
    setSavingSms(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brevo_api_key: profile.brevo_api_key,
        brevo_sms_sender: profile.brevo_sms_sender,
      }),
    })
    setSavingSms(false)
    setSavedSms(true)
    setTimeout(() => setSavedSms(false), 2500)
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resend_api_key: profile.resend_api_key,
        email_from: profile.email_from,
      }),
    })
    setSavingEmail(false)
    setSavedEmail(true)
    setTimeout(() => setSavedEmail(false), 2500)
  }

  async function registerNumber(e: React.FormEvent) {
    e.preventDefault()
    setWaError('')
    setWaWorking(true)
    const res = await fetch('/api/whatsapp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cc, phone_number: phoneNumber, display_name: displayName, pin }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) { setWaError(data.error); return }

    // Request code immediately after registration
    await requestCode()
    setWaStep('awaiting_code')
  }

  async function requestCode() {
    setWaError('')
    setWaWorking(true)
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
    e.preventDefault()
    setWaError('')
    setWaWorking(true)
    const res = await fetch('/api/whatsapp/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: verifyCode }),
    })
    const data = await res.json()
    setWaWorking(false)
    if (!res.ok) { setWaError(data.error); return }
    setWaStep('verified')
    setProfile(p => ({ ...p, wa_phone_number: `+${cc}${phoneNumber}` }))
  }

  function disconnectNumber() {
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wa_phone_number_id: null,
        wa_phone_number: null,
        wa_display_name: null,
        wa_verified: false,
      }),
    })
    setWaStep('idle')
    setProfile(p => ({ ...p, wa_phone_number: '', wa_phone_number_id: '', wa_verified: false }))
    setCc(''); setPhoneNumber(''); setDisplayName(''); setPin(''); setVerifyCode('')
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your profile, email domain, and WhatsApp number</p>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile">
        <form onSubmit={saveProfile} className="space-y-4">
          <Field label="Your Name">
            <Input
              value={profile.full_name ?? ''}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Hans Müller"
            />
          </Field>
          <Field
            label="Reply-To Email"
            hint="Seller replies land here — your own inbox. Leave blank to use the platform default."
          >
            <Input
              type="email"
              value={profile.reply_to_email ?? ''}
              onChange={e => setProfile(p => ({ ...p, reply_to_email: e.target.value }))}
              placeholder="you@yourcompany.com"
            />
          </Field>
          <SaveButton saving={savingProfile} saved={savedProfile} />
        </form>
      </Section>

      {/* ── Email Domain ── */}
      <Section title="Email Domain">
        <p className="text-gray-600 text-xs -mt-3">
          Connect your own Resend account so emails go from your domain instead of trysofi.co.{' '}
          <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-green-500 hover:underline">
            Get a free Resend account →
          </a>
        </p>
        <form onSubmit={saveEmail} className="space-y-4">
          <Field
            label="Resend API Key"
            hint="From resend.com → API Keys. Starts with re_"
          >
            <Input
              value={profile.resend_api_key ?? ''}
              onChange={e => setProfile(p => ({ ...p, resend_api_key: e.target.value }))}
              placeholder="re_xxxxxxxxxxxxxxxxxxxx"
              type="password"
            />
          </Field>
          <Field
            label="From Address"
            hint="Must be a verified domain in your Resend account."
          >
            <Input
              value={profile.email_from ?? ''}
              onChange={e => setProfile(p => ({ ...p, email_from: e.target.value }))}
              placeholder="Fast Buy & Sell <hello@yourdomain.com>"
            />
          </Field>
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Setup steps:</strong>
            <ol className="mt-1 ml-3 space-y-0.5 list-decimal">
              <li>Create a free account at resend.com</li>
              <li>Go to Domains → Add Domain → add your domain</li>
              <li>Add the DNS records Resend shows you (takes ~5 min)</li>
              <li>Copy your API key and paste above</li>
            </ol>
          </div>
          <SaveButton saving={savingEmail} saved={savedEmail} />
        </form>
      </Section>

      {/* ── SMS (Brevo) ── */}
      <Section title="SMS (Brevo)">
        <p className="text-gray-600 text-xs -mt-3">
          Use your Brevo account to send bulk SMS worldwide.{' '}
          <a href="https://brevo.com" target="_blank" rel="noreferrer" className="text-green-500 hover:underline">
            Get a free Brevo account →
          </a>
        </p>
        <form onSubmit={saveSms} className="space-y-4">
          <Field label="Brevo API Key" hint="From brevo.com → Settings → API Keys">
            <Input
              type="password"
              value={profile.brevo_api_key ?? ''}
              onChange={e => setProfile(p => ({ ...p, brevo_api_key: e.target.value }))}
              placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
          <Field
            label="SMS Sender Name"
            hint="Up to 11 characters shown as sender. Alphanumeric, no spaces. EU only — US requires a number."
          >
            <Input
              value={profile.brevo_sms_sender ?? ''}
              onChange={e => setProfile(p => ({ ...p, brevo_sms_sender: e.target.value }))}
              placeholder="FastBuySell"
              maxLength={11}
            />
          </Field>
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Setup steps:</strong>
            <ol className="mt-1 ml-3 space-y-0.5 list-decimal">
              <li>Sign up at brevo.com (free)</li>
              <li>Go to Settings → API Keys → Generate a new key</li>
              <li>Make sure SMS is enabled on your account (Brevo dashboard → SMS)</li>
              <li>Paste the API key above and set your sender name</li>
            </ol>
          </div>
          <SaveButton saving={savingSms} saved={savedSms} />
        </form>
      </Section>

      {/* ── WhatsApp Number ── */}
      <Section title="WhatsApp Number">
        {waStep === 'verified' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div>
                <p className="text-green-400 text-sm font-semibold">Number Connected</p>
                <p className="text-gray-400 text-xs font-mono mt-0.5">{profile.wa_phone_number}</p>
              </div>
            </div>
            <p className="text-gray-600 text-xs">
              Contacts you add will send from this number. Your WhatsApp template must be approved under this number in Meta Business Manager.
            </p>
            <button
              onClick={disconnectNumber}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Disconnect number
            </button>
          </div>
        )}

        {waStep === 'awaiting_code' && (
          <form onSubmit={verifyNumber} className="space-y-4">
            <p className="text-gray-400 text-sm">
              A verification code was sent to <span className="text-white font-mono">+{cc}{phoneNumber}</span> via {codeMethod}.
            </p>
            <Field label="Verification Code">
              <Input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </Field>
            {waError && <p className="text-red-400 text-xs">{waError}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={waWorking || verifyCode.length < 6}
                className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                {waWorking ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={waWorking}
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Resend via {codeMethod === 'SMS' ? 'Voice' : 'SMS'}
              </button>
            </div>
          </form>
        )}

        {waStep === 'idle' && (
          <form onSubmit={registerNumber} className="space-y-4">
            <p className="text-gray-600 text-xs -mt-3">
              Add your own WhatsApp Business number under this platform. The number must not be registered on personal WhatsApp.
            </p>
            <div className="flex gap-3">
              <div className="w-24">
                <Field label="Country Code">
                  <Input
                    value={cc}
                    onChange={e => setCc(e.target.value.replace(/\D/g, ''))}
                    placeholder="49"
                    maxLength={4}
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Phone Number">
                  <Input
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="1712345678"
                  />
                </Field>
              </div>
            </div>
            <Field
              label="Business Display Name"
              hint="Shown to recipients. Must match your Meta verified name."
            >
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Fast Buy & Sell Berlin"
              />
            </Field>
            <Field
              label="2FA PIN"
              hint="6-digit PIN — required by WhatsApp for two-step verification."
            >
              <Input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                type="password"
              />
            </Field>
            <div className="flex items-center gap-3">
              <label className="text-gray-400 text-sm">Verify via</label>
              {(['SMS', 'VOICE'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCodeMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    codeMethod === m
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'text-gray-500 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {waError && <p className="text-red-400 text-xs">{waError}</p>}
            <button
              type="submit"
              disabled={waWorking || !cc || !phoneNumber || !displayName || pin.length < 6}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
            >
              {waWorking ? 'Registering...' : 'Register Number'}
            </button>
          </form>
        )}
      </Section>
    </div>
  )
}
