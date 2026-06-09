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
