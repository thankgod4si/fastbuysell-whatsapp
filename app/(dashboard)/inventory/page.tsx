'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Search, Filter, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  category: 'hair_care' | 'styling_tools' | 'chemicals' | 'accessories' | 'other'
  sku: string
  quantity: number
  minStock: number
  price: number
  supplier: string
  lastRestocked: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

const CATEGORY_CONFIG = {
  hair_care: { label: 'Hair Care', color: '#007AFF' },
  styling_tools: { label: 'Styling Tools', color: '#059669' },
  chemicals: { label: 'Chemicals', color: '#FF9500' },
  accessories: { label: 'Accessories', color: '#FF6B6B' },
  other: { label: 'Other', color: '#8E8E93' }
}

const STATUS_CONFIG = {
  in_stock: { label: 'In Stock', color: '#059669', bg: '#ECFDF5' },
  low_stock: { label: 'Low Stock', color: '#FF9500', bg: '#FFFBEB' },
  out_of_stock: { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2' }
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'hair_care' | 'styling_tools' | 'chemicals' | 'accessories' | 'other'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    // Simulated product data - in production, fetch from database
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Edge Control',
        category: 'hair_care',
        sku: 'HC-001',
        quantity: 45,
        minStock: 20,
        price: 3500,
        supplier: 'Beauty Supply Co.',
        lastRestocked: '2026-05-15',
        status: 'in_stock'
      },
      {
        id: '2',
        name: 'Braiding Hair (Pack)',
        category: 'hair_care',
        sku: 'HC-002',
        quantity: 12,
        minStock: 30,
        price: 8000,
        supplier: 'Hair World',
        lastRestocked: '2026-05-10',
        status: 'low_stock'
      },
      {
        id: '3',
        name: 'Flat Iron',
        category: 'styling_tools',
        sku: 'ST-001',
        quantity: 5,
        minStock: 3,
        price: 25000,
        supplier: 'Pro Tools Inc.',
        lastRestocked: '2026-04-20',
        status: 'in_stock'
      },
      {
        id: '4',
        name: 'Hair Relaxer',
        category: 'chemicals',
        sku: 'CH-001',
        quantity: 0,
        minStock: 10,
        price: 4500,
        supplier: 'ChemPro',
        lastRestocked: '2026-03-15',
        status: 'out_of_stock'
      },
      {
        id: '5',
        name: 'Wig Cap',
        category: 'accessories',
        sku: 'AC-001',
        quantity: 50,
        minStock: 25,
        price: 1500,
        supplier: 'Beauty Supply Co.',
        lastRestocked: '2026-05-18',
        status: 'in_stock'
      },
      {
        id: '6',
        name: 'Scalp Oil',
        category: 'hair_care',
        sku: 'HC-003',
        quantity: 8,
        minStock: 15,
        price: 4000,
        supplier: 'Natural Hair Co.',
        lastRestocked: '2026-05-12',
        status: 'low_stock'
      }
    ]

    setProducts(mockProducts)
    setLoading(false)
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.category === filterCategory
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchCategory && matchStatus
  })

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.status === 'in_stock').length,
    lowStock: products.filter(p => p.status === 'low_stock').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalValue: products.reduce((s, p) => s + (p.price * p.quantity), 0)
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Product Inventory</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Manage salon products, stock levels, and suppliers</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Package size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Products</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">In Stock</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{stats.inStock}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Low Stock</span>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={20} className="text-[#DC2626]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Out of Stock</span>
          </div>
          <p className="text-2xl font-black text-[#DC2626]">{stats.outOfStock}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Package size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Value</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">₦{stats.totalValue.toLocaleString()}</p>
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
            placeholder="Search products..."
            className="w-full bg-white border border-black/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'hair_care', 'styling_tools', 'chemicals', 'accessories', 'other'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterCategory === c 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_CONFIG[c].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterStatus === s 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-white text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8E8E93]">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8E8E93]">No products found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black/[0.02]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                        <Package size={18} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1E] text-sm">{product.name}</p>
                        <p className="text-xs text-[#8E8E93]">Min: {product.minStock}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93] font-mono">{product.sku}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${CATEGORY_CONFIG[product.category].color}15`, color: CATEGORY_CONFIG[product.category].color }}>
                      {CATEGORY_CONFIG[product.category].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#1C1C1E]">{product.quantity}</p>
                    <p className="text-xs text-[#8E8E93]">Restocked: {new Date(product.lastRestocked).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#059669]">₦{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-[#8E8E93]">{product.supplier}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: STATUS_CONFIG[product.status].bg, color: STATUS_CONFIG[product.status].color }}>
                      {STATUS_CONFIG[product.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[#007AFF] text-xs font-semibold hover:underline">Edit</button>
                      <button className="text-[#FF6B6B] text-xs font-semibold hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/[0.06]">
              <h2 className="text-xl font-black text-[#1C1C1E]">Add New Product</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Product Name</label>
                <input type="text" placeholder="Enter product name" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">SKU</label>
                  <input type="text" placeholder="HC-001" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Category</label>
                  <select className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors">
                    <option value="">Select category</option>
                    <option value="hair_care">Hair Care</option>
                    <option value="styling_tools">Styling Tools</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Quantity</label>
                  <input type="number" placeholder="0" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Min Stock</label>
                  <input type="number" placeholder="0" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Price (₦)</label>
                  <input type="number" placeholder="0" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Supplier</label>
                  <input type="text" placeholder="Supplier name" className="w-full bg-white border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007AFF] transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-white border border-black/[0.06] text-[#1C1C1E] rounded-xl text-xs font-semibold hover:bg-black/[0.02] transition-colors">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-semibold hover:bg-[#0066D6] transition-colors">
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
