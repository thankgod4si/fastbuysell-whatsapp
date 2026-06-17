// WhatsApp / SMS contacts
export type ContactStatus = 'pending' | 'sent' | 'replied' | 'blacklisted'
export type ContactChannel = 'whatsapp' | 'sms'
export type LeadStatus = 'new' | 'contacted' | 'closed'
export type LeadSource = 'whatsapp' | 'sms' | 'email'

export interface Contact {
  id: string
  phone: string
  status: ContactStatus
  channel: ContactChannel
  sent_at: string | null
  created_at: string
  user_id: string | null
  wa_name: string | null
  name: string | null
}

export interface Lead {
  id: string
  contact_id: string | null
  phone: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  company: string | null
  product_service: string | null
  budget: string | null
  location: string | null
  timeline: string | null
  notes: string | null
  car_make: string | null
  car_model: string | null
  car_year: string | null
  mileage: string | null
  asking_price: string | null
  previous_owners: string | null
  condition: string | null
  response_data: Record<string, unknown> | null
  status: LeadStatus
  source: LeadSource
  email_sent_at: string | null
  created_at: string
  user_id: string | null
}

// Message delivery logs
export type MessageLogStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'opened'
export type MessageLogChannel = 'whatsapp' | 'email' | 'sms' | 'social'

export interface MessageLog {
  id: string
  contact_id: string | null
  lead_id: string | null
  channel: MessageLogChannel
  external_id: string | null
  recipient: string
  status: MessageLogStatus
  sent_at: string
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  failure_reason: string | null
  direction: 'inbound' | 'outbound'
  msg_type: string
  content: string | null
  user_id: string | null
  created_at: string
}

// Email campaigns
export type CampaignStatus = 'draft' | 'active' | 'completed'
export type CampaignContactStatus = 'pending' | 'sent' | 'failed'

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  reply_to: string
  status: CampaignStatus
  created_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  name: string
  email: string
  status: CampaignContactStatus
  sent_at: string | null
  created_at: string
}

export interface CommentTrigger {
  id: string
  user_id: string | null
  platform: 'instagram' | 'facebook'
  page_id: string | null
  post_id?: string | null
  link_url: string
  reply_template: string
  active: boolean
  created_at: string
}
