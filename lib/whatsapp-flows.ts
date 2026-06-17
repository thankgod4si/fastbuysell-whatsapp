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
    body: JSON.stringify({ name, categories: ['APPOINTMENT_BOOKING'] }),
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

// ─── Booking Flow ─────────────────────────────────────────────────────────────
// Single-screen booking form. After submission the webhook sends interactive
// payment buttons (Pay with Card / Bank Transfer / Pay with USSD).

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

export function generateBookingFlow(params: {
  businessName: string
  items: BookingFlowItem[]
  flowDbId?: string
}) {
  const SYM: Record<string, string> = { NGN: 'N', EUR: 'EUR ', USD: '$', GBP: 'GBP ' }

  const serviceOptions = params.items.map(item => {
    const sym = SYM[item.currency] ?? item.currency
    const dur = item.duration_mins ? ` (${item.duration_mins}min)` : ''
    return { id: item.id, title: `${item.name} - ${sym}${Number(item.price).toLocaleString()}${dur}` }
  })

  const payload: Record<string, string> = {
    service_id:     '${form.service_id}',
    customer_name:  '${form.customer_name}',
    customer_phone: '${form.customer_phone}',
    preferred_date: '${form.preferred_date}',
    preferred_time: '${form.preferred_time}',
  }
  if (params.flowDbId) payload.flow_db_id = params.flowDbId

  return {
    version: '3.1',
    screens: [
      {
        id: 'BOOKING',
        title: params.businessName.slice(0, 24),
        terminal: true,
        success: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Dropdown',
              label: 'Choose a style / service',
              name: 'service_id',
              required: true,
              'data-source': serviceOptions,
            },
            {
              type: 'TextInput',
              label: 'Preferred date (e.g. Friday, 23 May)',
              name: 'preferred_date',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              label: 'Preferred time (e.g. 1:00 PM)',
              name: 'preferred_time',
              required: true,
              'input-type': 'text',
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
              label: 'Your phone number',
              name: 'customer_phone',
              required: false,
              'input-type': 'phone',
            },
            {
              type: 'Footer',
              label: 'Confirm Booking',
              'on-click-action': { name: 'complete', payload },
            },
          ],
        },
      },
    ],
  }
}

export async function createAndPublishBookingFlow(params: {
  businessName: string
  items: BookingFlowItem[]
  existingFlowId?: string | null
  wabaId?: string
  token?: string
  flowDbId?: string
}): Promise<{ metaFlowId: string; error?: string }> {
  const wid = params.wabaId ?? WABA_ID
  const tok = params.token ?? TOKEN
  const flowJson = generateBookingFlow({
    businessName: params.businessName,
    items: params.items,
    flowDbId: params.flowDbId,
  })

  let metaFlowId = params.existingFlowId ?? null

  if (!metaFlowId) {
    const res = await fetch(`${BASE}/${wid}/flows`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${params.businessName} Booking`, categories: ['APPOINTMENT_BOOKING'] }),
    })
    const data = await res.json() as { id?: string; error?: { message: string } }
    if (!data.id) return { metaFlowId: '', error: data.error?.message ?? 'Failed to create flow' }
    metaFlowId = data.id
  }

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

  const pubRes = await fetch(`${BASE}/${metaFlowId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const pubData = await pubRes.json() as { success?: boolean; error?: { message: string } }
  if (!pubData.success) return { metaFlowId, error: pubData.error?.message ?? 'Publish failed' }

  return { metaFlowId }
}
