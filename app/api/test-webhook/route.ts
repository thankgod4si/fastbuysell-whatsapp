export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    // Get first user ID for testing
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (!profiles || profiles.length === 0) {
      // If no profiles, use a placeholder UUID for testing
      const userId = '00000000-0000-0000-0000-000000000000'
      console.log('No profiles found, using placeholder user ID')
      
      const { data, error } = await supabaseAdmin
        .from('message_logs')
        .insert({
          contact_id: 'test-contact-' + crypto.randomUUID(),
          channel: 'whatsapp',
          recipient: '+2348104965538',
          content: 'Test message from auto-send webhook - this should arrive automatically!',
          msg_type: 'text',
          user_id: userId,
          direction: 'outbound',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Pending message inserted (placeholder user), webhook should fire automatically',
        record: data
      })
    }

    const userId = profiles[0].id

    // Insert a pending message to trigger the webhook
    const { data, error } = await supabaseAdmin
      .from('message_logs')
      .insert({
        contact_id: 'test-contact-' + crypto.randomUUID(),
        channel: 'whatsapp',
        recipient: '+2348104965538',
        content: 'Test message from auto-send webhook - this should arrive automatically!',
        msg_type: 'text',
        user_id: userId,
        direction: 'outbound',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pending message inserted, webhook should fire automatically',
      record: data
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
