import Link from 'next/link'

const NAV_LINKS = ['Features', 'How It Works', 'Pricing']

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'WhatsApp Bulk Outreach',
    desc: 'Send approved template messages to thousands of contacts. Automated cron sends one every 20 seconds — no spam triggers, no blocks.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Email Campaign Blasts',
    desc: 'Upload a CSV or add contacts manually. Write your template once with {{name}} personalisation and blast to your entire list instantly.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Automatic Lead Capture',
    desc: 'When contacts reply with interest, a WhatsApp Flow collects their full details — name, email, requirements — and saves them to your dashboard.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Unified Dashboard',
    desc: 'One clean interface to manage contacts, track leads through your pipeline, run campaigns, and monitor delivery — everything in one place.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
]

const STEPS = [
  { n: '01', title: 'Add Your Contacts', desc: 'Paste phone numbers or upload a CSV. The system detects, deduplicates, and saves them to your queue instantly.' },
  { n: '02', title: 'Set Your Message', desc: 'Choose a WhatsApp template or write an email campaign. Preview exactly what your contacts will receive before sending.' },
  { n: '03', title: 'Watch Leads Come In', desc: 'Cron sends automatically. Interested contacts fill a form. Leads land on your dashboard ready to close.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    desc: 'Perfect for small teams getting started with outreach.',
    features: ['1,000 contacts', '3 email campaigns', 'WhatsApp template sending', 'Lead capture dashboard', 'Email support'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$79',
    desc: 'For growing teams who need more volume and campaigns.',
    features: ['10,000 contacts', 'Unlimited campaigns', 'Automated cron sending', 'WhatsApp Flows', 'Priority support'],
    cta: 'Get started',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$199',
    desc: 'High-volume outreach with dedicated support.',
    features: ['Unlimited contacts', 'Unlimited campaigns', 'Custom templates', 'Dedicated account manager', 'SLA guarantee'],
    cta: 'Contact us',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M11.5 2C6.253 2 2 6.253 2 11.5c0 1.67.444 3.237 1.22 4.594L2 22l6.094-1.196A9.459 9.459 0 0011.5 21C16.747 21 21 16.747 21 11.5S16.747 2 11.5 2z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">OutreachHQ</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.08)_0%,_transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            WhatsApp + Email outreach, automated
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Turn cold outreach
            <br />
            <span className="text-green-400">into real leads</span>
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Send WhatsApp templates and email campaigns at scale. Capture lead details automatically. Manage your entire pipeline from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-bold text-base px-8 py-3.5 rounded-xl transition-colors shadow-xl shadow-green-500/20 w-full sm:w-auto">
              Start for free
            </Link>
            <Link href="/login" className="border border-gray-700 hover:border-gray-500 text-white text-base px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto">
              Sign in to dashboard →
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-6">No credit card required · Setup in 5 minutes</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950 z-10 bottom-0 h-32 top-auto" />
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 bg-gray-800 rounded-md h-6 mx-4" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[['20', 'In Queue', 'text-amber-400'], ['147', 'Sent', 'text-blue-400'], ['38', 'Leads', 'text-green-400']].map(([v, l, c]) => (
                <div key={l} className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className={`font-bold text-2xl tabular-nums ${c}`}>{v}</p>
                  <p className="text-gray-600 text-xs mt-1">{l}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              {[
                ['Hans Müller', 'BMW 5er · €28,500', 'new'],
                ['Klaus Weber', 'Mercedes E-Klasse · €41,000', 'contacted'],
                ['Andreas Meyer', 'Porsche Cayenne · €52,000', 'closed'],
              ].map(([name, car, status]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                      {name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="text-xs text-gray-500">{car}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    status === 'new' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to close more deals</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">One platform for WhatsApp outreach, email campaigns, and lead management. Built for teams who move fast.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-7 hover:border-gray-700 transition-colors">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Up and running in minutes</h2>
            <p className="text-gray-400 text-lg">No technical setup. No API headaches. Just results.</p>
          </div>
          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-6 items-start bg-gray-900 border border-gray-800 rounded-2xl p-7">
                <span className="text-green-400 font-bold text-3xl font-mono tabular-nums shrink-0 mt-1">{s.n}</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-lg">Start free. Scale as you grow. Cancel any time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-7 flex flex-col relative ${
                p.highlight
                  ? 'bg-green-500 text-black'
                  : 'bg-gray-900 border border-gray-800 text-white'
              }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                    Most popular
                  </div>
                )}
                <div>
                  <p className={`font-semibold text-sm mb-1 ${p.highlight ? 'text-black/70' : 'text-gray-400'}`}>{p.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className={`text-sm mb-1.5 ${p.highlight ? 'text-black/60' : 'text-gray-500'}`}>/month</span>
                  </div>
                  <p className={`text-sm mb-6 leading-relaxed ${p.highlight ? 'text-black/70' : 'text-gray-400'}`}>{p.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={p.highlight ? 'text-black' : 'text-green-400'}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/signup" className={`block text-center font-bold py-3 rounded-xl transition-colors mt-auto ${
                  p.highlight
                    ? 'bg-black text-green-400 hover:bg-gray-900'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                }`}>
                  {p.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gray-900 border border-gray-800 rounded-3xl p-14">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to grow your pipeline?</h2>
          <p className="text-gray-400 text-lg mb-8">Join hundreds of businesses using OutreachHQ to automate their outreach and close more deals.</p>
          <Link href="/signup" className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold text-lg px-10 py-4 rounded-xl transition-colors shadow-xl shadow-green-500/20">
            Start for free — no card needed
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M11.5 2C6.253 2 2 6.253 2 11.5c0 1.67.444 3.237 1.22 4.594L2 22l6.094-1.196A9.459 9.459 0 0011.5 21C16.747 21 21 16.747 21 11.5S16.747 2 11.5 2z" />
              </svg>
            </div>
            <span className="font-bold text-sm">OutreachHQ</span>
          </div>
          <p className="text-gray-600 text-sm">© 2025 OutreachHQ. All rights reserved.</p>
          <div className="flex items-center gap-6 text-gray-600 text-sm">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
