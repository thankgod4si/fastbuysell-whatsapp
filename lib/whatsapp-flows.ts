const BASE    = `https://graph.facebook.com/v21.0`
const TOKEN   = process.env.WHATSAPP_ACCESS_TOKEN!
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!

export interface FlowField {
  key: string
  label: string
  type: 'text' | 'email' | 'number' | 'dropdown' | 'textarea'
  required?: boolean
  options?: string[]
}

export function generateFlowJson(params: {
  fields: FlowField[]
  screenTitle: string
  ctaText: string
  flowDbId?: string
}) {
  const children: object[] = []

  for (const field of params.fields) {
    if (field.type === 'dropdown') {
      children.push({
        type: 'Dropdown',
        label: field.label,
        name: field.key,
        required: field.required ?? false,
        'data-source': (field.options ?? []).map(o => ({ id: o, title: o })),
      })
    } else if (field.type === 'textarea') {
      children.push({
        type: 'TextArea',
        label: field.label,
        name: field.key,
        required: field.required ?? false,
      })
    } else {
      children.push({
        type: 'TextInput',
        label: field.label,
        name: field.key,
        required: field.required ?? false,
        'input-type': field.type,
      })
    }
  }

  const payload: Record<string, string> = {}
  if (params.flowDbId) payload.flow_db_id = params.flowDbId

  children.push({
    type: 'Footer',
    label: params.ctaText,
    'on-click-action': { name: 'complete', payload },
  })

  return {
    version: '3.1',
    screens: [
      {
        id: 'LEAD_FORM',
        title: params.screenTitle,
        terminal: true,
        success: true,
        data: {},
        layout: { type: 'SingleColumnLayout', children },
      },
    ],
  }
}

export async function createMetaFlow(name: string) {
  const res = await fetch(`${BASE}/${WABA_ID}/flows`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, categories: ['LEAD_GENERATION'] }),
  })
  return res.json() as Promise<{ id?: string; error?: { message: string } }>
}

