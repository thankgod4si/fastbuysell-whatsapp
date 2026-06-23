'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Target, ArrowUpRight, Award, Zap } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export const dynamic = 'force-dynamic'

export default function ExecutivePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  // Mock executive metrics
  const monthlyRevenue = [
    { month: 'Jan', revenue: 450000, target: 400000 },
    { month: 'Feb', revenue: 520000, target: 450000 },
    { month: 'Mar', revenue: 480000, target: 500000 },
    { month: 'Apr', revenue: 610000, target: 550000 },
    { month: 'May', revenue: 580000, target: 600000 },
    { month: 'Jun', revenue: 720000, target: 650000 },
  ]

  const metrics = {
    monthlyRevenue: 720000,
    repeatCustomerRate: 68,
    avgCustomerLifetimeValue: 285000,
    mostProfitableService: 'Frontal Install',
    mostProfitableProduct: 'Edge Control',
    customerChurnRate: 12,
    revenueRecoveredFollowUps: 145000,
    revenueGeneratedAICampaigns: 89000
  }

  const kpis = [
    { label: 'Monthly Revenue', value: '₦720,000', change: '+23%', color: '#059669', icon: DollarSign },
    { label: 'Repeat Customer Rate', value: '68%', change: '+5%', color: '#8B5CF6', icon: Users },
    { label: 'Avg Customer LTV', value: '₦285,000', change: '+12%', color: '#007AFF', icon: TrendingUp },
    { label: 'Churn Rate', value: '12%', change: '-3%', color: '#FF6B6B', icon: Target },
  ]

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Executive Dashboard</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Business intelligence and performance metrics</p>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const IconComponent = kpi.icon
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-black/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <IconComponent size={20} style={{ color: kpi.color }} />
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  kpi.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-black text-[#1C1C1E]">{kpi.value}</p>
              <p className="text-xs text-[#8E8E93] mt-1">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue vs Target Chart */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Revenue vs Target</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#8E8E93" fontSize={12} />
            <YAxis stroke="#8E8E93" fontSize={12} tickFormatter={(value) => `₦${(value/1000).toFixed(0)}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              formatter={(value: any) => `₦${Number(value).toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#8B5CF6" name="Actual Revenue" />
            <Bar dataKey="target" fill="#E5E7EB" name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Business Intelligence Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Most Profitable */}
        <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-4">
            <Award size={20} className="text-[#FF9500]" />
            <h3 className="font-bold text-[#1C1C1E]">Most Profitable</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/[0.02] rounded-xl">
              <div>
                <p className="text-xs text-[#8E8E93]">Service</p>
                <p className="font-semibold text-[#1C1C1E]">{metrics.mostProfitableService}</p>
              </div>
              <ArrowUpRight size={16} className="text-[#059669]" />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/[0.02] rounded-xl">
              <div>
                <p className="text-xs text-[#8E8E93]">Product</p>
                <p className="font-semibold text-[#1C1C1E]">{metrics.mostProfitableProduct}</p>
              </div>
              <ArrowUpRight size={16} className="text-[#059669]" />
            </div>
          </div>
        </div>

        {/* AI Revenue Impact */}
        <div className="bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={20} />
            <h3 className="font-bold text-lg">AI Revenue Impact</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-white/70 text-xs">Revenue Recovered Through Follow-Ups</p>
              <p className="text-2xl font-black">₦{metrics.revenueRecoveredFollowUps.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Revenue Generated Through AI Campaigns</p>
              <p className="text-2xl font-black">₦{metrics.revenueGeneratedAICampaigns.toLocaleString()}</p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-white/70 text-xs">Total AI-Driven Revenue</p>
              <p className="text-3xl font-black">₦{(metrics.revenueRecoveredFollowUps + metrics.revenueGeneratedAICampaigns).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Customer Health Metrics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-black/[0.02] rounded-xl">
            <p className="text-3xl font-black text-[#059669]">{metrics.repeatCustomerRate}%</p>
            <p className="text-xs text-[#8E8E93] mt-1">Repeat Customer Rate</p>
          </div>
          <div className="text-center p-4 bg-black/[0.02] rounded-xl">
            <p className="text-3xl font-black text-[#8B5CF6]">₦{metrics.avgCustomerLifetimeValue.toLocaleString()}</p>
            <p className="text-xs text-[#8E8E93] mt-1">Avg Customer LTV</p>
          </div>
          <div className="text-center p-4 bg-black/[0.02] rounded-xl">
            <p className="text-3xl font-black text-[#FF6B6B]">{metrics.customerChurnRate}%</p>
            <p className="text-xs text-[#8E8E93] mt-1">Customer Churn Rate</p>
          </div>
        </div>
      </div>

      {/* Growth Opportunities */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Growth Opportunities</h3>
        <div className="space-y-3">
          {[
            { opportunity: 'Increase product upsells', potential: '+₦120,000/month', priority: 'High' },
            { opportunity: 'Launch VIP membership program', potential: '+₦85,000/month', priority: 'Medium' },
            { opportunity: 'Expand weekend availability', potential: '+₦65,000/month', priority: 'High' },
            { opportunity: 'Implement referral program', potential: '+₦45,000/month', priority: 'Low' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-black/[0.04] rounded-xl hover:bg-black/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.priority === 'High' ? 'bg-[#FF6B6B]' : item.priority === 'Medium' ? 'bg-[#FF9500]' : 'bg-[#059669]'
                }`} />
                <div>
                  <p className="font-semibold text-[#1C1C1E] text-sm">{item.opportunity}</p>
                  <p className="text-xs text-[#8E8E93]">Priority: {item.priority}</p>
                </div>
              </div>
              <span className="font-bold text-[#059669] text-sm">{item.potential}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
