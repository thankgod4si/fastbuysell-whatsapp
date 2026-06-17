import crypto from 'crypto'
import { supabase } from './supabase'

const ALGO = 'aes-256-gcm'
const KEY = process.env.META_TOKEN_ENCRYPTION_KEY || ''

function getKey(): Buffer {
  if (!KEY || KEY.length < 32) throw new Error('META_TOKEN_ENCRYPTION_KEY must be set to 32+ chars')
  return Buffer.from(KEY.padEnd(32).slice(0, 32))
}

export function encryptToken(plain: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptToken(enc: string) {
  const b = Buffer.from(enc, 'base64')
  const iv = b.slice(0, 12)
  const tag = b.slice(12, 28)
  const ciphertext = b.slice(28)
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  const out = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return out.toString('utf8')
}

export async function refreshLongLivedToken(shortLivedToken: string) {
  const clientId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  if (!clientId || !clientSecret) throw new Error('Missing META_APP_ID or META_APP_SECRET')

  const res = await fetch(`https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`)
  const json = await res.json()
  return json
}

export async function rotateLinkedAccountToken(linkedAccountId: string) {
  const { data, error } = await supabase.from('linked_accounts').select('*').eq('id', linkedAccountId).single()
  if (error || !data) throw error || new Error('linked account not found')
  const enc = data.access_token
  if (!enc) throw new Error('no token stored')
  const token = decryptToken(enc)
  const long = await refreshLongLivedToken(token)
  if (long.access_token) {
    const encrypted = encryptToken(long.access_token)
    await supabase.from('linked_accounts').update({ access_token: encrypted, expires_at: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null }).eq('id', linkedAccountId)
    return { success: true }
  }
  return { success: false, details: long }
}
