import Link from 'next/link'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        <path d="M12 0C5.373 0 0 5.373 0 12a11.952 11.952 0 001.636 6.062L0 24l6.134-1.612A11.944 11.944 0 0012 24c6.624 0 12-5.373 12-12S18.614 0 11.99 0z" />
      </svg>
    ),
    title: 'WhatsApp Blast Campaigns',
    desc: 'Send Meta-approved template messages to thousands of contacts. Throttled delivery — one every 20 seconds — keeps your number safe from bans.',
    color: '#25D366',
    grad: 'linear-gradient(135deg,#25D36610,#25D36605)',
    border: '#25D36625',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Email Campaign Blasts',
    desc: 'Upload a CSV, write your template with {{name}} personalisation, and blast your full list instantly through your own Resend domain.',
    color: '#5856D6',
    grad: 'linear-gradient(135deg,#5856D610,#5856D605)',
    border: '#5856D625',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Automatic Lead Capture',
    desc: 'When a contact replies with interest, a WhatsApp Flow captures their name, email, and budget — saved to your CRM dashboard instantly.',
    color: '#AF52DE',
    grad: 'linear-gradient(135deg,#AF52DE10,#AF52DE05)',
    border: '#AF52DE25',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Unified CRM Dashboard',
    desc: 'Track every lead through your pipeline. See who replied, who converted, and who needs follow-up — all from a single clean dashboard.',
    color: '#FF9500',
    grad: 'linear-gradient(135deg,#FF950010,#FF950005)',
    border: '#FF950025',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Get Your WhatsApp Number',
    desc: 'Pay ₦15,000 once. We register a Meta Cloud API number for you in your preferred country. Ready within hours.',
  },
  {
    n: '02',
    title: 'Load Your Contact List',
    desc: 'Paste numbers or upload a CSV. The system deduplicates and saves them to your queue. No technical setup needed.',
  },
  {
    n: '03',
    title: 'Send & Collect Leads',
    desc: 'Pick a template, top up credits, and blast. Replies flow into your inbox. Interested contacts become pipeline leads automatically.',
  },
]

const PACKS = [
  { label: 'Starter',  credits: '200',    price: '₦22,000',   per: '₦110/msg', color: '#007AFF' },
  { label: 'Growth',   credits: '1,000',  price: '₦100,000',  per: '₦100/msg', color: '#5856D6', popular: true },
  { label: 'Pro',      credits: '5,000',  price: '₦475,000',  per: '₦95/msg',  color: '#FF9500' },
  { label: 'Scale',    credits: '10,000', price: '₦900,000',  per: '₦90/msg',  color: '#34C759' },
]

