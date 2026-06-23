'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, XCircle, Filter, Search, MoreVertical } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Report {
  id: string
  customerName: string
  customerPhone: string
  stylistName: string
  service: string
  date: string
  issue: 'poor_service' | 'rude_behavior' | 'damage' | 'no_show' | 'other'
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  severity: 'low' | 'medium' | 'high'
}

const ISSUE_CONFIG = {
  poor_service: { label: 'Poor Service', color: '#D97706' },
  rude_behavior: { label: 'Rude Behavior', color: '#DC2626' },
  damage: { label: 'Hair Damage', color: '#DC2626' },
  no_show: { label: 'No Show', color: '#FF9500' },
  other: { label: 'Other', color: '#8E8E93' }
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#FF9500', bg: '#FFFBEB' },
  investigating: { label: 'Investigating', color: '#007AFF', bg: '#EFF6FF' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#ECFDF5' },
  dismissed: { label: 'Dismissed', color: '#8E8E93', bg: '#F9FAFB' }
}

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: '#059669' },
  medium: { label: 'Medium', color: '#FF9500' },
  high: { label: 'High', color: '#DC2626' }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    // Simulated reports data - in production, fetch from database
    const mockReports: Report[] = [
      {
        id: '1',
        customerName: 'Mrs. Bola',
        customerPhone: '+234 801 234 5678',
        stylistName: 'Blessing',
        service: 'Frontal Install',
        date: '2026-05-20',
        issue: 'poor_service',
        description: 'The frontal installation was not done properly. The edges were not laid flat and the glue was visible.',
        status: 'pending',
        severity: 'medium'
      },
      {
        id: '2',
        customerName: 'Chioma',
        customerPhone: '+234 802 345 6789',
        stylistName: 'Grace',
        service: 'Knotless Braids',
        date: '2026-05-18',
        issue: 'damage',
        description: 'My hair was pulled too tight during the braiding process. I have tension bumps and my scalp is very sore.',
        status: 'investigating',
        severity: 'high'
      },
      {
        id: '3',
        customerName: 'Adaeze',
        customerPhone: '+234 803 456 7890',
        stylistName: 'Blessing',
        service: 'Wig Installation',
        date: '2026-05-15',
        issue: 'no_show',
        description: 'I had an appointment for 2 PM but the stylist did not show up until 3:30 PM. No communication was provided.',
        status: 'resolved',
        severity: 'low'
      },
      {
        id: '4',
        customerName: 'Ngozi',
        customerPhone: '+234 804 567 8901',
        stylistName: 'Chisom',
        service: 'Scalp Treatment',
        date: '2026-05-12',
        issue: 'rude_behavior',
        description: 'The stylist was very rude and dismissive when I asked questions about the products being used.',
        status: 'pending',
        severity: 'high'
      }
    ]

    setReports(mockReports)
    setLoading(false)
  }, [])

  const filtered = reports.filter(r => {
    const matchSearch = !search || 
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.stylistName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchSeverity = filterSeverity === 'all' || r.severity === filterSeverity
    return matchSearch && matchStatus && matchSeverity
  })

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    highSeverity: reports.filter(r => r.severity === 'high').length
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Customer Reports</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track and resolve customer complaints about stylists</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Reports</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Pending</span>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Filter size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Investigating</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">{stats.investigating}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Resolved</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <XCircle size={20} className="text-[#DC2626]" />
            <span className="text-xs font-semibold text-[#8E8E93]">High Severity</span>
          </div>
          <p className="text-2xl font-black text-[#DC2626]">{stats.highSeverity}</p>
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
            placeholder="Search reports..."
            className="w-full bg-white border border-black/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterStatus === s 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'medium', 'high'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterSeverity === s 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {s} Severity
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8E8E93]">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8E8E93]">No reports found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black/[0.02]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Stylist</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Issue</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(report => (
                <tr key={report.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#1C1C1E] text-sm">{report.customerName}</p>
                      <p className="text-xs text-[#8E8E93]">{report.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{report.stylistName}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${ISSUE_CONFIG[report.issue].color}15`, color: ISSUE_CONFIG[report.issue].color }}>
                      {ISSUE_CONFIG[report.issue].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${SEVERITY_CONFIG[report.severity].color}15`, color: SEVERITY_CONFIG[report.severity].color }}>
                      {SEVERITY_CONFIG[report.severity].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: STATUS_CONFIG[report.status].bg, color: STATUS_CONFIG[report.status].color }}>
                      {STATUS_CONFIG[report.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{report.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#007AFF] text-xs font-semibold hover:underline">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1C1C1E]">Report Details</h2>
                  <p className="text-sm text-[#8E8E93] mt-1">ID: {selectedReport.id}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-[#8E8E93] hover:text-[#1C1C1E]">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedReport.customerName}</p>
                  <p className="text-sm text-[#8E8E93]">{selectedReport.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Stylist</p>
                  <p className="font-semibold text-[#1C1C1E]">{selectedReport.stylistName}</p>
                  <p className="text-sm text-[#8E8E93]">{selectedReport.service}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Issue Type</p>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${ISSUE_CONFIG[selectedReport.issue].color}15`, color: ISSUE_CONFIG[selectedReport.issue].color }}>
                  {ISSUE_CONFIG[selectedReport.issue].label}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-[#1C1C1E] bg-black/[0.02] p-4 rounded-xl">{selectedReport.description}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Severity</p>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${SEVERITY_CONFIG[selectedReport.severity].color}15`, color: SEVERITY_CONFIG[selectedReport.severity].color }}>
                    {SEVERITY_CONFIG[selectedReport.severity].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Status</p>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: STATUS_CONFIG[selectedReport.status].bg, color: STATUS_CONFIG[selectedReport.status].color }}>
                    {STATUS_CONFIG[selectedReport.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Date</p>
                  <p className="text-sm text-[#1C1C1E]">{selectedReport.date}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-black/[0.04]">
                {selectedReport.status === 'pending' && (
                  <>
                    <button className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors">
                      Start Investigation
                    </button>
                    <button className="flex-1 px-4 py-2 bg-[#059669] text-white rounded-xl text-xs font-semibold hover:bg-[#047857] transition-colors">
                      Resolve
                    </button>
                  </>
                )}
                {selectedReport.status === 'investigating' && (
                  <>
                    <button className="flex-1 px-4 py-2 bg-[#059669] text-white rounded-xl text-xs font-semibold hover:bg-[#047857] transition-colors">
                      Resolve
                    </button>
                    <button className="flex-1 px-4 py-2 bg-[#8E8E93] text-white rounded-xl text-xs font-semibold hover:bg-[#6B7280] transition-colors">
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
