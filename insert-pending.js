const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://txzktkbhcesmenhdubsi.supabase.co'
// You need to set your service role key as environment variable or replace below
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertPendingMessage() {
  try {
    const { data, error } = await supabase
      .from('message_logs')
      .insert({
        contact_id: 'test-contact-' + crypto.randomUUID(),
        channel: 'whatsapp',
        recipient: '+2348104965538',
        content: 'Test message from auto-send webhook - this should arrive automatically!',
        msg_type: 'text',
        user_id: '00000000-0000-0000-0000-000000000000',
        direction: 'outbound',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error:', error)
      process.exit(1)
    }

    console.log('✅ Pending message inserted successfully!')
    console.log('Message ID:', data.id)
    console.log('Recipient:', data.recipient)
    console.log('Status:', data.status)
    console.log('Webhook should fire automatically...')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

insertPendingMessage()
