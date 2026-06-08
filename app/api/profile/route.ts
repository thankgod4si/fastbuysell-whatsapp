import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('full_name, reply_to_email')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data ?? { full_name: '', reply_to_email: '' })
}

export async function PATCH(request: Request) {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, reply_to_email } = await request.json()

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name, reply_to_email, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
