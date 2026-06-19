'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

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

const STATUS_STYLE: Record<string, string> = {
  paid:     'bg-[#D1FAE5] text-[#059669]',
  pending:  'bg-[#FEF3C7] text-[#D97706]',
  failed:   'bg-[#FEE2E2] text-[#DC2626]',
  refunded: 'bg-[#F3F4F6] text-[#6B7280]',
}

const STATUS_LABEL: Record<string, string> = {
  paid:    'Confirmed',
  pending: 'Awaiting payment',
  failed:  'Failed',
  refunded: 'Refunded',
}

function formatServiceId(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [products, setProducts] = useState<Record<string, ProductRow>>({})
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'upcoming' | 'all'>('upcoming')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) return

    const [{ data: bookingRows }, { data: productRows }] = await Promise.all([
      supabaseBrowser
        .from('bookings')
        .select('id, customer_name, customer_phone, appointment_date, time_slot, payment_status, service_id, created_at')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false }),
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

  const resolveService = (serviceId: string) => {
    const p = products[serviceId]
    if (p) return { name: p.name, price: Number(p.price), currency: p.currency }
    return { name: formatServiceId(serviceId), price: 0, currency: 'NGN' }
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = tab === 'upcoming'
    ? bookings.filter(b => b.appointment_date >= today)
    : bookings

  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((s, b) => s + resolveService(b.service_id).price, 0)
  const currency = bookings[0] ? resolveService(bookings[0].service_id).currency : 'NGN'

  return (
    <div className="max-w-4xl space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[#1C1C1E] font-black text-2xl">Appointments</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">
            Bookings appear here as soon as a customer submits the form — pending until they pay
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-2xl px-4 py-3 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-xl font-black text-[#8B5CF6]">{bookings.filter(b => b.appointment_date === today).length}</p>
            <p className="text-xs text-[#8E8E93]">Today</p>
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-xl font-black text-[#059669]">{SYM[currency] ?? '₦'}{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-[#8E8E93]">Revenue</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-[#F2F2F7] p-1 rounded-xl w-fit text-sm font-semibold">
        {(['upcoming', 'all'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? 'bg-white shadow text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>
            {t === 'upcoming' ? 'Upcoming' : 'All Bookings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-[#F2F2F7] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold text-[#1C1C1E] text-sm">No bookings yet</p>
          <p className="text-[#8E8E93] text-xs mt-1 max-w-sm mx-auto">
            When a customer completes the WhatsApp booking form, they&apos;ll show here as &quot;Awaiting payment&quot;.
            Once they pay (transfer, card, or in person), status updates to Confirmed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const svc = resolveService(b.service_id)
            const sym = SYM[svc.currency] ?? '₦'
            const date = new Date(b.appointment_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
            const time = String(b.time_slot ?? '').slice(0, 5)
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 flex items-center gap-4"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="w-14 h-14 rounded-xl bg-[#F5F0FF] flex flex-col items-center justify-center shrink-0">
                  <p className="text-[10px] font-bold text-[#8B5CF6] uppercase">{date.split(' ')[0]}</p>
                  <p className="text-xl font-black text-[#8B5CF6] leading-tight">{date.split(' ')[1]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1C1C1E] text-sm truncate">{b.customer_name}</p>
                  <p className="text-xs text-[#8E8E93]">{svc.name} · {time || 'TBC'}</p>
                  <p className="text-xs text-[#8E8E93] mt-0.5">{b.customer_phone}</p>
                </div>
                <div className="text-right shrink-0">
                  {svc.price > 0 && (
                    <p className="font-black text-[#1C1C1E] text-sm">{sym}{svc.price.toLocaleString()}</p>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[b.payment_status] ?? STATUS_STYLE.pending}`}>
                    {STATUS_LABEL[b.payment_status] ?? b.payment_status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
