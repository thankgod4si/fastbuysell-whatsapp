'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingDown, Send, Gift, Crown, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AtRiskCustomer {
  id: string
  name: string
  lastVisit: string
  daysSinceVisit: number
  totalSpend: number
  healthScore: number
  suggestedAction: 'comeback_offer' | 'product_promo' | 'vip_offer'
}

export default function ReactivationPage() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([])

  useEffect(() => {
    // Mock data - in production, fetch from database
    const mockCustomers: AtRiskCustomer[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        lastVisit: '2026-03-20',
        daysSinceVisit: 92,
        totalSpend: 180000,
        healthScore: 42,
        suggestedAction: 'comeback_offer'
      },
      {
        id: '2',
        name: 'Chioma Okafor',
        lastVisit: '2026-02-10',
        daysSinceVisit: 130,
        totalSpend: 95000,
        healthScore: 18,
        suggestedAction: 'vip_offer'
      },
      {
        id: '3',
        name: 'Grace Adeleke',
        lastVisit: '2026-04-05',
        daysSinceVisit: 77,
        totalSpend: 220000,
        healthScore: 55,
        suggestedAction: 'product_promo'
      },
      {
        id: '4',
        name: 'Ngozi Eze',
        lastVisit: '2026-01-28',
        daysSinceVisit: 145,
        totalSpend: 145000,
        healthScore: 25,
        suggestedAction: 'comeback_offer'
      }
    ]

    setCustomers(mockCustomers)
    setLoading(false)
  }, [])

  const actionConfig = {
    comeback_offer: {
      label: 'Comeback Offer',
      icon: Gift,
      color: '#007AFF',
      message: 'Send 15% discount offer'
    },
    product_promo: {
      label: 'Product Promotion',
      icon: Send,
      color: '#059669',
      message: 'Send product recommendation'
    },
    vip_offer: {
      label: 'VIP Offer',
      icon: Crown,
      color: '#FF9500',
      message: 'Send exclusive VIP offer'
    }
  }

  const stats = {
    atRisk: customers.length,
    avgDaysSinceVisit: Math.round(customers.reduce((s, c) => s + c.daysSinceVisit, 0) / customers.length),
    totalLostRevenue: customers.reduce((s, c) => s + c.totalSpend, 0),
    reactivatedThisMonth: 12
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Reactivation Center</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Identify and win back at-risk customers</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertCircle size={20} className="text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-red-900 text-sm">Customers at risk of churning</p>
          <p className="text-xs text-red-700">Take action to reengage these customers before they're lost</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={20} className="text-[#FF6B6B]" />
            <span className="text-xs font-semibold text-[#8E8E93]">At Risk Customers</span>
          </div>
          <p className="text-2xl font-black text-[#FF6B6B]">{stats.atRisk}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={20} className="text-[#D97706]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Avg Days Since Visit</span>
          </div>
          <p className="text-2xl font-black text-[#D97706]">{stats.avgDaysSinceVisit}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <ArrowRight size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Potential Lost Revenue</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">₦{stats.totalLostRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Send size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Reactivated This Month</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.reactivatedThisMonth}</p>
        </div>
      </div>

      {/* At Risk Customers */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h3 className="font-bold text-[#1C1C1E]">Customers Likely to Churn</h3>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {customers.map(customer => {
            const config = actionConfig[customer.suggestedAction]
            const IconComponent = config.icon
            return (
              <div key={customer.id} className="p-6 hover:bg-black/[0.02] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#D97706] flex items-center justify-center text-white font-bold text-lg">
                      {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1C1C1E]">{customer.name}</h4>
                      <p className="text-sm text-[#8E8E93]">Last visit: {customer.daysSinceVisit} days ago</p>
                      <p className="text-xs text-[#8E8E93]">Total spend: ₦{customer.totalSpend.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-16 h-2 bg-black/[0.06] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF6B6B] rounded-full"
                          style={{ width: `${customer.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#FF6B6B]">{customer.healthScore}/100</span>
                    </div>
                    <p className="text-xs text-[#8E8E93]">Health Score</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/[0.04]">
                  <span 
                    className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ 
                      background: `${config.color}15`,
                      color: config.color
                    }}
                  >
                    <IconComponent size={14} />
                    {config.label}
                  </span>
                  <span className="text-xs text-[#8E8E93] flex-1">{config.message}</span>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#7C3AED] transition-colors"
                  >
                    <Send size={14} />
                    Send Now
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-bold text-[#1C1C1E] mb-4">Bulk Reactivation Campaign</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-black/[0.06] rounded-xl hover:bg-black/[0.02] transition-colors text-left">
            <Gift size={20} className="text-[#007AFF]" />
            <div>
              <p className="font-semibold text-[#1C1C1E] text-sm">Send Comeback Offers</p>
              <p className="text-xs text-[#8E8E93]">15% discount to all at-risk</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-black/[0.06] rounded-xl hover:bg-black/[0.02] transition-colors text-left">
            <Send size={20} className="text-[#059669]" />
            <div>
              <p className="font-semibold text-[#1C1C1E] text-sm">Product Promotions</p>
              <p className="text-xs text-[#8E8E93]">Targeted product offers</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-black/[0.06] rounded-xl hover:bg-black/[0.02] transition-colors text-left">
            <Crown size={20} className="text-[#FF9500]" />
            <div>
              <p className="font-semibold text-[#1C1C1E] text-sm">VIP Offers</p>
              <p className="text-xs text-[#8E8E93]">Exclusive deals for high-value</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