export async function uploadFlowJson(metaFlowId: string, flowJson: object) {
  const blob = new Blob([JSON.stringify(flowJson)], { type: 'application/json' })
  const form = new FormData()
  form.append('file', blob, 'flow.json')
  form.append('name', 'flow.json')
  form.append('asset_type', 'FLOW_JSON')

  const res = await fetch(`${BASE}/${metaFlowId}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  })
  return res.json() as Promise<{ success?: boolean; error?: { message: string }; data?: { details?: { validation_errors?: unknown[] } } }>
}

export async function publishMetaFlow(metaFlowId: string) {
  const res = await fetch(`${BASE}/${metaFlowId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  return res.json() as Promise<{ success?: boolean; error?: { message: string } }>
}

// â”€â”€â”€ Booking Flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Multi-screen flow:
//   Screen 0: Welcome / intro
//   Screens 1..N: One product per screen â€” image, name, price, description
//   Screen N+1: Booking details (name, date, time)
//   Screen N+2: Payment method (Transfer / Card)
// All selections are forwarded through payload and returned in one nfm_reply.

export interface BookingFlowItem {
  id: string
  name: string
  price: number
  currency: string
  duration_mins?: number | null
  description?: string | null
  image_url?: string | null
  is_popular?: boolean
}

// WhatsApp Flows v3.1 supports Image components via alt_text + src (URL).
// Each product screen: Image (if url exists) â†’ TextHeading (name + price) â†’
// TextBody (description) â†’ Footer "Select This" navigates to BOOKING_DETAILS screen.

export function generateBookingFlow(params: {
  businessName: string
  items: BookingFlowItem[]
  flowDbId?: string
}) {
  const SYM: Record<string, string> = { NGN: 'â‚¦', EUR: 'â‚¬', USD: '$', GBP: 'Â£' }
  const short = params.businessName.slice(0, 20)

  // Each product becomes a screen â€” customer browses left/right (nav buttons)
  // Max 10 products in the flow (WhatsApp Flows JSON size limit ~200kb)
  const displayItems = params.items.slice(0, 10)

  // â”€â”€ Product screens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const productScreens = displayItems.map((item, idx) => {
    const sym  = SYM[item.currency] ?? item.currency
    const dur  = item.duration_mins ? ` Â· ${item.duration_mins}min` : ''
    const pop  = item.is_popular ? ' â­' : ''
    const priceLabel = `${sym}${Number(item.price).toLocaleString()}${dur}${pop}`
    const isLast = idx === displayItems.length - 1
    const isFirst = idx === 0

    const children: object[] = []

    // Product image (if available)
    if (item.image_url) {
      children.push({
        type: 'Image',
        src: item.image_url,
        'scale-type': 'cover',
        height: 200,
        'alt-text': item.name,
      })
    }

    children.push({ type: 'TextHeading', text: item.name })
    children.push({ type: 'TextSubheading', text: priceLabel })

    if (item.description) {
      children.push({ type: 'TextBody', text: item.description })
    }

    // "Select this" â†’ go to BOOKING_DETAILS, passing product id/name/price
    children.push({
      type: 'Footer',
      label: `Select â€” ${priceLabel}`,
      'on-click-action': {
        name: 'navigate',
        next: { type: 'screen', name: 'BOOKING_DETAILS' },
        payload: {
          selected_id:    item.id,
          selected_name:  item.name,
          selected_price: String(item.price),
          selected_currency: item.currency,
        },
      },
    })

    // Navigation: Previous / Next as EmbeddedLinks above footer
    const navButtons: object[] = []
    if (!isFirst) {
      navButtons.push({
        type: 'EmbeddedLink',
        text: 'â† Previous',
        'on-click-action': {
          name: 'navigate',
          next: { type: 'screen', name: `PRODUCT_${idx - 1}` },
          payload: {},
        },
      })
    }
    if (!isLast) {
      navButtons.push({
        type: 'EmbeddedLink',
        text: 'Next â†’',
        'on-click-action': {
          name: 'navigate',
          next: { type: 'screen', name: `PRODUCT_${idx + 1}` },
          payload: {},
        },
      })
    }

    // Insert nav between description and footer
    if (navButtons.length > 0) {
      children.splice(children.length - 1, 0, ...navButtons)
    }

    return {
      id: `PRODUCT_${idx}`,
      title: `${short} â€” ${idx + 1}/${displayItems.length}`,
      data: {
        // These will be filled by previous screen navigation payload
        selected_id:       { type: 'string', __example__: '' },
        selected_name:     { type: 'string', __example__: '' },
        selected_price:    { type: 'string', __example__: '0' },
        selected_currency: { type: 'string', __example__: 'NGN' },
      },
      layout: { type: 'SingleColumnLayout', children },
    }
  })

  // â”€â”€ Booking details screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const detailsScreen = {
    id: 'BOOKING_DETAILS',
    title: 'Your Details',
    data: {
      selected_id:       { type: 'string', __example__: '' },
      selected_name:     { type: 'string', __example__: '' },
      selected_price:    { type: 'string', __example__: '0' },
      selected_currency: { type: 'string', __example__: 'NGN' },
    },
    layout: {
      type: 'SingleColumnLayout',
      children: [
        {
          type: 'TextSubheading',
          text: 'You selected: ${data.selected_name}',
        },
        {
          type: 'TextInput',
          label: 'Your full name',
          name: 'customer_name',
          required: true,
          'input-type': 'text',
        },
        {
          type: 'TextInput',
          label: 'Preferred date (e.g. June 25)',
          name: 'preferred_date',
          required: true,
          'input-type': 'text',
        },
        {
          type: 'TextInput',
          label: 'Preferred time (e.g. 2:00pm)',
          name: 'preferred_time',
          required: true,
          'input-type': 'text',
        },
        {
          type: 'Footer',
          label: 'Continue to Payment â†’',
          'on-click-action': {
            name: 'navigate',
            next: { type: 'screen', name: 'PAYMENT' },
            payload: {
              selected_id:       '${data.selected_id}',
              selected_name:     '${data.selected_name}',
              selected_price:    '${data.selected_price}',
              selected_currency: '${data.selected_currency}',
              customer_name:     '${form.customer_name}',
              preferred_date:    '${form.preferred_date}',
              preferred_time:    '${form.preferred_time}',
            },
          },
        },
      ],
    },
  }

  // â”€â”€ Payment screen (terminal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const finalPayload: Record<string, string> = {
    service_id:        '${data.selected_id}',
    service_name:      '${data.selected_name}',
    service_price:     '${data.selected_price}',
    service_currency:  '${data.selected_currency}',
    customer_name:     '${data.customer_name}',
    preferred_date:    '${data.preferred_date}',
    preferred_time:    '${data.preferred_time}',
    payment_method:    '${form.payment_method}',
  }
  if (params.flowDbId) finalPayload.flow_db_id = params.flowDbId

  const paymentScreen = {
    id: 'PAYMENT',
    title: 'Payment Method',
    terminal: true,
    success: true,
    data: {
      selected_id:       { type: 'string', __example__: '' },
      selected_name:     { type: 'string', __example__: '' },
      selected_price:    { type: 'string', __example__: '0' },
      selected_currency: { type: 'string', __example__: 'NGN' },
      customer_name:     { type: 'string', __example__: '' },
      preferred_date:    { type: 'string', __example__: '' },
      preferred_time:    { type: 'string', __example__: '' },
    },
    layout: {
      type: 'SingleColumnLayout',
      children: [
        {
          type: 'TextSubheading',
          text: '${data.selected_name}',
        },
        {
          type: 'TextBody',
          text: 'Hi ${data.customer_name} ðŸ‘‹  You\'re almost done! Choose how you\'d like to pay.',
        },
        {
          type: 'RadioButtonsGroup',
          label: 'Payment method',
          name: 'payment_method',
          required: true,
          'data-source': [
            { id: 'transfer', title: 'ðŸ¦ Pay with Bank Transfer' },
            { id: 'card',     title: 'ðŸ’³ Pay with Card / Link'  },
          ],
        },
        {
          type: 'Footer',
          label: 'Confirm Booking âœ…',
          'on-click-action': { name: 'complete', payload: finalPayload },
        },
      ],
    },
  }

  return {
    version: '3.1',
    screens: [
      ...productScreens,
      detailsScreen,
      paymentScreen,
    ],
  }
}

