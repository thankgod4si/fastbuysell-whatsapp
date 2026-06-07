import { NextResponse } from 'next/server'

const BASE = `https://graph.facebook.com/v21.0`
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }

  const res = await fetch(`${BASE}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.trim().replace(/\s+/g, ''),
      type: 'text',
      text: {
        body: '👋 Hello from Fast Buy & Sell! This is a test message to confirm the WhatsApp API connection is working.',
      },
    }),
  })

  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id })
}
