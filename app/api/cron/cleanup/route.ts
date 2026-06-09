import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: Request) {
  // Protect the endpoint — Render cron must send this header
  const auth = request.headers.get('x-cron-secret')
  if (CRON_SECRET && auth !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete contacts that were sent a message 42+ hours ago but never responded
  const cutoff = new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .in('status', ['sent', 'delivered', 'read'])
    .lt('sent_at', cutoff)
    .select('id')

  if (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deleted = data?.length ?? 0
  console.log(`Cron cleanup: deleted ${deleted} unresponsive contacts (42h window)`)
  return NextResponse.json({ deleted, cutoff })
}

// Also support GET so Render's HTTP cron can hit it without a body
export async function GET(request: Request) {
  return POST(request)
}
