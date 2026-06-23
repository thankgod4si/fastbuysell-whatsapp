'use client'

import { useEffect, useState } from 'react'
import { Users, Target, DollarSign, Calendar, TrendingUp, Award, Clock, XCircle, Package, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface StylistLog {
  id: string
  stylist: string
  client: string
  service: string
  date: string
  scalpNotes: string
  status: 'completed' | 'pending' | 'cancelled'
  revenue: number
  productsUsed?: string[]
  detailedNotes?: string
  duration?: number
  clientFeedback?: string
}

export default function StaffPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<StylistLog[]>([])
  const [selectedLog, setSelectedLog] = useState<StylistLog | null>(null)

  useEffect(() => {
    // Mock data - in production, fetch from database
    const mockLogs: StylistLog[] = [
      {
        id: '1',
        stylist: 'Blessing',
        client: 'Mrs. Bola',
        service: 'Frontal Install',
        date: '2026-05-20',
        scalpNotes: 'Sensitive',
        status: 'completed',
        revenue: 45000,
        productsUsed: ['Edge Control', 'Mousse', 'Hair Spray'],
        detailedNotes: 'Customer has sensitive scalp. Used minimal adhesive. Frontal laid perfectly. Customer satisfied with results.',
        duration: 180,
        clientFeedback: 'Excellent service, very gentle with my scalp.'
      },
      {
        id: '2',
        stylist: 'Anita',
        client: 'Sarah Johnson',
        service: 'Knotless Braids',
        date: '2026-06-12',
        scalpNotes: 'Dry Scalp',
        status: 'completed',
        revenue: 35000,
        productsUsed: ['Braiding Hair', 'Edge Control', 'Oil'],
        detailedNotes: 'Applied scalp oil before braiding. Used medium tension. Customer requested medium-sized parts.',
        duration: 240,
        clientFeedback: 'Braids are neat and not too tight.'
      },
      {
        id: '3',
        stylist: 'Blessing',
        client: 'Chioma Okafor',
        service: 'Wig Installation',
        date: '2026-06-15',
        scalpNotes: 'Normal',
        status: 'completed',
        revenue: 40000,
        productsUsed: ['Wig Cap', 'Adhesive', 'Tweezers'],
        detailedNotes: 'Customized wig to fit customer\'s head shape. Plucked hairline for natural look.',
        duration: 90,
        clientFeedback: 'Wig looks very natural, thank you!'
      },
      {
        id: '4',
        stylist: 'Anita',
        client: 'Grace Adeleke',
        service: 'Silk Press',
        date: '2026-06-18',
        scalpNotes: 'Heat Damaged',
        status: 'pending',
        revenue: 25000,
        productsUsed: ['Heat Protectant', 'Silk Press Oil', 'Serum'],
        detailedNotes: 'Customer has heat damage. Used low heat setting. Applied protein treatment before pressing.',
        duration: 120,
        clientFeedback: undefined
      }
    ]

    setLogs(mockLogs)
    setLoading(false)
  }, [])

  const stylistStats = [
    { name: 'Blessing', clientsServed: 45, revenue: 895000, servicesCompleted: 42, followUpsNeeded: 3 },
    { name: 'Anita', clientsServed: 38, revenue: 675000, servicesCompleted: 36, followUpsNeeded: 5 },
    { name: 'Chisom', clientsServed: 28, revenue: 485000, servicesCompleted: 27, followUpsNeeded: 2 },
  ]

  const topStylist = stylistStats.reduce((prev, current) => 
    prev.revenue > current.revenue ? prev : current
  )

  const totalStats = {
    clientsServed: stylistStats.reduce((s, s2) => s + s2.clientsServed, 0),
    revenue: stylistStats.reduce((s, s2) => s + s2.revenue, 0),
    servicesCompleted: stylistStats.reduce((s, s2) => s + s2.servicesCompleted, 0),
    followUpsNeeded: stylistStats.reduce((s, s2) => s + s2.followUpsNeeded, 0),
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Staff Portal</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track stylist performance and service logs</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Clients Served</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{totalStats.clientsServed}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Revenue</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">₦{totalStats.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Services Completed</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{totalStats.servicesCompleted}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Follow-Ups Needed</span>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{totalStats.followUpsNeeded}</p>
        </div>
      </div>

      {/* Top Performer */}
      <div className="bg-gradient-to-r from-[#007AFF] to-[#D946EF] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award size={24} />
          <h3 className="font-bold text-lg">Top Performing Stylist</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-black">{topStylist.name}</p>
            <p className="text-white/70 text-sm mt-1">₦{topStylist.revenue.toLocaleString()} revenue generated</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{topStylist.clientsServed}</p>
            <p className="text-white/70 text-xs">clients served</p>
          </div>
        </div>
      </div>

      {/* Stylist Performance */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h3 className="font-bold text-[#1C1C1E]">Stylist Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Stylist</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Clients Served</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Revenue Generated</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Services Completed</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Follow-Ups Needed</th>
              </tr>
            </thead>
            <tbody>
              {stylistStats.map((stylist, i) => (
                <tr key={i} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#D946EF] flex items-center justify-center text-white font-bold text-sm">
                        {stylist.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="font-semibold text-[#1C1C1E]">{stylist.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{stylist.clientsServed}</td>
                  <td className="px-6 py-4 font-bold text-[#059669]">₦{stylist.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{stylist.servicesCompleted}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      stylist.followUpsNeeded === 0 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {stylist.followUpsNeeded}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Service Logs */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h3 className="font-bold text-[#1C1C1E]">Recent Service Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Stylist</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Scalp Notes</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{log.stylist}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{log.client}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{log.service}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{log.scalpNotes}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      log.status === 'completed' 
                        ? 'bg-green-50 text-green-600' 
                        : log.status === 'pending'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#059669]">₦{log.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1C1C1E]">Service Log Details</h2>
                  <p className="text-sm text-[#8E8E93] mt-1">ID: {selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#8E8E93] hover:text-[#1C1C1E]">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Stylist</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedLog.stylist}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Client</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedLog.client}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Service</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedLog.service}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Date</p>
                  <p className="font-semibold text-[#1C1C1E]">{new Date(selectedLog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Duration</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedLog.duration ? `${Math.floor(selectedLog.duration / 60)}h ${selectedLog.duration % 60}m` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Revenue</p>
                  <p className="font-bold text-[#059669]">₦{selectedLog.revenue.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Scalp Condition</p>
                <p className="text-sm text-[#1C1C1E] bg-black/[0.02] p-3 rounded-xl">{selectedLog.scalpNotes}</p>
              </div>

              {selectedLog.productsUsed && selectedLog.productsUsed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Products Used</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.productsUsed.map((product, i) => (
                      <span key={i} className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                        <Package size={14} />
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.detailedNotes && (
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Detailed Notes</p>
                  <p className="text-sm text-[#1C1C1E] bg-black/[0.02] p-4 rounded-xl leading-relaxed">{selectedLog.detailedNotes}</p>
                </div>
              )}

              {selectedLog.clientFeedback && (
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Client Feedback</p>
                  <div className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
                    <FileText size={20} className="text-[#059669] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#059669] italic">"{selectedLog.clientFeedback}"</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Status</p>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  selectedLog.status === 'completed' 
                    ? 'bg-green-50 text-green-600' 
                    : selectedLog.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
