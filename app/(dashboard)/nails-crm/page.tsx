'use client'

import { useState } from 'react'
import { User, Phone, MapPin, ShoppingBag, Heart, Calendar, Star, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface NailCustomer {
  id: string
  name: string
  phone: string
  state: string
  lastOrder: string
  totalSpent: number
  favoriteStyle: string
  favoriteLength: string
  favoriteColour: string
  birthday: string
  instagram: string
  orderCount: number
  status: 'active' | 'at-risk' | 'new'
}

export default function NailsCRMPage() {
  const [customers] = useState<NailCustomer[]>([
    {
      id: '1',
      name: 'Ada Johnson',
      phone: '+234 801 234 5678',
      state: 'Lagos',
      lastOrder: '2026-06-20',
      totalSpent: 96000,
      favoriteStyle: 'Almond',
      favoriteLength: 'Medium',
      favoriteColour: 'Nude',
      birthday: '1990-05-15',
      instagram: '@ada_styles',
      orderCount: 5,
      status: 'active'
    },
    {
      id: '2',
      name: 'Chioma Okafor',
      phone: '+234 802 345 6789',
      state: 'Abuja',
      lastOrder: '2026-06-21',
      totalSpent: 72000,
      favoriteStyle: 'Stiletto',
      favoriteLength: 'Long',
      favoriteColour: 'Red Chrome',
      birthday: '1988-08-22',
      instagram: '@chioma_nails',
      orderCount: 3,
      status: 'active'
    },
    {
      id: '3',
      name: 'Grace Adeleke',
      phone: '+234 803 456 7890',
      state: 'Lagos',
      lastOrder: '2026-06-22',
      totalSpent: 48000,
      favoriteStyle: 'Coffin',
      favoriteLength: 'XL',
      favoriteColour: 'Pink Marble',
      birthday: '1992-12-10',
      instagram: '@grace_glams',
      orderCount: 2,
      status: 'new'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      phone: '+234 804 567 8901',
      state: 'Port Harcourt',
      lastOrder: '2026-06-18',
      totalSpent: 120000,
      favoriteStyle: 'Oval',
      favoriteLength: 'Short',
      favoriteColour: 'Gold',
      birthday: '1985-03-28',
      instagram: '@sarah_luxe',
      orderCount: 6,
      status: 'active'
    },
    {
      id: '5',
      name: 'Blessing Emmanuel',
      phone: '+234 805 678 9012',
      state: 'Lagos',
      lastOrder: '2026-05-15',
      totalSpent: 35000,
      favoriteStyle: 'Square',
      favoriteLength: 'Medium',
      favoriteColour: 'Purple',
      birthday: '1995-09-05',
      instagram: '@blessing_beauty',
      orderCount: 1,
      status: 'at-risk'
    }
  ])

  const statusConfig = {
    active: { label: 'Active', color: '#059669', bg: '#ECFDF5' },
    'at-risk': { label: 'At Risk', color: '#D97706', bg: '#FFFBEB' },
    new: { label: 'New', color: '#007AFF', bg: '#EFF6FF' }
  }

  const stats = {
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrderValue: Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.orderCount, 0)),
    repeatCustomers: customers.filter(c => c.orderCount > 1).length
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Customer CRM</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Manage customer style profiles and preferences</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-[#007AFF]" />
            <p className="text-xs text-[#8E8E93]">Total Customers</p>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#059669]" />
            <p className="text-xs text-[#8E8E93]">Total Revenue</p>
          </div>
          <p className="text-2xl font-black text-[#059669]">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-[#FF9500]" />
            <p className="text-xs text-[#8E8E93]">Avg Order Value</p>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">₦{stats.avgOrderValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-[#AF52DE]" />
            <p className="text-xs text-[#8E8E93]">Repeat Customers</p>
          </div>
          <p className="text-2xl font-black text-[#AF52DE]">{stats.repeatCustomers}</p>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => {
          const config = statusConfig[customer.status]
          return (
            <div key={customer.id} className="bg-white rounded-2xl border border-black/[0.04] p-5 hover:border-[#007AFF]/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#059669] flex items-center justify-center text-white font-bold text-lg">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1C1C1E]">{customer.name}</h3>
                    <p className="text-xs text-[#8E8E93]">{customer.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: config.bg, color: config.color }}>
                  {config.label}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin size={14} className="text-[#8E8E93]" />
                  <span className="text-[#8E8E93]">{customer.state}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Star size={14} className="text-[#8E8E93]" />
                  <span className="text-[#8E8E93]">{customer.instagram}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar size={14} className="text-[#8E8E93]" />
                  <span className="text-[#8E8E93]">Birthday: {new Date(customer.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>

              <div className="bg-black/[0.02] rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Style Profile</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">Shape</p>
                    <p className="text-sm font-semibold text-[#1C1C1E]">{customer.favoriteStyle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">Length</p>
                    <p className="text-sm font-semibold text-[#1C1C1E]">{customer.favoriteLength}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">Colour</p>
                    <p className="text-sm font-semibold text-[#1C1C1E]">{customer.favoriteColour}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                <div>
                  <p className="text-[10px] text-[#8E8E93]">Total Spent</p>
                  <p className="text-sm font-bold text-[#059669]">₦{customer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#8E8E93]">Orders</p>
                  <p className="text-sm font-bold text-[#1C1C1E]">{customer.orderCount}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
