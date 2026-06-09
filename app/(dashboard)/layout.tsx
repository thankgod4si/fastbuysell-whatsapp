'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#F2F2F7]"
      style={{ '--sb-w': collapsed ? '3rem' : '16rem' } as React.CSSProperties}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 overflow-y-auto p-8 min-w-0">{children}</main>
    </div>
  )
}
