'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { DollarSign, TrendingUp, Calendar, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'

export const dynamic = 'force-dynamic'

const COLORS = ['#8B5CF6', '#059669', '#007AFF', '#FF9500', '#FF6B6B', '#AF52DE']

export default function RevenuePage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month')

  useEffect(() => {
    setLoading(false)
  }, [])

  // Mock data - in production, fetch from database
  const revenueData = [
    { month: 'Jan', revenue: 450000, services: 380000, products: 70000 },
    { month: 'Feb', revenue: 520000, services: 420000, products: 100000 },
    { month: 'Mar', revenue: 480000, services: 390000, products: 90000 },
    { month: 'Apr', revenue: 610000, services: 490000, products: 120000 },
    { month: 'May', revenue: 580000, services: 460000, products: 120000 },
    { month: 'Jun', revenue: 720000, services: 570000, products: 150000 },
  ]

  const topServices = [
    { name: 'Frontal Install', revenue: 285000, bookings: 45 },
    { name: 'Knotless Braids', revenue: 195000, bookings: 65 },
    { name: 'Wig Installation', revenue: 165000, bookings: 38 },
    { name: 'Silk Press', revenue: 120000, bookings: 52 },
    { name: 'Hair Treatment', revenue: 95000, bookings: 28 },
  ]

  const topProducts = [
    { name: 'Edge Control', revenue: 85000, sales: 142 },
    { name: 'Scalp Nourishing Oil', revenue: 68000, sales: 98 },
    { name: 'Heat Protection Serum', revenue: 52000, sales: 76 },
    { name: 'Deep Repair Mask', revenue: 45000, sales: 54 },
    { name: 'Leave-in Conditioner', revenue: 38000, sales: 89 },
  ]

  const serviceDistribution = [
    { name: 'Frontal Install', value: 285000 },
    { name: 'Knotless Braids', value: 195000 },
    { name: 'Wig Installation', value: 165000 },
    { name: 'Silk Press', value: 120000 },
    { name: 'Hair Treatment', value: 95000 },
  ]

  const stats = {
    today: 24500,
    week: 168000,
    month: 720000,
    productRevenue: 150000,
    serviceRevenue: 570000,
    growth: 23
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Revenue Dashboard</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track revenue trends, service performance, and product sales</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                timeRange === range 
                  ? 'bg-[#8B5CF6] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-[#059669]" />
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 12%</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">₦{stats.today.toLocaleString()}</p>
          <p className="text-xs text-[#8E8E93] mt-1">Revenue Today</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} className="text-[#8B5CF6]" />
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 18%</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">₦{stats.week.toLocaleString()}</p>
          <p className="text-xs text-[#8E8E93] mt-1">Revenue This Week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={20} className="text-[#007AFF]" />
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ {stats.growth}%</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">₦{stats.month.toLocaleString()}</p>
          <p className="text-xs text-[#8E8E93] mt-1">Revenue This Month</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <PieChart size={20} className="text-[#FF9500]" />
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 15%</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">₦{stats.productRevenue.toLocaleString()}</p>
          <p className="text-xs text-[#8E8E93] mt-1">Product Revenue</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#8E8E93" fontSize={12} />
            <YAxis stroke="#8E8E93" fontSize={12} tickFormatter={(value) => `₦${(value/1000).toFixed(0)}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              formatter={(value: any) => `₦${Number(value).toLocaleString()}`}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} name="Total Revenue" />
            <Line type="monotone" dataKey="services" stroke="#059669" strokeWidth={2} name="Service Revenue" />
            <Line type="monotone" dataKey="products" stroke="#FF9500" strokeWidth={2} name="Product Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Selling Services */}
        <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
          <h3 className="font-bold text-[#1C1C1E] mb-4">Top Selling Services</h3>
          <div className="space-y-4">
            {topServices.map((service, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1C1C1E] text-sm">{service.name}</p>
                  <p className="text-xs text-[#8E8E93]">{service.bookings} bookings</p>
                </div>
                <p className="font-bold text-[#059669]">₦{service.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
          <h3 className="font-bold text-[#1C1C1E] mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1C1C1E] text-sm">{product.name}</p>
                  <p className="text-xs text-[#8E8E93]">{product.sales} sold</p>
                </div>
                <p className="font-bold text-[#059669]">₦{product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Revenue by Service</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={serviceDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {serviceDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `₦${Number(value).toLocaleString()}`} />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
