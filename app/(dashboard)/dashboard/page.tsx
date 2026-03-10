import { createServerSupabaseClient } from '@/lib/supabase-server'
import AIPicks from '@/components/AIPicks'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  const { data: punts } = await supabase
    .from('punts').select('*').eq('user_id', user!.id)
    .order('created_at', { ascending: false }).limit(6)

  const p         = profile as any
  const allPunts  = (punts ?? []) as any[]
  const won       = allPunts.filter((b: any) => b.result === 'won')
  const staked    = allPunts.reduce((s: number, b: any) => s + b.stake, 0)
  const payout    = won.reduce((s: number, b: any) => s + b.payout, 0)
  const profit    = payout - staked
  const winRate   = allPunts.length ? Math.round((won.length / allPunts.length) * 100) : 0
  const firstName = p?.full_name?.split(' ')[0] ?? 'Punter'

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-fade-up">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-5xl leading-none tracking-wide text-white">
          G'DAY, <span className="text-[#d4ff00]">{firstName.toUpperCase()}</span>
        </h1>
        <p className="text-sm text-[#555] mt-2">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Balance',      value: `$${(p?.balance ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, accent: true },
          { label: 'Net Profit',   value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, green: profit > 0, red: profit < 0 },
          { label: 'Win Rate',     value: `${winRate}%` },
          { label: 'Total Punts',  value: allPunts.length },
        ].map(({ label, value, accent, green, red }: any) => (
          <div key={label} className="bg-[#141414] border border-[#222] rounded-2xl px-5 py-4">
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">{label}</div>
            <div className={`font-display text-3xl leading-none ${accent ? 'text-[#d4ff00]' : green ? 'text-[#22c55e]' : red ? 'text-[#ff4444]' : 'text-white'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Main layout: picks + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* AI Picks */}
        <AIPicks />

        {/* Recent punts sidebar */}
        <div>
          <h2 className="font-display text-2xl tracking-wide text-white mb-4">RECENT PUNTS</h2>
          {allPunts.length === 0 ? (
            <div className="bg-[#141414] border border-[#222] rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm text-[#666]">No punts yet.<br />Add a leg from today's picks.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allPunts.map((punt: any) => (
                <div key={punt.id} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 hover:border-[#333] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{punt.pick}</div>
                    <div className="text-xs text-[#555] truncate mt-0.5">{punt.event}</div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs text-[#888] font-display text-base">{punt.odds}×</span>
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-1 rounded-full ${
                      punt.result === 'won'     ? 'bg-[#22c55e20] text-[#22c55e]' :
                      punt.result === 'lost'    ? 'bg-[#ff444420] text-[#ff4444]' :
                      'bg-[#33333380] text-[#666]'
                    }`}>
                      {punt.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
