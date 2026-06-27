'use client'

import { useState } from 'react'
import { Package, TrendingUp, DollarSign, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  customer: string
  phone: string
  design: string
  length: string
  colour: string
  price: number
  status: 'pending' | 'paid' | 'designing' | 'production' | 'quality_check' | 'packaged' | 'shipped'
  state: string
  createdAt: string
}

export default function OrdersPage() {
 const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      customer: 'Ada Johnson',
      phone: '+234 801 234 5678',
      design: 'Custom Medium Nude',
      length: 'Medium',
      colour: 'Nude',
      price: 24000,
      status: 'paid',
      state: 'Lagos',
      createdAt: '2026-06-20'
    },
    {
      id: 'ORD-002',
      customer: 'Chioma Okafor',
      phone: '+234 802 345 6789',
      design: 'Red Chrome Almond',
      length: 'Long',
      colour: 'Red Chrome',
      price: 28000,
      status: 'production',
      state: 'Abuja',
      createdAt: '2026-06-21'
    },
    {
      id: 'ORD-003',
      customer: 'Grace Adeleke',
      phone: '+234 803 456 7890',
      design: 'Pink Marble Stiletto',
      length: 'XL',
      colour: 'Pink Marble',
      price: 32000,
      status: 'designing',
      state: 'Lagos',
      createdAt: '2026-06-22'
    },
    {
      id: 'ORD-004',
      customer: 'Sarah Williams',
      phone: '+234 804 567 8901',
      design: 'Gold Accent Coffin',
      length: 'Medium',
      colour: 'Gold',
      price: 26000,
      status: 'shipped',
      state: 'Port Harcourt',
      createdAt: '2026-06-18'
    },
    {
      id: 'ORD-005',
      customer: 'Blessing Emmanuel',
      phone: '+234 805 678 9012',
      design: 'Bridal Set Oval',
      length: 'Short',
      colour: 'White',
      price: 35000,
      status: 'pending',
      state: 'Lagos',
      createdAt: '2026-06-23'
    }
  ])

  const statusConfig: Record<Order['status'], { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'Pending Payment', color: '#FF9500', bg: '#FF950015', icon: AlertCircle },
    paid: { label: 'Paid', color: '#007AFF', bg: '#007AFF15', icon: DollarSign },
    designing: { label: 'Designing', color: '#AF52DE', bg: '#AF52DE15', icon: Package },
    production: { label: 'In Production', color: '#FF6B6B', bg: '#FF6B6B15', icon: Package },
    quality_check: { label: 'Quality Check', color: '#FF9500', bg: '#FF950015', icon: CheckCircle },
    packaged: { label: 'Packaged', color: '#34C759', bg: '#34C75915', icon: Package },
    shipped: { label: 'Shipped', color: '#34C759', bg: '#34C75915', icon: Truck }
  }

  const stats = {
    todayOrders: orders.filter(o => o.createdAt === '2026-06-23').length,
    todayRevenue: orders.filter(o => o.createdAt === '2026-06-23' && o.status !== 'pending').reduce((sum, o) => sum + o.price, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    inProduction: orders.filter(o => ['designing', 'production', 'quality_check', 'packaged'].includes(o.status)).length,
    shippedOrders: orders.filter(o => o.status === 'shipped').length,
    avgOrderValue: Math.round(orders.reduce((sum, o) => sum + o.price, 0) / orders.length)
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Orders Dashboard</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track and manage your press-on nail orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#007AFF]" />
            <p className="text-xs text-[#8E8E93]">Today's Orders</p>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.todayOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-[#059669]" />
            <p className="text-xs text-[#8E8E93]">Today's Revenue</p>
          </div>
          <p className="text-2xl font-black text-[#059669]">₦{stats.todayRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#FF9500]" />
            <p className="text-xs text-[#8E8E93]">Pending</p>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#AF52DE]" />
            <p className="text-xs text-[#8E8E93]">In Production</p>
          </div>
          <p className="text-2xl font-black text-[#AF52DE]">{stats.inProduction}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={16} className="text-[#34C759]" />
            <p className="text-xs text-[#8E8E93]">Shipped</p>
          </div>
          <p className="text-2xl font-black text-[#34C759]">{stats.shippedOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#007AFF]" />
            <p className="text-xs text-[#8E8E93]">Avg Order</p>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">₦{stats.avgOrderValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h2 className="font-bold text-[#1C1C1E]">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Design</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Length</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const config = statusConfig[order.status]
                const Icon = config.icon
                return (
                  <tr key={order.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{order.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1C1C1E]">{order.customer}</p>
                      <p className="text-xs text-[#8E8E93]">{order.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8E8E93]">{order.design}</td>
                    <td className="px-6 py-4 text-sm text-[#8E8E93]">{order.length}</td>
                    <td className="px-6 py-4 text-sm text-[#8E8E93]">{order.state}</td>
                    <td className="px-6 py-4 font-bold text-[#059669]">₦{order.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit`} style={{ background: config.bg, color: config.color }}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
