import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://outreachhq.xyz'

export const metadata: Metadata = {
  title: 'OutreachHQ – WhatsApp & Email Automation',
  description: 'Send WhatsApp templates and email campaigns at scale. Capture leads automatically.',
  metadataBase: new URL(APP_URL),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
