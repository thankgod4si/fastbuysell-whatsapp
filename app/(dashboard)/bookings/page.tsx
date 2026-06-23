'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export const dynamic = 'force-dynamic'

interface BookingRow {
  id: string
  customer_name: string
  customer_phone: string
  appointment_date: string
  time_slot: string
  payment_status: string
  service_id: string
  created_at: string
}

interface ProductRow {
  id: string
  name: string
  price: number
  currency: string
}

const SYM: Record<string, string> = { NGN: '₦', EUR: '€', USD: '$', GBP: '£' }

const STATUS: Record<string, { label: string; color: string; bg: string; stripe: string }> = {
  paid:     { label: 'Confirmed',        color: '#059669', bg: '#ECFDF5', stripe: '#10B981' },
  pending:  { label: 'Awaiting payment', color: '#D97706', bg: '#FFFBEB', stripe: '#F59E0B' },
  failed:   { label: 'Failed',           color: '#DC2626', bg: '#FEF2F2', stripe: '#EF4444' },
  refunded: { label: 'Refunded',         color: '#6B7280', bg: '#F9FAFB', stripe: '#9CA3AF' },
}

const PALETTE = ['#8B5CF6', '#007AFF', '#FF6B6B', '#4ECDC4', '#FF9500', '#34C759', '#AF52DE', '#5856D6']
function avatarColor(seed: string) {
  let h = 0
  for (const c of seed) h = ((h << 5) - h) + c.charCodeAt(0)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (name[0] ?? '?').toUpperCase()
}
function formatServiceId(id: string) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function dateGroupLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayMs = 86400000
  const diff = Math.round((d.getTime() - today.getTime()) / dayMs)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' })
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
}

