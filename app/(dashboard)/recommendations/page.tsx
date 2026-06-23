'use client'

import { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, Target, DollarSign, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ProductRecommendation {
  service: string
  recommendedProduct: string
  conversionRate: number
  revenueGenerated: number
}

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const recommendations: ProductRecommendation[] = [
    { service: 'Wig Install', recommendedProduct: 'Tresses Edge Control', conversionRate: 72, revenueGenerated: 85000 },
    { service: 'Knotless Braids', recommendedProduct: 'Scalp Nourishing Oil', conversionRate: 68, revenueGenerated: 68000 },
    { service: 'Silk Press', recommendedProduct: 'Heat Protection Serum', conversionRate: 65, revenueGenerated: 52000 },
    { service: 'Hair Treatment', recommendedProduct: 'Deep Repair Mask', conversionRate: 68, revenueGenerated: 45000 },
    { service: 'Braids Installation', recommendedProduct: 'Leave-in Conditioner', conversionRate: 58, revenueGenerated: 38000 },
  ]

  const stats = {
    totalRevenue: recommendations.reduce((s, r) => s + r.revenueGenerated, 0),
    avgConversion: Math.round(recommendations.reduce((s, r) => s + r.conversionRate, 0) / recommendations.length),
    bestProduct: recommendations.reduce((prev, curr) => prev.revenueGenerated > curr.revenueGenerated ? prev : curr).recommendedProduct
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Product Recommendations</h1>
          <p className="text-sm text-[#8E8E93] mt-1">AI-powered product recommendations based on services</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Product Revenue Generated</span>
          </div>
          <p className="text-2xl font-black text=[#059669]">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#8B5CF6]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Avg Conversion Rate</span>
          </div>
          <p className="text-2xl font-black text-[#8B5CF6]">{stats.avgConversion}%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Best Performing Product</span>
          </div>
          <p className="text-lg font-black text-[#FF9500] truncate">{stats.bestProduct}</p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={24} />
          <h3 className="font-bold text-lg">AI Recommendation Insights</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Wig Install Pattern</p>
            <p className="text-white/80 text-xs">Customers who receive Wig Installs are 72% more likely to purchase Edge Control.</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Dry Scalp Detection</p>
            <p className="text-white/80 text-xs">Customers with Dry Scalp frequently purchase Scalp Nourishing Oil.</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Treatment Upsell</p>
            <p className="text-white/80 text-xs">Hair Treatment customers have the highest product conversion rate at 68%.</p>
          </div>
        </div>
      </div>

      {/* Recommendation Rules */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h3 className="font-bold text-[#1C1C1E]">Service → Product Mapping</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Recommended Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Conversion Rate</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Revenue Generated</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, i) => (
                <tr key={i} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#1C1C1E]">{rec.service}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{rec.recommendedProduct}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className="h-full bg-[#8B5CF6] rounded-full"
                          style={{ width: `${rec.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#1C1C1E]">{rec.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#059669]">₦{rec.revenueGenerated.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#8B5CF6] text-xs font-semibold hover:underline">
                      Edit Rule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Rule */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04] border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target size={20} className="text-[#8B5CF6]" />
            <div>
              <p className="font-semibold text-[#1C1C1E]">Add New Recommendation Rule</p>
              <p className="text-xs text-[#8E8E93]">Create automatic product recommendations for services</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold hover:bg-[#7C3AED] transition-colors">
            Add Rule
          </button>
        </div>
      </div>
    </div>
  )
}
