import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-sm">A</div>
            <span className="text-white font-bold text-sm">Fast Buy &amp; Sell</span>
            <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Link href="/admin" className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Users</Link>
            <Link href="/admin/payments" className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Payments</Link>
          </div>
        </div>
        <Link href="/contacts" className="text-sm text-gray-500 hover:text-white transition-colors">← Back to app</Link>
      </nav>
      <main className="p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
