export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get user's WhatsApp phone number ID
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get phone number ID from user's profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wa_phone_number_id')
      .eq('id', user.id)
      .single()

    const phoneNumberId = profile?.wa_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json({ error: 'No WhatsApp phone number configured' }, { status: 400 })
    }

    // Upload to Meta
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('type', type)
    uploadFormData.append('messaging_product', 'whatsapp')

    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        body: uploadFormData,
      }
    )

    const metaResult = await metaResponse.json()

    if (!metaResponse.ok) {
      console.error('Meta upload error:', metaResult)
      return NextResponse.json({ error: 'Failed to upload to Meta', details: metaResult }, { status: 500 })
    }

    return NextResponse.json({ id: metaResult.id })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
