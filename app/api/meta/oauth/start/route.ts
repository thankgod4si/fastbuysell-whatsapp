export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const returnTo = url.searchParams.get('returnTo') || '/dashboard'

  const state = Math.random().toString(36).slice(2)
  // store state
  await authClient.from('oauth_states').insert({ user_id: user.id, state, return_to: returnTo })

  const clientId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || ''}/api/meta/oauth/callback`
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_messages',
    'pages_manage_metadata',
  ].join(',')

  const fbOAuth = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`

  return NextResponse.redirect(fbOAuth)
}
