// WhatsApp
export type ContactStatus = 'pending' | 'sent' | 'replied' | 'blacklisted'
export type LeadStatus = 'new' | 'contacted' | 'closed'

export interface Contact {
  id: string
  phone: string
  status: ContactStatus
  sent_at: string | null
  created_at: string
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
  email_sent_at: string | null
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
