'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, Key, Shield, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'stylist' | 'receptionist'
  status: 'active' | 'inactive'
  services: string[]
  joinedDate: string
  lastLogin?: string
}

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: '#DC2626' },
  stylist: { label: 'Stylist', color: '#007AFF' },
  receptionist: { label: 'Receptionist', color: '#059669' }
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#059669', bg: '#ECFDF5' },
  inactive: { label: 'Inactive', color: '#8E8E93', bg: '#F9FAFB' }
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'stylist' | 'receptionist'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  useEffect(() => {
    // Simulated staff data - in production, fetch from database
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        name: 'Blessing Johnson',
        email: 'blessing@salon.com',
        phone: '+234 801 234 5678',
        role: 'stylist',
        status: 'active',
        services: ['Frontal Install', 'Wig Installation', 'Knotless Braids'],
        joinedDate: '2024-01-15',
        lastLogin: '2026-06-20'
      },
      {
        id: '2',
        name: 'Anita Chukwu',
        email: 'anita@salon.com',
        phone: '+234 802 345 6789',
        role: 'stylist',
        status: 'active',
        services: ['Silk Press', 'Blowout', 'Treatment'],
        joinedDate: '2024-03-20',
        lastLogin: '2026-06-19'
      },
      {
        id: '3',
        name: 'Chisom Okafor',
        email: 'chisom@salon.com',
        phone: '+234 803 456 7890',
        role: 'stylist',
        status: 'active',
        services: ['Braids', 'Twists', 'Cornrows'],
        joinedDate: '2024-05-10',
        lastLogin: '2026-06-18'
      },
      {
        id: '4',
        name: 'Grace Adeleke',
        email: 'grace@salon.com',
        phone: '+234 804 567 8901',
        role: 'receptionist',
        status: 'active',
        services: [],
        joinedDate: '2024-02-01',
        lastLogin: '2026-06-20'
      },
      {
        id: '5',
        name: 'Salon Owner',
        email: 'owner@salon.com',
        phone: '+234 805 678 9012',
        role: 'admin',
        status: 'active',
        services: [],
        joinedDate: '2023-12-01',
        lastLogin: '2026-06-20'
      }
    ]

    setStaff(mockStaff)
    setLoading(false)
  }, [])

  const filtered = staff.filter(s => {
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    const matchRole = filterRole === 'all' || s.role === filterRole
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    stylists: staff.filter(s => s.role === 'stylist').length,
    admins: staff.filter(s => s.role === 'admin').length
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Staff Management</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Add and manage salon staff with login credentials</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Staff</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Active</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Stylists</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">{stats.stylists}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Key size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Admins</span>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{stats.admins}</p>
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
            placeholder="Search staff..."
            className="w-full bg-white border border-black/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'admin', 'stylist', 'receptionist'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterRole === r 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {r === 'all' ? 'All Roles' : ROLE_CONFIG[r].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
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
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8E8E93]">Loading staff...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8E8E93]">No staff found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black/[0.02]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Services</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#059669] flex items-center justify-center text-white font-bold text-sm">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1E] text-sm">{member.name}</p>
                        <p className="text-xs text-[#8E8E93]">Joined {new Date(member.joinedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${ROLE_CONFIG[member.role].color}15`, color: ROLE_CONFIG[member.role].color }}>
                      {ROLE_CONFIG[member.role].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-[#8E8E93]">
                        <Mail size={14} />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8E8E93]">
                        <Phone size={14} />
                        {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.services.slice(0, 2).map((service, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-black/[0.04] rounded-full text-[#8E8E93]">
                            {service}
                          </span>
                        ))}
                        {member.services.length > 2 && (
                          <span className="text-xs px-2 py-1 bg-black/[0.04] rounded-full text-[#8E8E93]">
                            +{member.services.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#8E8E93]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: STATUS_CONFIG[member.status].bg, color: STATUS_CONFIG[member.status].color }}>
                      {STATUS_CONFIG[member.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">
                    {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedStaff(member)
                          setShowPasswordModal(true)
                          setTempPassword(generatePassword())
                        }}
                        className="text-[#FF9500] text-xs font-semibold hover:underline flex items-center gap-1"
                      >
                        <Key size={14} />
                        Reset
                      </button>
                      <button className="text-[#007AFF] text-xs font-semibold hover:underline flex items-center gap-1">
                        <Edit size={14} />
                        Edit
                      </button>
                      <button className="text-[#FF6B6B] text-xs font-semibold hover:underline flex items-center gap-1">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <h2 className="text-xl font-black text-[#1C1C1E]">Add New Staff</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Full Name</label>
                <input type="text" placeholder="Enter full name" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Email</label>
                <input type="email" placeholder="email@example.com" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Phone</label>
                <input type="tel" placeholder="+234 800 000 0000" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Role</label>
                <select className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors">
                  <option value="">Select role</option>
                  <option value="stylist">Stylist</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Services (for stylists)</label>
                <input type="text" placeholder="e.g., Frontal Install, Braids" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Temporary Password</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tempPassword || generatePassword()} 
                    readOnly
                    className="flex-1 bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm font-mono"
                  />
                  <button 
                    onClick={() => setTempPassword(generatePassword())}
                    className="px-3 py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl text-xs font-semibold hover:bg-[#007AFF]/20 transition-colors"
                  >
                    <Key size={16} />
                  </button>
                </div>
                <p className="text-xs text-[#8E8E93] mt-1">Share this password securely with the staff member</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-white border border-black/[0.06] text-[#1C1C1E] rounded-xl text-xs font-semibold hover:bg-black/[0.02] transition-colors">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors">
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <h2 className="text-xl font-black text-[#1C1C1E]">Reset Password</h2>
              <p className="text-sm text-[#8E8E93] mt-1">For {selectedStaff.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">New Temporary Password</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tempPassword} 
                    readOnly
                    className="flex-1 bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm font-mono"
                  />
                  <button 
                    onClick={() => setTempPassword(generatePassword())}
                    className="px-3 py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl text-xs font-semibold hover:bg-[#007AFF]/20 transition-colors"
                  >
                    <Key size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-800">
                  <strong>Important:</strong> Share this password securely with {selectedStaff.name}. They will need to change it on first login.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 bg-white border border-black/[0.06] text-[#1C1C1E] rounded-xl text-xs font-semibold hover:bg-black/[0.02] transition-colors">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors">
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
