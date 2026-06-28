const { createClient } = require('@supabase/supabase-js')

// Replace with your Supabase URL and service role key
const supabaseUrl = 'https://txzktkbhcesmenhdubsi.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertTestMessage() {
  try {
    // Use a specific user ID (replace with your actual user ID)
    const userId = process.env.USER_ID || 'YOUR_USER_ID_HERE'
    
    console.log('Using user ID:', userId)

    // Insert a pending message to trigger the webhook
    const { data, error } = await supabase
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
      console.error('Error inserting message:', error)
      return
    }

    console.log('✅ Pending message inserted successfully!')
    console.log('Message ID:', data.id)
    console.log('Recipient:', data.recipient)
    console.log('Status:', data.status)
    console.log('Webhook should fire automatically...')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

insertTestMessage()
