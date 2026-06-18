export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decryptToken } from '@/lib/meta'
import crypto from 'crypto'

const GRAPH_BASE = 'https://graph.facebook.com/v17.0'

async function replyToCommentWithToken(commentId: string, message: string, token: string) {
  const response = await fetch(`${GRAPH_BASE}/${commentId}/comments`, {
    method: 'POST',
    body: new URLSearchParams({ message, access_token: token }),
  })

  return response.json()
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

  if (sig256 && sig256.startsWith('sha256=')) {
    return compute('sha256', sig256.split('=')[1])
  }
  if (sig && sig.startsWith('sha1=')) {
    return compute('sha1', sig.split('=')[1])
  }
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
  if (!raw) return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })

  if (!verifySignature(raw, request.headers)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(raw)
  if (!body || !Array.isArray(body.entry)) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  for (const entry of body.entry) {
const pageId = String(entry.id || '').trim()
      const changes = Array.isArray(entry.changes) ? entry.changes : []

      for (const change of changes) {
        const value = change.value || {}
        const commentId = String(value.comment_id || value.id || '').trim()
        const postId = String(value.parent_id || value.post_id || value.media_id || '').trim()
        const message = String(value.message || value.text || value.comment || '').trim()

        if (!commentId || !message || !pageId) continue

        const { data: triggers } = await supabase
          .from('comment_triggers')
          .select('*')
          .eq('active', true)

        const trigger = Array.isArray(triggers)
          ? triggers.find((item: any) => {
              if (item.post_id && item.post_id === postId) return true
              if (item.page_id && item.page_id === pageId) return true
              return !item.post_id && !item.page_id
            })
        : null

      if (!trigger) continue

      const replyText = String(trigger.reply_template || 'Thanks for commenting! Here is your link: {{link}}')
        .replace(/{{\s*link\s*}}/gi, String(trigger.link_url))

      const inboundLog = {
        channel: 'social',
        direction: 'inbound',
        recipient: commentId,
        content: message,
        msg_type: 'comment',
        status: 'read',
        sent_at: new Date().toISOString(),
        user_id: trigger.user_id,
      }

      await supabase.from('message_logs').insert(inboundLog)

      // find linked account to get token
      const { data: linked } = await supabase
        .from('linked_accounts')
        .select('*')
        .or(`fb_page_id.eq.${pageId},ig_user_id.eq.${pageId}`)
        .limit(1)

      let replyResult: any = { error: { message: 'No reply sent' } }
      try {
        if (linked && linked.length) {
          const la = linked[0]
          const token = la.access_token ? decryptToken(la.access_token) : null
          if (token) {
            replyResult = await replyToCommentWithToken(commentId, replyText, token)
          }
        }
      } catch (err) {
        console.error('[comments webhook] reply failed', err)
      }

      const outboundLog = {
        channel: 'social',
        direction: 'outbound',
        recipient: commentId,
        content: replyText,
        msg_type: 'comment_reply',
        status: replyResult?.error ? 'failed' : 'sent',
        external_id: typeof replyResult?.id === 'string' ? replyResult.id : null,
        sent_at: new Date().toISOString(),
        user_id: trigger.user_id,
      }

      await supabase.from('message_logs').insert(outboundLog)
    }
  }

  return NextResponse.json({ success: true })
}