const MESSAGES = [
  {
    biz: 'Trendy Lagos Boutique',
    avatar: 'T',
    color: '#AF52DE',
    msg: 'Hi {{name}} 👗 Our new Ankara collection just dropped! Limited pieces. Reply "YES" to get the lookbook sent to you now.',
    stat: '847 sent · 312 replied · 89 converted',
  },
  {
    biz: 'Chukwudi Real Estate',
    avatar: 'C',
    color: '#25D366',
    msg: 'Good morning {{name}}! 🏠 3-bed apartment in Lekki Phase 1 just listed at ₦45M. Flexible payment. Want the virtual tour?',
    stat: '1,240 sent · 198 replied · 41 booked',
  },
  {
    biz: 'Signature Spa & Wellness',
    avatar: 'S',
    color: '#FF9500',
    msg: 'Hey {{name}} 💆‍♀️ Book your December package before Friday and get a FREE aromatherapy add-on. Only 12 slots left!',
    stat: '520 sent · 167 replied · 94 booked',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1C1C1E]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 3px 10px rgba(37,211,102,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                <path d="M12 0C5.373 0 0 5.373 0 12a11.952 11.952 0 001.636 6.062L0 24l6.134-1.612A11.944 11.944 0 0012 24c6.624 0 12-5.373 12-12S18.614 0 11.99 0z" />
              </svg>
            </div>
            <span className="font-bold text-[#1C1C1E] text-[17px]">OutreachHQ</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[#3C3C43] hover:text-[#1C1C1E] text-sm transition-colors">{l}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm transition-colors">Sign in</Link>
            <Link href="/signup"
              className="text-white text-sm font-bold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 3px 12px rgba(37,211,102,0.3)' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#25D36640,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#5856D640,transparent 70%)', filter: 'blur(50px)' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
            style={{ background: '#25D36610', border: '1px solid #25D36630', color: '#1DB954' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#25D366' }} />
            WhatsApp + Email outreach, fully automated
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05] text-[#1C1C1E]">
            Reach thousands.
            <br />
            <span style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Close more deals.
            </span>
          </h1>

          <p className="text-[#6C6C70] text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Send personalised WhatsApp blasts and email campaigns to your entire contact list. Capture leads automatically. One dashboard — every conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="text-white font-bold text-base px-8 py-4 rounded-2xl transition-opacity hover:opacity-90 shadow-xl w-full sm:w-auto text-center"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}>
              Start sending — free trial
            </Link>
            <Link href="/login"
              className="text-[#3C3C43] font-semibold text-base px-8 py-4 rounded-2xl transition-all hover:bg-black/[0.04] w-full sm:w-auto text-center"
              style={{ border: '1.5px solid rgba(0,0,0,0.1)' }}>
              Sign in to dashboard →
            </Link>
          </div>
          <p className="text-[#C7C7CC] text-sm mt-5">No credit card required · WhatsApp number included from ₦15,000</p>
        </div>

        {/* Fake message previews — glass cards */}
        <div className="max-w-4xl mx-auto mt-20 space-y-4">
          {MESSAGES.map(m => (
            <div key={m.biz}
              className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: m.color }}>
                {m.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                  <span className="font-bold text-[#1C1C1E] text-sm">{m.biz}</span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: m.color }}>Campaign Active</span>
                </div>
                <p className="text-[#3C3C43] text-sm leading-relaxed mb-2">{m.msg}</p>
                <p className="text-[#8E8E93] text-[11px] font-medium">{m.stat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background: '#F9F9F9' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-[#1C1C1E]">Everything you need to grow faster</h2>
            <p className="text-[#6C6C70] text-lg max-w-2xl mx-auto">One platform for WhatsApp outreach, email campaigns, and lead management. Built for Nigerian businesses moving at speed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-7 transition-all hover:shadow-lg"
                style={{ background: f.grad, border: `1.5px solid ${f.border}` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${f.color}18`, color: f.color, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="font-black text-xl mb-2 text-[#1C1C1E]">{f.title}</h3>
                <p className="text-[#6C6C70] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-[#1C1C1E]">Up and running in hours</h2>
            <p className="text-[#6C6C70] text-lg">No technical setup. No API headaches. We handle the hard parts.</p>
          </div>
          <div className="space-y-4">
            {STEPS.map(s => (
              <div key={s.n}
                className="flex gap-5 items-start p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <span className="text-3xl font-black font-mono tabular-nums shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.n}
                </span>
                <div>
                  <h3 className="font-black text-lg mb-1.5 text-[#1C1C1E]">{s.title}</h3>
                  <p className="text-[#6C6C70] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#F9F9F9' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-[#1C1C1E]">Pay only for what you send</h2>
            <p className="text-[#6C6C70] text-lg">1 credit = 1 WhatsApp message. Credits never expire. No monthly fees.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PACKS.map(p => (
              <div key={p.label}
                className="rounded-2xl p-5 flex flex-col relative"
                style={{
                  background: p.popular ? `linear-gradient(135deg,${p.color}15,${p.color}08)` : 'white',
                  border: p.popular ? `2px solid ${p.color}40` : '1.5px solid rgba(0,0,0,0.08)',
                  boxShadow: p.popular ? `0 4px 20px ${p.color}20` : '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: p.color }}>Best Value</span>
                )}
                <p className="text-[#8E8E93] text-xs font-semibold mb-1">{p.label}</p>
                <p className="font-black text-3xl tabular-nums" style={{ color: p.color }}>{p.credits}</p>
                <p className="text-[#8E8E93] text-xs mb-3">credits</p>
                <p className="font-black text-[#1C1C1E] text-lg mt-auto">{p.price}</p>
                <p className="text-[#8E8E93] text-[11px]">{p.per}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#8E8E93] text-sm mt-6">
            WhatsApp number: one-time ₦15,000 setup fee · Credits top-up via bank transfer
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-14 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 16px 48px rgba(37,211,102,0.35)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right,rgba(255,255,255,0.12),transparent 60%)' }} />
          <h2 className="text-4xl font-black mb-4 text-white relative">Ready to grow your pipeline?</h2>
          <p className="text-white/80 text-lg mb-8 relative">Join businesses across Nigeria using OutreachHQ to run professional WhatsApp campaigns and close more deals.</p>
          <Link href="/signup"
            className="inline-block font-black text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 relative"
            style={{ background: 'white', color: '#25D366', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            Get started — free trial
          </Link>
          <p className="text-white/60 text-sm mt-4 relative">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ background: '#F9F9F9', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
            </div>
            <span className="font-bold text-[#1C1C1E] text-sm">OutreachHQ</span>
          </div>
          <p className="text-[#C7C7CC] text-sm">© 2025 OutreachHQ. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[#8E8E93] text-sm">
            <a href="#" className="hover:text-[#1C1C1E] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1C1C1E] transition-colors">Terms</a>
            <Link href="/login" className="hover:text-[#1C1C1E] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