/** Create a booking flow in Meta, upload the JSON, and publish it. Returns the meta_flow_id. */
export async function createAndPublishBookingFlow(params: {
  businessName: string
  items: BookingFlowItem[]
  existingFlowId?: string | null
  wabaId?: string
  token?: string
  flowDbId?: string
}): Promise<{ metaFlowId: string; error?: string }> {
  const wid = params.wabaId ?? WABA_ID
  const tok = params.token  ?? TOKEN
  const flowJson = generateBookingFlow({ businessName: params.businessName, items: params.items, flowDbId: params.flowDbId })

  let metaFlowId = params.existingFlowId ?? null

  // Create new flow if needed
  if (!metaFlowId) {
    const createRes = await fetch(`${BASE}/${wid}/flows`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${params.businessName} Booking`, categories: ['BOOKING'] }),
    })
    const createData = await createRes.json() as { id?: string; error?: { message: string } }
    if (!createData.id) return { metaFlowId: '', error: createData.error?.message ?? 'Failed to create flow' }
    metaFlowId = createData.id
  }

  // Upload JSON
  const blob = new Blob([JSON.stringify(flowJson)], { type: 'application/json' })
  const form = new FormData()
  form.append('file', blob, 'flow.json')
  form.append('name', 'flow.json')
  form.append('asset_type', 'FLOW_JSON')
  const uploadRes = await fetch(`${BASE}/${metaFlowId}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: form,
  })
  const uploadData = await uploadRes.json() as { success?: boolean; error?: { message: string } }
  if (!uploadData.success) return { metaFlowId, error: uploadData.error?.message ?? 'Upload failed' }

  // Publish
  const pubRes = await fetch(`${BASE}/${metaFlowId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const pubData = await pubRes.json() as { success?: boolean; error?: { message: string } }
  if (!pubData.success) return { metaFlowId, error: pubData.error?.message ?? 'Publish failed' }

  return { metaFlowId }
}

