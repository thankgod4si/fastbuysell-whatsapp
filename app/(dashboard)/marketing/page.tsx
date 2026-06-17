'use client'

export default function MarketingPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[#1C1C1E] font-black text-2xl">Meta Ads</h1>
        <p className="text-[#8E8E93] text-sm mt-0.5">Run click-to-WhatsApp ads directly from your connected Meta pages</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] p-12 text-center">
        <div className="text-5xl mb-4">📣</div>
        <p className="font-bold text-[#1C1C1E]">Meta Ads — Coming Soon</p>
        <p className="text-[#8E8E93] text-sm mt-2 max-w-sm mx-auto">
          Create click-to-WhatsApp campaigns from here. Connect your Facebook page under <strong>Meta &amp; WhatsApp</strong> to get started.
        </p>
        <a href="/meta"
          className="inline-block mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#1877F2,#0a5fd4)' }}>
          Connect Meta Page →
        </a>
      </div>
    </div>
  )
}
