'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Clock, Send, Plus, Edit, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface CampaignTemplate {
  id: string
  name: string
  type: 'appointment_reminder' | 'post_service' | 'product_recommendation' | 'maintenance_reminder' | 'inactive_campaign'
  subject: string
  body: string
  active: boolean
  sentCount: number
  conversionRate: number
}

export default function FollowUpPage() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])

  useEffect(() => {
    // Mock data - in production, fetch from database
    const mockTemplates: CampaignTemplate[] = [
      {
        id: '1',
        name: 'Appointment Reminder',
        type: 'appointment_reminder',
        subject: 'Your appointment is tomorrow',
        body: 'Hi {{customer_name}},\n\nYour appointment is tomorrow at {{time}} with {{stylist}}.\n\nSee you then!',
        active: true,
        sentCount: 245,
        conversionRate: 92
      },
      {
        id: '2',
        name: 'Post-Service Follow-Up',
        type: 'post_service',
        subject: 'How was your experience?',
        body: 'Hi {{customer_name}},\n\nHow would you rate your experience today? Your feedback helps us improve.\n\nReply with a rating from 1-5.',
        active: true,
        sentCount: 189,
        conversionRate: 78
      },
      {
        id: '3',
        name: 'Product Recommendation',
        type: 'product_recommendation',
        subject: 'Recommended product for you',
        body: 'Hi {{customer_name}},\n\nBased on your recent {{service}}, we recommend {{product}}.\n\nWould you like to add it to your next appointment?',
        active: true,
        sentCount: 156,
        conversionRate: 68
      },
      {
        id: '4',
        name: 'Braid Maintenance Reminder',
        type: 'maintenance_reminder',
        subject: 'Time for maintenance?',
        body: 'Hi {{customer_name}},\n\nIt\'s been 6 weeks since your braid appointment. Would you like to book maintenance?',
        active: true,
        sentCount: 98,
        conversionRate: 45
      },
      {
        id: '5',
        name: 'Inactive Customer Campaign',
        type: 'inactive_campaign',
        subject: 'We miss you! 15% off',
        body: 'Hi {{customer_name}},\n\nWe haven\'t seen you in a while. Enjoy 15% off your next appointment!\n\nBook now: {{booking_link}}',
        active: false,
        sentCount: 67,
        conversionRate: 23
      }
    ]

    setTemplates(mockTemplates)
    setLoading(false)
  }, [])

  const typeLabels = {
    appointment_reminder: 'Appointment Reminder',
    post_service: 'Post-Service Follow-Up',
    product_recommendation: 'Product Recommendation',
    maintenance_reminder: 'Maintenance Reminder',
    inactive_campaign: 'Inactive Customer'
  }

  const typeColors = {
    appointment_reminder: '#8B5CF6',
    post_service: '#059669',
    product_recommendation: '#FF9500',
    maintenance_reminder: '#007AFF',
    inactive_campaign: '#FF6B6B'
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1C1E]">Follow-Up Automation</h1>
          <p className="text-sm text-[#8E8E93] mt-1">Automated campaign templates for customer engagement</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold hover:bg-[#7C3AED] transition-colors">
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-[#8B5CF6]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Total Campaigns</span>
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{templates.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Send size={20} className="text-[#059669]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Messages Sent</span>
          </div>
          <p className="text-2xl font-black text-[#059669]">{templates.reduce((s, t) => s + t.sentCount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-[#007AFF]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Active Campaigns</span>
          </div>
          <p className="text-2xl font-black text-[#007AFF]">{templates.filter(t => t.active).length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#8E8E93]">Avg Conversion</span>
          </div>
          <p className="text-2xl font-black text-[#FF9500]">
            {Math.round(templates.reduce((s, t) => s + t.conversionRate, 0) / templates.length)}%
          </p>
        </div>
      </div>

      {/* Campaign Templates */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <h3 className="font-bold text-[#1C1C1E]">Campaign Templates</h3>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {templates.map(template => (
            <div key={template.id} className="p-6 hover:bg-black/[0.02] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ 
                        background: `${typeColors[template.type]}15`,
                        color: typeColors[template.type]
                      }}
                    >
                      {typeLabels[template.type]}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      template.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1C1C1E] mb-1">{template.name}</h4>
                  <p className="text-sm text-[#8E8E93] mb-3">{template.subject}</p>
                  <p className="text-xs text-[#8E8E93] line-clamp-2">{template.body}</p>
                </div>
                <div className="ml-6 text-right">
                  <p className="text-2xl font-black text-[#1C1C1E]">{template.conversionRate}%</p>
                  <p className="text-xs text-[#8E8E93]">conversion</p>
                  <p className="text-xs text-[#8E8E93] mt-1">{template.sentCount} sent</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/[0.04]">
                <button className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6] hover:underline">
                  <Edit size={14} />
                  Edit
                </button>
                <button className="flex items-center gap-2 text-xs font-semibold text-[#FF6B6B] hover:underline">
                  <Trash2 size={14} />
                  Delete
                </button>
                <button className="ml-auto text-xs font-semibold text-[#059669] hover:underline">
                  {template.active ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Campaign */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04] border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plus size={20} className="text-[#8B5CF6]" />
            <div>
              <p className="font-semibold text-[#1C1C1E]">Create Custom Campaign</p>
              <p className="text-xs text-[#8E8E93]">Build automated follow-up sequences with triggers</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold hover:bg-[#7C3AED] transition-colors">
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
