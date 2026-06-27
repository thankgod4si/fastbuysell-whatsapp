'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, TrendingUp, DollarSign, Users, Target, ArrowUpRight, Bot, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  metrics?: {
    label: string
    value: string
    change: string
    positive: boolean
  }[]
}

export default function AIGrowthPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Hello! I'm your AI Growth Manager. I've analyzed your press-on nails business data and I'm here to help you increase revenue and optimize operations. Here's what I've noticed:",
      timestamp: new Date(Date.now() - 7200000),
      metrics: [
        { label: 'Monthly Revenue', value: '₦420,000', change: '+23%', positive: true },
        { label: 'Avg Order Value', value: '₦24,000', change: '+12%', positive: true },
        { label: 'Repeat Rate', value: '68%', change: '+5%', positive: true }
      ]
    },
    {
      id: '2',
      role: 'ai',
      content: "Based on your data, I've identified 3 key opportunities to increase revenue by 35% this month. Would you like me to explain them?",
      timestamp: new Date(Date.now() - 7100000)
    },
    {
      id: '3',
      role: 'user',
      content: "Yes",
      timestamp: new Date(Date.now() - 7000000)
    },
    {
      id: '4',
      role: 'ai',
      content: "Here are the 3 key opportunities I've identified:\n\n**1. Bundle Edge Glue with Press-On Kits**\nCustomers who buy press-on nails are 65% more likely to purchase edge glue. By bundling these automatically, you could add ₦80,000/month in revenue.\n\n**2. Content Strategy Optimization**\nYour Red Chrome videos are performing 3x better than Pink Marble. I recommend creating 5 more Red Chrome-style videos this week to capitalize on the winning hook.\n\n**3. Personalized Style Recommendations**\nYou have 23 customers with style profiles. Sending personalized recommendations based on their favorite shapes and colours could recover ₦120,000 in lost revenue.\n\nWhich opportunity would you like me to help you implement?",
      timestamp: new Date(Date.now() - 6900000),
      metrics: [
        { label: 'Potential Revenue', value: '₦320,000', change: '+76%', positive: true },
        { label: 'Best Video', value: 'Red Chrome', change: '3x CTR', positive: true }
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('opportunity') || lowerInput.includes('opportunities') || lowerInput.includes('explain')) {
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: "Here are the 3 key opportunities I've identified:\n\n**1. Product Bundle Upsell**\nCustomers who receive Wig Installs are 72% more likely to purchase Edge Control. By bundling these automatically, you could add ₦45,000/month in revenue.\n\n**2. Reactivation Campaign**\nYou have 23 at-risk customers who haven't visited in 60+ days. A targeted 15% comeback offer could recover ₦180,000 in lost revenue.\n\n**3. Premium Service Tier**\nYour top 20% of customers spend 3x more. Launching a VIP membership with priority booking and exclusive services could generate ₦120,000/month.\n\nWhich opportunity would you like me to help you implement?",
        timestamp: new Date(),
        metrics: [
          { label: 'Potential Revenue', value: '₦345,000', change: '+48%', positive: true },
          { label: 'At-Risk Customers', value: '23', change: '-12%', positive: false }
        ]
      }
    }
    
    if (lowerInput.includes('bundle') || lowerInput.includes('upsell')) {
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: "Great choice! Here's my implementation plan for the Product Bundle Upsell:\n\n**Step 1:** Automatically add Edge Control to all Wig Install bookings\n**Step 2:** Train staff to recommend the bundle during booking\n**Step 3:** Offer 10% discount on the bundle to increase adoption\n\nBased on your historical data, this should:\n- Increase average order value by 15%\n- Generate ₦45,000 additional monthly revenue\n- Improve customer satisfaction with complete service\n\nI can set up the automation in your booking flow. Shall I proceed?",
        timestamp: new Date(),
        metrics: [
          { label: 'Projected Revenue', value: '₦45,000', change: '+15%', positive: true },
          { label: 'Adoption Rate', value: '72%', change: 'Projected', positive: true }
        ]
      }
    }
    
    if (lowerInput.includes('reactivation') || lowerInput.includes('comeback')) {
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: "Perfect! Here's the Reactivation Campaign strategy:\n\n**Target:** 23 at-risk customers (60+ days since last visit)\n\n**Campaign:**\n- Send personalized WhatsApp message with 15% discount\n- Highlight their favorite services from history\n- Include limited-time urgency (7 days)\n\n**Expected Results:**\n- 40% response rate\n- 25% rebooking rate\n- ₦180,000 recovered revenue\n\nI can draft the message templates and schedule the campaign. Ready to launch?",
        timestamp: new Date(),
        metrics: [
          { label: 'Target Customers', value: '23', change: 'At-risk', positive: false },
          { label: 'Recovered Revenue', value: '₦180,000', change: '+25%', positive: true }
        ]
      }
    }
    
    if (lowerInput.includes('vip') || lowerInput.includes('premium') || lowerInput.includes('membership')) {
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: "Excellent! Here's the VIP Membership strategy:\n\n**Membership Tiers:**\n- Silver (₦5,000/month): Priority booking, 5% discount\n- Gold (₦10,000/month): All Silver + free products monthly\n- Platinum (₦15,000/month): All Gold + exclusive stylist access\n\n**Your Top 20% Customers:**\n- Average spend: ₦45,000/month\n- Perfect for Gold/Platinum tiers\n- 80% likely to join\n\n**Revenue Impact:**\n- 30 customers join at avg ₦10,000 = ₦300,000/month\n- Increased loyalty and lifetime value\n\nShall I create the membership landing page?",
        timestamp: new Date(),
        metrics: [
          { label: 'Projected MRR', value: '₦300,000', change: '+42%', positive: true },
          { label: 'Target Customers', value: '30', change: 'Top 20%', positive: true }
        ]
      }
    }
    
    if (lowerInput.includes('revenue') || lowerInput.includes('sales') || lowerInput.includes('growth')) {
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: "Here's your current revenue performance analysis:\n\n**This Month:** ₦720,000 (+23% vs last month)\n**Growth Drivers:**\n- Wig Install services: +40% volume\n- Product sales: +35% revenue\n- Repeat customers: +12% rate\n\n**Areas for Improvement:**\n- Tuesday/Thursday bookings are 40% lower\n- Chemical services underperforming by 25%\n- No-show rate at 8% (industry avg: 5%)\n\n**My Recommendations:**\n1. Run mid-week promotions to fill gaps\n2. Bundle chemical treatments with popular services\n3. Implement deposit system to reduce no-shows\n\nWant me to create a detailed action plan?",
        timestamp: new Date(),
        metrics: [
          { label: 'Monthly Revenue', value: '₦720,000', change: '+23%', positive: true },
          { label: 'Growth Rate', value: '23%', change: 'Above target', positive: true },
          { label: 'No-show Rate', value: '8%', change: '-3%', positive: false }
        ]
      }
    }
    
    // Default response
    return {
      id: Date.now().toString(),
      role: 'ai',
      content: "I understand you're interested in growing your business. Based on your current metrics, I can help you with:\n\n• Revenue optimization strategies\n• Customer retention campaigns\n• Pricing and packaging analysis\n• Staff performance improvement\n• Product inventory management\n\nWhat specific area would you like to focus on? I can provide data-driven recommendations tailored to your salon's performance.",
      timestamp: new Date(),
      metrics: [
        { label: 'Monthly Revenue', value: '₦720,000', change: '+23%', positive: true },
        { label: 'Growth Rate', value: '23%', change: 'Above target', positive: true }
      ]
    }
  }

  const quickActions = [
    { label: 'Show growth opportunities', query: 'What are the growth opportunities?' },
    { label: 'Analyze revenue trends', query: 'Analyze my revenue trends' },
    { label: 'Customer retention tips', query: 'How can I improve customer retention?' },
    { label: 'Pricing strategy', query: 'Should I adjust my pricing?' }
  ]

  return (
    <div className="max-w-6xl h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#059669] flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1E]">AI Growth Manager</h1>
            <p className="text-sm text-[#8E8E93]">Your intelligent business advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
            <TrendingUp size={16} className="text-[#059669]" />
            <span className="text-sm font-bold text-[#059669]">+23% Growth</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-black/[0.04] flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'ai' && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#059669] flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-white" />
                </div>
              )}
              <div className={`max-w-2xl ${message.role === 'user' ? 'bg-[#007AFF] text-white' : 'bg-black/[0.02]'} rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                {message.metrics && (
                  <div className="mt-4 pt-4 border-t border-black/[0.08]">
                    <p className="text-xs font-semibold mb-3">Key Metrics:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {message.metrics.map((metric, i) => (
                        <div key={i} className={`p-3 rounded-xl ${metric.positive ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className="text-xs text-[#8E8E93]">{metric.label}</p>
                          <p className="text-lg font-bold text-[#1C1C1E]">{metric.value}</p>
                          <p className={`text-xs font-semibold ${metric.positive ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                            {metric.change}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs mt-2 opacity-60">{message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center shrink-0">
                  <User size={20} className="text-white" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#059669] flex items-center justify-center shrink-0">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-black/[0.02] rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-t border-black/[0.04]">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(action.query)
                  handleSend()
                }}
                className="flex-shrink-0 px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl text-xs font-semibold hover:bg-[#007AFF]/20 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-black/[0.04]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about revenue growth, customer retention, pricing strategies..."
              className="flex-1 bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-[#0066D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
