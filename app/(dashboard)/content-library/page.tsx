'use client'

import { useState } from 'react'
import { Video, Eye, TrendingUp, Play, ArrowUp, ArrowDown, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ContentItem {
  id: string
  title: string
  thumbnail: string
  views: number
  ctr: number
  orders: number
  hook: string
  status: 'winning' | 'losing' | 'testing'
  postedAt: string
}

export default function ContentLibraryPage() {
  const [content] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Red Chrome Nails Tutorial',
      thumbnail: '🔴',
      views: 45000,
      ctr: 8.5,
      orders: 45,
      hook: 'Wait for the reveal at the end...',
      status: 'winning',
      postedAt: '2026-06-20'
    },
    {
      id: '2',
      title: 'Pink Marble Application',
      thumbnail: '🌸',
      views: 28000,
      ctr: 4.2,
      orders: 12,
      hook: 'The most satisfying nail transformation',
      status: 'losing',
      postedAt: '2026-06-21'
    },
    {
      id: '3',
      title: 'Gold Accent Bridal Set',
      thumbnail: '✨',
      views: 62000,
      ctr: 12.3,
      orders: 78,
      hook: 'POV: You found your wedding nails',
      status: 'winning',
      postedAt: '2026-06-18'
    },
    {
      id: '4',
      title: 'Nude Almond Everyday',
      thumbnail: '🤎',
      views: 35000,
      ctr: 6.8,
      orders: 28,
      hook: 'These nails changed my life',
      status: 'testing',
      postedAt: '2026-06-22'
    },
    {
      id: '5',
      title: 'Purple Stiletto Reveal',
      thumbnail: '💜',
      views: 18000,
      ctr: 3.1,
      orders: 8,
      hook: 'You won\'t believe how long these last',
      status: 'losing',
      postedAt: '2026-06-19'
    }
  ])

  const statusConfig = {
    winning: { label: 'Winning', color: '#059669', bg: '#ECFDF5' },
    losing: { label: 'Losing', color: '#DC2626', bg: '#FEF2F2' },
    testing: { label: 'Testing', color: '#FF9500', bg: '#FFFBEB' }
  }

  const stats = {
    totalViews: content.reduce((sum, c) => sum + c.views, 0),
    totalOrders: content.reduce((sum, c) => sum + c.orders, 0),
    avgCTR: (content.reduce((sum, c) => sum + c.ctr, 0) / content.length).toFixed(1),
    winningContent: content.filter(c => c.status === 'winning').length
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Content Library</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Track video performance and winning hooks</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-[#007AFF]" />
            <p className="text-xs text-[#8E8E93]">Total Views</p>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#059669]" />
            <p className="text-xs text-[#8E8E93]">Orders Generated</p>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp size={16} className="text-[#FF9500]" />
            <p className="text-xs text-[#8E8E93]">Avg CTR</p>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{stats.avgCTR}%</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Play size={16} className="text-[#AF52DE]" />
            <p className="text-xs text-[#8E8E93]">Winning Content</p>
          </div>
          <p className="text-2xl font-black text-[#AF52DE]">{stats.winningContent}</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map(item => {
          const config = statusConfig[item.status]
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden hover:border-[#007AFF]/30 transition-colors">
              <div className="aspect-video bg-gradient-to-br from-[#F2F2F7] to-[#E5E5EA] flex items-center justify-center text-6xl">
                {item.thumbnail}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#1C1C1E] text-sm flex-1">{item.title}</h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full ml-2" style={{ background: config.bg, color: config.color }}>
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">Views</p>
                    <p className="text-sm font-semibold text-[#1C1C1E]">{item.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">CTR</p>
                    <p className="text-sm font-semibold text-[#007AFF]">{item.ctr}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8E8E93]">Orders</p>
                    <p className="text-sm font-semibold text-[#059669]">{item.orders}</p>
                  </div>
                </div>

                <div className="bg-black/[0.02] rounded-xl p-3 mb-3">
                  <p className="text-[10px] text-[#8E8E93] mb-1">Winning Hook</p>
                  <p className="text-xs text-[#1C1C1E] italic">"{item.hook}"</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                  <Calendar size={12} />
                  <span>{new Date(item.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 bg-gradient-to-r from-[#007AFF]/10 to-[#059669]/10 rounded-2xl p-6 border border-[#007AFF]/20">
        <h3 className="font-bold text-[#1C1C1E] mb-4">📊 AI Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <ArrowUp className="text-[#059669] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1E]">Best Performing: Red Chrome Nails</p>
              <p className="text-xs text-[#8E8E93]">Make 5 more videos similar to this style</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowDown className="text-[#DC2626] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1E]">Underperforming: Pink Marble</p>
              <p className="text-xs text-[#8E8E93]">Try different hooks or pause this content type</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="text-[#007AFF] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1E]">Suggested Bundle</p>
              <p className="text-xs text-[#8E8E93]">Edge Glue + Press-On Kit could increase AOV by ₦8,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
