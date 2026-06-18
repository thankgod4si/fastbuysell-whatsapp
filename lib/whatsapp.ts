const BASE     = `https://graph.facebook.com/v21.0`
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!
const WABA_ID  = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!
const FLOW_ID  = process.env.WHATSAPP_FLOW_ID!

async function post(payload: object, phoneNumberId?: string, token?: string) {
  const pid = phoneNumberId || PHONE_ID
  const tok = token || TOKEN
  const res = await fetch(`${BASE}/${pid}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode = 'en_US',
  components: object[] = [],
  phoneNumberId?: string,
  token?: string
) {
  return post({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  }, phoneNumberId, token)
}

export async function sendInquiryTemplate(to: string, phoneNumberId?: string, token?: string) {
  return sendTemplate(
    to,
    'car_seller_inquiry',
    'de',
    [
      { type: 'button', sub_type: 'flow',        index: '0' },
      { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: 'OPT_OUT' }] },
    ],
    phoneNumberId,
    token
  )
}

export async function sendFlowMessage(
  to: string,
  phoneNumberId?: string,
  opts?: {
    metaFlowId?: string
    screen?: string
    ctaText?: string
    bodyText?: string
    initialData?: Record<string, unknown>
  },
  token?: string
) {
  const flowId = opts?.metaFlowId || FLOW_ID
  const screen = opts?.screen || 'CONTACT_DETAILS'
  const cta    = opts?.ctaText || 'Formular ausfüllen'
  const body   = opts?.bodyText || 'Vielen Dank für Ihr Interesse! Bitte füllen Sie das Formular aus, damit unser Team Sie schnellstmöglich kontaktieren kann.'

  const flowActionPayload: Record<string, unknown> = { screen }
  if (opts?.initialData) flowActionPayload.data = opts.initialData

  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: { text: body },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `fbs_${to}_${Date.now()}`,
          flow_id: flowId,
          flow_cta: cta,
          flow_action: 'navigate',
          flow_action_payload: flowActionPayload,
        },
      },
    },
  }, phoneNumberId, token)
}

export async function sendTextMessage(to: string, text: string, phoneNumberId?: string, token?: string) {
  return post({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }, phoneNumberId, token)
}

export async function submitTemplateToMeta(params: {
  name: string
  category: string
  language: string
  headerText?: string
  body: string
  footerText?: string
}, wabaId?: string, token?: string) {
  const components: object[] = []
  if (params.headerText) {
    components.push({ type: 'HEADER', format: 'TEXT', text: params.headerText })
  }
  components.push({ type: 'BODY', text: params.body })
  if (params.footerText) {
    components.push({ type: 'FOOTER', text: params.footerText })
  }

  const wid = wabaId || WABA_ID
  const tok = token || TOKEN

  const res = await fetch(`${BASE}/${wid}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: params.name,
      language: params.language,
      category: params.category,
      components,
    }),
  })
  return res.json()
}

export async function getTemplateStatus(templateName: string, wabaId?: string, token?: string) {
  const wid = wabaId || WABA_ID
  const tok = token || TOKEN
  const res = await fetch(
    `${BASE}/${wid}/message_templates?name=${templateName}&fields=name,status,rejected_reason`,
    { headers: { Authorization: `Bearer ${tok}` } }
  )
  const data = await res.json()
  return data.data?.[0] ?? null
}

export async function sendInteractiveList(
  to: string,
  phoneNumberId?: string,
  opts?: {
    bodyText: string
    buttonText: string
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  },
  token?: string
) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: opts?.bodyText ?? 'Select an option' },
      action: {
        button: opts?.buttonText ?? 'View Options',
        sections: opts?.sections ?? [],
      },
    },
  }, phoneNumberId, token)
}

export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  phoneNumberId?: string,
  token?: string
) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  }, phoneNumberId, token)
}

/** Send an interactive button message with an image header */
export async function sendImageButtonMessage(
  to: string,
  phoneNumberId?: string,
  opts?: {
    imageUrl: string
    bodyText: string
    footerText?: string
    buttons: Array<{ id: string; title: string }>
  },
  token?: string
) {
  const buttons = (opts?.buttons ?? []).slice(0, 3)
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      header: {
        type: 'image',
        image: { link: opts?.imageUrl },
      },
      body: { text: opts?.bodyText ?? '' },
      ...(opts?.footerText ? { footer: { text: opts.footerText } } : {}),
      action: {
        buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  }, phoneNumberId, token)
}
