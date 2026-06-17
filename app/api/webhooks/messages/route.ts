import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { decryptToken } from '@/lib/meta'
import { loadBusinessContext, getOrCreateSession, processBookingMessage } from '@/lib/ai-booking'
import crypto from 'crypto'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

/** Send a reply DM via Meta Graph API (IG or FB Messenger) */
async function sendMetaDM(recipientId: string, text: string, pageId: string, token: string, platform: 'instagram' | 'facebook') {
  const endpoint = platform === 'instagram'
    ? `${GRAPH_BASE}/me/messages`
    : `${GRAPH_BASE}/me/messages`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' }),
  })
  return res.json()
}

function verifySignature(rawBody: string, headers: Headers) {
  const sig256 = headers.get('x-hub-signature-256')
  const sig = headers.get('x-hub-signature')
  const secret = process.env.META_APP_SECRET || ''
  if (!secret) return false
  const compute = (algo: string, expected: string) => {
    const h = crypto.createHmac(algo, secret).update(rawBody).digest('hex')
    return expected === h
  }
  if (sig256 && sig256.startsWith('sha256=')) return compute('sha256', sig256.split('=')[1])
  if (sig && sig.startsWith('sha1=')) return compute('sha1', sig.split('=')[1])
  return false
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || 'ok')
  }
  return NextResponse.json({ error: 'Webhook verify failed' }, { status: 403 })
}

export async function POST(request: Request) {
  const raw = await request.text().catch(() => '')
  if (!raw) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  if (!verifySignature(raw, request.headers)) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })

  const body = JSON.parse(raw)
  if (!body || !Array.isArray(body.entry)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  for (const entry of body.entry) {
    const pageId = entry.id

    // Page messenger events
    const messaging = entry.messaging || []
    for (const m of messaging) {
      const senderId = m.sender?.id
      const recipientId = m.recipient?.id
      const text = m.message?.text || m.message?.text?.body || null

      if (!senderId || !recipientId) continue

      // find linked account owning recipientId
      const { data: linked } = await supabase
        .from('linked_accounts')
        .select('*')
        .or(`fb_page_id.eq.${recipientId},ig_user_id.eq.${recipientId}`)
        .limit(1)

      if (!linked || !linked.length) continue
      const la = linked[0]

      // save inbound message to message_logs
      const inbound = {
        channel: 'social',
        direction: 'inbound',
        recipient: senderId,
        content: text ?? '[non-text message]',
        msg_type: 'dm',
        status: 'read',
        sent_at: new Date().toISOString(),
        user_id: la.user_id,
        external_id: senderId,
      }
      await supabase.from('message_logs').insert(inbound)

      if (!text) continue

      // ── AI Booking: try to handle via AI first (if business has echoes_enabled) ──
      const { data: bizProfile } = await supabaseAdmin
        .from('profiles')
        .select('echoes_enabled')
        .eq('id', la.user_id)
        .maybeSingle()

      // Determine platform from linked_account fields
      const platform: 'instagram' | 'facebook' = la.ig_user_id ? 'instagram' : 'facebook'

      if (bizProfile?.echoes_enabled) {
        try {
          const [ctx, session] = await Promise.all([
            loadBusinessContext(la.user_id, ''),  // no WA phone_number_id for social DMs
            getOrCreateSession(la.user_id, senderId),
          ])
          if (ctx) {
            const { intent } = await processBookingMessage(text, ctx, session)
            const token = la.access_token ? decryptToken(la.access_token) : null
            if (token && intent.reply_to_customer) {
              await sendMetaDM(senderId, intent.reply_to_customer, pageId, token, platform)
              await supabase.from('message_logs').insert({
                channel: 'social', direction: 'outbound', recipient: senderId,
                content: intent.reply_to_customer, msg_type: 'ai_reply',
                status: 'sent', sent_at: new Date().toISOString(), user_id: la.user_id,
              })
            }
            continue  // AI handled — skip trigger matching
          }
        } catch (err) {
          console.error('[messages webhook] AI error for', platform, err)
        }
      }

      // ── Fallback: keyword trigger matching ──────────────────────────────────
      const { data: triggers } = await supabase
        .from('triggers')
        .select('*')
        .eq('active', true)
        .in('channel', ['instagram', 'facebook', 'any'])
        .or(`linked_account_id.is.null,user_id.eq.${la.user_id}`)

      let matched = null
      if (triggers && Array.isArray(triggers)) {
        for (const t of triggers) {
          try {
            const kw = String(t.keyword || '')
            const mt = t.match_type || 'contains'
            if (mt === 'contains' && text.toLowerCase().includes(kw.toLowerCase())) { matched = t; break }
            if (mt === 'exact' && text.trim().toLowerCase() === kw.toLowerCase()) { matched = t; break }
            if (mt === 'regex') { const re = new RegExp(kw, 'i'); if (re.test(text)) { matched = t; break } }
          } catch (e) { continue }
        }
      }

      if (matched) {
        const reply = String(matched.reply_template || '')
        if (matched.auto_send) {
          const token = la.access_token ? decryptToken(la.access_token) : null
          if (token) {
            await sendMetaDM(senderId, reply, pageId, token, platform)
            await supabase.from('message_logs').insert({ channel: 'social', direction: 'outbound', recipient: senderId, content: reply, msg_type: 'dm_auto', status: 'sent', sent_at: new Date().toISOString(), user_id: la.user_id })
          }
        } else {
          await supabase.from('message_logs').insert({ channel: 'social', direction: 'outbound', recipient: senderId, content: reply, msg_type: 'dm_auto', status: 'pending', sent_at: new Date().toISOString(), user_id: la.user_id })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
