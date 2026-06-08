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
}

export interface Lead {
  id: string
  contact_id: string | null
  phone: string
  full_name: string
  email: string
  car_make: string
  car_model: string
  car_year: string
  mileage: string
  asking_price: string
  previous_owners: string
  condition: string | null
  status: LeadStatus
  source: LeadSource
  email_sent_at: string | null
  created_at: string
  user_id: string | null
}

// Message delivery logs
export type MessageLogStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'opened'
export type MessageLogChannel = 'whatsapp' | 'email' | 'sms'

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