function BookingDetailSheet({
  booking,
  service,
  onClose,
}: {
  booking: BookingRow
  service: { name: string; price: number; currency: string }
  onClose: () => void
}) {
  const st = STATUS[booking.payment_status] ?? STATUS.pending
  const sym = SYM[service.currency] ?? '₦'
  const date = new Date(booking.appointment_date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const time = String(booking.time_slot ?? 'TBC')
  const waLink = `https://wa.me/${booking.customer_phone.replace(/\D/g, '')}`
  const color = avatarColor(booking.customer_phone)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:bottom-auto
        bg-white rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-full">
        <div className="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mt-3 md:hidden shrink-0" />

        <div className="px-6 pt-5 pb-6 border-b border-black/[0.06] shrink-0"
          style={{ background: `linear-gradient(165deg, ${st.stripe}14, transparent)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0"
                style={{ background: color, boxShadow: `0 8px 20px ${color}40` }}>
                {initials(booking.customer_name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-[#1C1C1E] font-black text-lg leading-tight truncate">{booking.customer_name}</h2>
                <p className="text-[#8E8E93] text-xs font-mono mt-0.5">{booking.customer_phone}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:bg-[#E5E7EB] shrink-0">
              ✕
            </button>
          </div>
          <span className="inline-flex mt-4 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="rounded-2xl overflow-hidden border border-black/[0.06]">
            <div className="px-4 py-3 bg-[#FAFAFA] border-b border-black/[0.04]">
              <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Appointment</p>
            </div>
            <div className="divide-y divide-[#F2F2F7]">
              {[
                { label: 'Service', value: service.name },
                { label: 'Date', value: date },
                { label: 'Time', value: time },
                ...(service.price > 0 ? [{ label: 'Amount', value: `${sym}${service.price.toLocaleString()}` }] : []),
                { label: 'Booked', value: new Date(booking.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-4 px-4 py-3">
                  <span className="text-xs text-[#8E8E93] shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-[#1C1C1E] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-black/[0.06] flex gap-2 shrink-0 pb-safe">
          <a href={waLink} target="_blank" rel="noreferrer"
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: '#25D366', boxShadow: '0 4px 14px #25D36640' }}>
            Message on WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

function AppointmentCard({
  booking,
  service,
  onOpen,
}: {
  booking: BookingRow
  service: { name: string; price: number; currency: string }
  onOpen: () => void
}) {
  const st = STATUS[booking.payment_status] ?? STATUS.pending
  const sym = SYM[service.currency] ?? '₦'
  const d = new Date(booking.appointment_date + 'T12:00:00')
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const time = String(booking.time_slot ?? '').slice(0, 8) || 'TBC'
  const color = avatarColor(booking.customer_phone)

  return (
    <button type="button" onClick={onOpen}
      className="w-full text-left group relative bg-white rounded-2xl overflow-hidden transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: st.stripe }} />

      <div className="flex items-stretch gap-0 pl-4">
        <div className="flex flex-col items-center justify-center py-4 pr-4 border-r border-[#F2F2F7] min-w-[52px]">
          <span className="text-[9px] font-black text-[#8E8E93] tracking-wider">{month}</span>
          <span className="text-2xl font-black text-[#1C1C1E] leading-none my-0.5">{day}</span>
          <span className="text-[10px] font-semibold text-[#8B5CF6]">{weekday}</span>
        </div>

        <div className="flex-1 flex items-center gap-3 py-4 pr-4 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: color }}>
            {initials(booking.customer_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1C1C1E] text-sm truncate">{booking.customer_name}</p>
            <p className="text-xs text-[#8E8E93] truncate mt-0.5">{service.name}</p>
            <p className="text-[11px] font-semibold text-[#8B5CF6] mt-1">🕐 {time}</p>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
            {service.price > 0 && (
              <p className="font-black text-[#1C1C1E] text-sm">{sym}{service.price.toLocaleString()}</p>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
            <span className="text-[#C7C7CC] text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">›</span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [products, setProducts] = useState<Record<string, ProductRow>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming')
  const [selected, setSelected] = useState<BookingRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) return

    const [{ data: bookingRows }, { data: productRows }] = await Promise.all([
      supabaseBrowser
        .from('bookings')
        .select('id, customer_name, customer_phone, appointment_date, time_slot, payment_status, service_id, created_at')
        .eq('business_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('time_slot', { ascending: true }),
      supabaseBrowser
        .from('products')
        .select('id, name, price, currency')
        .eq('business_id', user.id),
    ])

    setBookings((bookingRows as BookingRow[]) ?? [])
    setProducts(Object.fromEntries(((productRows as ProductRow[]) ?? []).map(p => [p.id, p])))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabaseBrowser
      .channel('bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load())
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [load])

  const resolveService = useCallback((serviceId: string) => {
    const p = products[serviceId]
    if (p) return { name: p.name, price: Number(p.price), currency: p.currency }
    return { name: formatServiceId(serviceId), price: 0, currency: 'NGN' }
  }, [products])

  const today = new Date().toISOString().split('T')[0]
  const filtered = tab === 'upcoming'
    ? bookings.filter(b => b.appointment_date >= today)
    : [...bookings].sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

  const grouped = useMemo(() => {
    const map = new Map<string, BookingRow[]>()
    for (const b of filtered) {
      const label = dateGroupLabel(b.appointment_date)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(b)
    }
    return Array.from(map.entries())
  }, [filtered])

  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((s, b) => s + resolveService(b.service_id).price, 0)
  const currency = bookings[0] ? resolveService(bookings[0].service_id).currency : 'NGN'

  return (
    <div className="max-w-2xl space-y-6 pb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl tracking-tight">Appointments</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">
            Tap any card for full details · updates live
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white rounded-2xl px-4 py-2.5 text-center min-w-[72px]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-xl font-black text-[#8B5CF6]">{bookings.filter(b => b.appointment_date === today).length}</p>
            <p className="text-[10px] font-semibold text-[#8E8E93] uppercase">Today</p>
          </div>
          <div className="bg-white rounded-2xl px-4 py-2.5 text-center min-w-[72px]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-xl font-black text-[#059669]">{SYM[currency] ?? '₦'}{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] font-semibold text-[#8E8E93] uppercase">Revenue</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-[#F2F2F7] p-1 rounded-xl w-fit text-sm font-semibold">
        {(['upcoming', 'all'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>
            {t === 'upcoming' ? 'Upcoming' : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[88px] rounded-2xl bg-gradient-to-r from-[#F2F2F7] via-[#ECECF0] to-[#F2F2F7] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#E5E7EB] p-14 text-center bg-white/50">
          <div className="text-5xl mb-4">📅</div>
          <p className="font-bold text-[#1C1C1E]">No appointments yet</p>
          <p className="text-[#8E8E93] text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Bookings appear here as soon as a customer submits the WhatsApp form — pending until payment is confirmed.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([label, items]) => (
            <section key={label}>
              <h2 className="text-xs font-black text-[#8E8E93] uppercase tracking-widest mb-3 px-1">{label}</h2>
              <div className="space-y-3">
                {items.map(b => (
                  <AppointmentCard
                    key={b.id}
                    booking={b}
                    service={resolveService(b.service_id)}
                    onOpen={() => setSelected(b)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <BookingDetailSheet
          booking={selected}
          service={resolveService(selected.service_id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
