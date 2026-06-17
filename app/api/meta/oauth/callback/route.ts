import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { encryptToken } from '@/lib/meta'

async function exchangeShortLived(clientId: string, clientSecret: string, redirectUri: string, code: string) {
  const tokenRes = await fetch(`https://graph.facebook.com/v16.0/oauth/access_token?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(clientSecret)}&code=${encodeURIComponent(code)}`)
  return tokenRes.json()
}

async function exchangeLongLived(clientId: string, clientSecret: string, shortLived: string) {
  const res = await fetch(`https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&fb_exchange_token=${encodeURIComponent(shortLived)}`)
  return res.json()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })

  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // verify state
  const { data: states } = await authClient.from('oauth_states').select('*').eq('user_id', user.id).eq('state', state).limit(1)
  if (!states || !states.length) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

  const clientId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || ''}/api/meta/oauth/callback`
  if (!clientId || !clientSecret) return NextResponse.json({ error: 'Server not configured (META_APP_ID/META_APP_SECRET missing)' }, { status: 500 })

  // exchange short-lived
  const tokenResp: any = await exchangeShortLived(clientId, clientSecret, redirectUri, code)
  if (!tokenResp.access_token) return NextResponse.json({ error: 'Failed to exchange code', details: tokenResp }, { status: 500 })

  // get long-lived
  const longResp: any = await exchangeLongLived(clientId, clientSecret, tokenResp.access_token)
  const accessToken = longResp.access_token || tokenResp.access_token
  const expiresAt = longResp.expires_in ? new Date(Date.now() + longResp.expires_in * 1000) : null

  // fetch pages and ig accounts with friendly names
  const pagesRes = await fetch(`https://graph.facebook.com/v16.0/me/accounts?fields=id,name,connected_instagram_account{username},product_catalogs{ id,name }&access_token=${encodeURIComponent(accessToken)}`)
  const pagesJson = await pagesRes.json()

  const linkedInserts: any[] = []
  if (pagesJson.data && Array.isArray(pagesJson.data)) {
    for (const p of pagesJson.data) {
      const pageId = p.id
      const pageName = p.name || null
      const igUserId = p.connected_instagram_account?.id || null
      const igUsername = p.connected_instagram_account?.username || null
      const pageCatalogs = Array.isArray(p.product_catalogs?.data) ? p.product_catalogs.data : []
      const catalogId = pageCatalogs[0]?.id || null
      const catalogName = pageCatalogs[0]?.name || null

      linkedInserts.push({
        user_id: user.id,
        fb_page_id: pageId,
        fb_page_name: pageName,
        ig_user_id: igUserId,
        ig_username: igUsername,
        access_token: encryptToken(accessToken),
        scopes: [],
        expires_at: expiresAt,
        catalog_id: catalogId,
        catalog_name: catalogName,
      })
    }
  }

  // also try to fetch WhatsApp business accounts with friendly names
  try {
    const waRes = await fetch(`https://graph.facebook.com/v16.0/me?fields=whatsapp_business_accounts{display_name}&access_token=${encodeURIComponent(accessToken)}`)
    const waJson = await waRes.json()
    if (waJson.whatsapp_business_accounts?.data?.length) {
      for (const w of waJson.whatsapp_business_accounts.data) {
        linkedInserts.push({
          user_id: user.id,
          whatsapp_phone_id: w.id,
          whatsapp_name: w.display_name || null,
          access_token: encryptToken(accessToken),
          scopes: [],
          expires_at: expiresAt,
        })
      }
    }
  } catch (e) {}

  // upsert linked_accounts (simple approach)
  for (const ins of linkedInserts) {
    await authClient.from('linked_accounts').upsert(ins)
  }

  // clean up state
  await authClient.from('oauth_states').delete().eq('user_id', user.id).eq('state', state)

  const returnTo = states[0].return_to || '/dashboard'
  return NextResponse.redirect(returnTo)
}
