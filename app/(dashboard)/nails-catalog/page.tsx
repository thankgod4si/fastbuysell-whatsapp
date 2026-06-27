'use client'

import { useState } from 'react'
import { Package, Star, Crown, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface NailProduct {
  id: string
  name: string
  category: 'custom' | 'ready-made' | 'luxury' | 'bridal' | 'limited'
  price: number
  image: string
  stock: number
  featured: boolean
}

export default function NailsCatalogPage() {
  const [products] = useState<NailProduct[]>([
    {
      id: '1',
      name: 'Custom Almond Nude Set',
      category: 'custom',
      price: 24000,
      image: '🤎',
      stock: 50,
      featured: true
    },
    {
      id: '2',
      name: 'Red Chrome Stiletto',
      category: 'custom',
      price: 28000,
      image: '🔴',
      stock: 35,
      featured: true
    },
    {
      id: '3',
      name: 'Pink Marble Coffin',
      category: 'custom',
      price: 32000,
      image: '🌸',
      stock: 28,
      featured: false
    },
    {
      id: '4',
      name: 'Gold Accent Oval',
      category: 'ready-made',
      price: 18000,
      image: '✨',
      stock: 100,
      featured: true
    },
    {
      id: '5',
      name: 'Classic Nude Short',
      category: 'ready-made',
      price: 15000,
      image: '🩰',
      stock: 150,
      featured: false
    },
    {
      id: '6',
      name: 'Bridal Pearl Set',
      category: 'bridal',
      price: 45000,
      image: '👰',
      stock: 20,
      featured: true
    },
    {
      id: '7',
      name: 'Luxury Crystal Edition',
      category: 'luxury',
      price: 55000,
      image: '💎',
      stock: 15,
      featured: true
    },
    {
      id: '8',
      name: 'Limited Edition Summer Vibes',
      category: 'limited',
      price: 35000,
      image: '🌴',
      stock: 10,
      featured: true
    }
  ])

  const categoryConfig = {
    custom: { label: 'Custom Sets', icon: Package, color: '#007AFF', bg: '#007AFF15' },
    'ready-made': { label: 'Ready-Made', icon: Star, color: '#059669', bg: '#05966915' },
    luxury: { label: 'Luxury Collection', icon: Crown, color: '#FF9500', bg: '#FF950015' },
    bridal: { label: 'Bridal Collection', icon: Sparkles, color: '#AF52DE', bg: '#AF52DE15' },
    limited: { label: 'Limited Edition', icon: Sparkles, color: '#DC2626', bg: '#DC262615' }
  }

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const categoryStats = {
    custom: products.filter(p => p.category === 'custom').length,
    'ready-made': products.filter(p => p.category === 'ready-made').length,
    luxury: products.filter(p => p.category === 'luxury').length,
    bridal: products.filter(p => p.category === 'bridal').length,
    limited: products.filter(p => p.category === 'limited').length
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Product Catalog</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Manage your press-on nail collections</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all' 
              ? 'bg-[#007AFF] text-white' 
              : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
          }`}
        >
          All ({products.length})
        </button>
        {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map(cat => {
          const config = categoryConfig[cat]
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
              }`}
            >
              {config.label} ({categoryStats[cat]})
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => {
          const config = categoryConfig[product.category]
          const Icon = config.icon
          return (
            <div key={product.id} className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden hover:border-[#007AFF]/30 transition-colors">
              <div className="aspect-square bg-gradient-to-br from-[#F2F2F7] to-[#E5E5EA] flex items-center justify-center text-8xl relative">
                {product.image}
                {product.featured && (
                  <div className="absolute top-2 right-2 bg-[#FF9500] text-white text-xs font-bold px-2 py-1 rounded-full">
                    ⭐ Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: config.bg }}>
                    <Icon size={12} style={{ color: config.color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: config.color }}>{config.label}</span>
                </div>
                <h3 className="font-bold text-[#1C1C1E] text-sm mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-[#059669]">₦{product.price.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs text-[#8E8E93]">
                    <Package size={12} />
                    <span>{product.stock} in stock</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Product Button */}
      <div className="mt-6 flex justify-center">
        <button className="px-6 py-3 rounded-2xl bg-[#007AFF] text-white font-semibold hover:bg-[#0066D6] transition-colors flex items-center gap-2">
          <Package size={18} />
          Add New Product
        </button>
      </div>
    </div>
  )
}
