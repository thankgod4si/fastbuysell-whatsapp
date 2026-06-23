'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Users, Search, Filter, MoreVertical, Phone, Mail, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  last_visit: string
  preferred_stylist: string
  hair_type: string
  total_spend: number
  status: 'active' | 'at_risk' | 'lost'
  health_score: number
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#059669', bg: '#ECFDF5' },
  at_risk: { label: 'At Risk', color: '#D97706', bg: '#FFFBEB' },
  lost: { label: 'Lost', color: '#DC2626', bg: '#FEF2F2' }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'at_risk' | 'lost'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return

      // Simulated customer data - in production, fetch from database
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Mrs. Bola',
          phone: '+234 801 234 5678',
          email: 'bola@email.com',
          last_visit: '2026-05-20',
          preferred_stylist: 'Blessing',
          hair_type: 'Low Porosity',
          total_spend: 245000,
          status: 'active',
          health_score: 85
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '+234 802 345 6789',
          email: 'sarah@email.com',
          last_visit: '2026-03-20',
          preferred_stylist: 'Anita',
          hair_type: 'High Porosity',
          total_spend: 180000,
          status: 'at_risk',
          health_score: 42
        },
        {
          id: '3',
          name: 'Chioma Okafor',
          phone: '+234 803 456 7890',
          email: 'chioma@email.com',
          last_visit: '2026-02-10',
          preferred_stylist: 'Blessing',
          hair_type: 'Normal Porosity',
          total_spend: 95000,
          status: 'lost',
          health_score: 18
        }
      ]

      setCustomers(mockCustomers)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    at_risk: customers.filter(c => c.status === 'at_risk').length,
    lost: customers.filter(c => c.status === 'lost').length,
    avg_health: Math.round(customers.reduce((s, c) => s + c.health_score, 0) / customers.length) || 0
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Customer Management</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track customer health, journeys, and retention</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#8B5CF6]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Customers</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Active</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={20} className="text-[#D97706]" />
            <span className="text-xs font-semibold text-[#8E8E93]">At Risk</span>
          </div>
          <p className="text-2xl font-black text-[#D97706]">{stats.at_risk}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Avg Health Score</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">{stats.avg_health}/100</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full bg-white border border-black/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'at_risk', 'lost'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f 
                  ? 'bg-[#8B5CF6] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-[#8E8E93]">Loading customers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Total Spend</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Health Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white font-bold text-sm">
                          {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1C1C1E] text-sm">{customer.name}</p>
                          <p className="text-xs text-[#8E8E93]">{customer.hair_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                          <Phone size={12} />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                          <Mail size={12} />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                        <Calendar size={12} />
                        {new Date(customer.last_visit).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <p className="text-xs text-[#8E8E93] mt-1">Stylist: {customer.preferred_stylist}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1C1E] text-sm">₦{customer.total_spend.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${customer.health_score}%`,
                              background: customer.health_score >= 70 ? '#059669' : customer.health_score >= 40 ? '#D97706' : '#DC2626'
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1C1C1E]">{customer.health_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ 
                          background: STATUS_CONFIG[customer.status].bg,
                          color: STATUS_CONFIG[customer.status].color
                        }}
                      >
                        {STATUS_CONFIG[customer.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white font-black text-xl">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#1C1C1E]">{selectedCustomer.name}</h2>
                    <p className="text-sm text-[#8E8E93]">{selectedCustomer.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ 
                          background: STATUS_CONFIG[selectedCustomer.status].bg,
                          color: STATUS_CONFIG[selectedCustomer.status].color
                        }}
                      >
                        {STATUS_CONFIG[selectedCustomer.status].label}
                      </span>
                      <span className="text-xs font-bold text-[#8E8E93]">Health: {selectedCustomer.health_score}/100</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-[#8E8E93] hover:text-[#1C1C1E]">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase mb-1">Hair Type</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedCustomer.hair_type}</p>
                </div>
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase mb-1">Preferred Stylist</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedCustomer.preferred_stylist}</p>
                </div>
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase mb-1">Total Spend</p>
                  <p className="font-bold text-[#059669]">₦{selectedCustomer.total_spend.toLocaleString()}</p>
                </div>
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase mb-1">Last Visit</p>
                  <p className="font-semibold text-[#1C1C1E]">{new Date(selectedCustomer.last_visit).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Hair Journey Timeline */}
              <div>
                <h3 className="font-bold text-[#1C1C1E] mb-4">Hair Journey Timeline</h3>
                <div className="space-y-4">
                  {[
                    { date: 'May 20, 2026', service: 'Frontal Install' },
                    { date: 'Apr 12, 2026', service: 'Wig Installation' },
                    { date: 'Feb 28, 2026', service: 'Scalp Treatment' },
                    { date: 'Jan 10, 2026', service: 'Knotless Braids' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                        {i < 3 && <div className="w-0.5 h-full bg-[#E5E7EB] mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-[#1C1C1E] text-sm">{item.service}</p>
                        <p className="text-xs text-[#8E8E93]">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
