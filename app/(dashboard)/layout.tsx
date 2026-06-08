'use client'

import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F2F2F7]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8 min-w-0">{children}</main>
    </div>
  )
}
