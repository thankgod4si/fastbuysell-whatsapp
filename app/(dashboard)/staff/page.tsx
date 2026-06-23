'use client'

import { useEffect, useState } from 'react'
import { Users, Target, DollarSign, Calendar, TrendingUp, Award, Clock } from 'lucide-react'

interface StylistLog {
  id: string
  stylist: string
  client: string
  service: string
  date: string
  scalpNotes: string
  status: 'completed' | 'pending' | 'cancelled'
  revenue: number
}

export default function StaffPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<StylistLog[]>([])

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
        revenue: 45000
      },
      {
        id: '2',
        stylist: 'Anita',
        client: 'Sarah Johnson',
        service: 'Knotless Braids',
        date: '2026-06-12',
        scalpNotes: 'Dry Scalp',
        status: 'completed',
        revenue: 35000
      },
      {
        id: '3',
        stylist: 'Blessing',
        client: 'Chioma Okafor',
        service: 'Wig Installation',
        date: '2026-06-15',
        scalpNotes: 'Normal',
        status: 'completed',
        revenue: 40000
      },
      {
        id: '4',
        stylist: 'Anita',
        client: 'Grace Adeleke',
        service: 'Silk Press',
        date: '2026-06-18',
        scalpNotes: 'Heat Damaged',
        status: 'pending',
        revenue: 25000
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
            <Users size={20} className="text-[#8B5CF6]" />
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
      <div className="bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] rounded-2xl p-6 text-white">
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
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white font-bold text-sm">
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
                <tr key={log.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
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
    </div>
  )
}
