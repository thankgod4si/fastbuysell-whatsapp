// Direct Supabase REST API call
const supabaseUrl = 'https://txzktkbhcesmenhdubsi.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

async function insertPendingMessage() {
  const contactId = 'test-contact-' + crypto.randomUUID()
  
  const payload = {
    contact_id: contactId,
    channel: 'whatsapp',
    recipient: '+2348104965538',
    content: 'Test message from auto-send webhook - this should arrive automatically!',
    msg_type: 'text',
    user_id: '00000000-0000-0000-0000-000000000000',
    direction: 'outbound',
    status: 'pending',
    created_at: new Date().toISOString()
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/message_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Error:', error)
      process.exit(1)
    }

    const data = await response.json()
    console.log('✅ Pending message inserted successfully!')
    console.log('Message ID:', data[0].id)
    console.log('Recipient:', data[0].recipient)
    console.log('Status:', data[0].status)
    console.log('Webhook should fire automatically...')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

insertPendingMessage()
