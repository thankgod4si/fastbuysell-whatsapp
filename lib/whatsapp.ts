const BASE = `https://graph.facebook.com/v21.0`
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const FLOW_ID = process.env.WHATSAPP_FLOW_ID!

async function post(payload: object) {
  const res = await fetch(`${BASE}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function sendInquiryTemplate(to: string) {
  return post({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'car_seller_inquiry',
      language: { code: 'de' },
      components: [
        {
          type: 'button',
          sub_type: 'flow',
          index: '0',
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '1',
          parameters: [{ type: 'payload', payload: 'OPT_OUT' }],
        },
      ],
    },
  })
}

export async function sendFlowMessage(to: string) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: {
        text: 'Vielen Dank für Ihr Interesse! Bitte füllen Sie das Formular aus, damit unser Team Sie schnellstmöglich kontaktieren kann.',
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `fbs_${to}_${Date.now()}`,
          flow_id: FLOW_ID,
          flow_cta: 'Formular ausfüllen',
          flow_action: 'navigate',
          flow_action_payload: {
            screen: 'CONTACT_DETAILS',
          },
        },
      },
    },
  })
}
