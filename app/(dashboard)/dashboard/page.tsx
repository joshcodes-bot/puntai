import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Profile, Punt } from '@/types/database'

const AI_PICKS = [
  { id: 1, event: 'Man City vs Arsenal', market: 'Match Winner', pick: 'Man City', odds: 2.10, confidence: 87, sport: 'Football' },
  { id: 2, event: 'Lakers vs Celtics', market: 'Spread -4.5', pick: 'Lakers -4.5', odds: 1.91, confidence: 74, sport: 'NBA' },
  { id: 3, event: 'Djokovic vs Sinner', market: 'Match Winner', pick: 'Djokovic', odds: 1.65, confidence: 91, sport: 'Tennis' },
  { id: 4, event: 'Chiefs vs Eagles', market: 'Total O/U 47.5', pick: 'Over 47.5', odds: 1.87, confidence: 69, sport: 'NFL' },
]

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: punts } = await supabase
    .from('punts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const p = profile as Profile | null
  const allPunts = (punts ?? []) as Punt[]
  const won = allPunts.filter(b => b.result === 'won')
  const totalStaked = allPunts.reduce((s, b) => s + b.stake, 0)
  const totalPayout = won.reduce((s, b) => s + b.payout, 0)
  const profit = totalPayout - totalStaked
  const winRate = allPunts.length ? Math.round((won.length / allPunts.length) * 100) : 0

  return (
    <div className="p-10 max-w-[1100px] mx-auto animate-fade-up">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-display text-[64px] leading-none tracking-wide">
          GM, <span className="text-[#d4ff00]">{p?.full_name?.split(' ')[0] ?? 'PUNTER'}</span>
        </h1>
        <p className="text-[11px] text-[#555] mt-2 tracking-wide">Here's what the AI is seeing today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border border-[#2a2a2a] mb-10">
        {[
          { label: 'Balance', value: `$${(p?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, lime: true },
          { label: 'Net Profit', value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, lime: profit >= 0, red: profit < 0 },
          { label: 'Win Rate', value: `${winRate}%`, plain: true },
          { label: 'Punts Placed', value: allPunts.length, plain: true },
        ].map(({ label, value, lime, red, plain }) => (
          <div key={label} className="px-6 py-7 border-r border-[#2a2a2a] last:border-r-0 hover:bg-[#1c1c1c] transition-colors">
            <div className="text-[9px] tracking-[3px] uppercase text-[#555] mb-3">{label}</div>
            <div className={`font-display text-[44px] leading-none ${lime ? 'text-[#d4ff00]' : red ? 'text-[#ff2d2d]' : 'text-white'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6">
        {/* AI Picks */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-[28px] tracking-wide">TODAY'S AI PICKS</h2>
            <span className="text-[9px] tracking-[2px] uppercase text-[#555] border border-[#2a2a2a] px-3 py-1">
              {AI_PICKS.length} picks live
            </span>
          </div>
          <div className="space-y-3">
            {AI_PICKS.map(pick => (
              <div key={pick.id} className="border border-[#2a2a2a] p-5 hover:bg-[#1c1c1c] transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] tracking-[2px] uppercase text-[#555] border border-[#2a2a2a] px-2 py-0.5">{pick.sport}</span>
                      <span className="text-[9px] tracking-[1px] text-[#555]">{pick.market}</span>
                    </div>
                    <div className="text-[13px] text-[#888] mb-1">{pick.event}</div>
                    <div className="font-display text-[24px] leading-none text-white">{pick.pick}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[9px] tracking-[2px] uppercase text-[#555] mb-1">Odds</div>
                    <div className="font-display text-[32px] text-[#d4ff00] leading-none">{pick.odds}</div>
                  </div>
                </div>
                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] tracking-[2px] uppercase text-[#555]">AI Confidence</span>
                    <span className="text-[11px] text-white">{pick.confidence}%</span>
                  </div>
                  <div className="h-[2px] bg-[#2a2a2a]">
                    <div
                      className="h-full bg-[#d4ff00] transition-all duration-700"
                      style={{ width: `${pick.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent punts */}
        <div>
          <h2 className="font-display text-[28px] tracking-wide mb-4">RECENT PUNTS</h2>
          {allPunts.length === 0 ? (
            <div className="border border-[#2a2a2a] p-8 text-center">
              <div className="font-display text-[40px] text-[#2a2a2a] leading-none mb-3">◎</div>
              <div className="text-[11px] text-[#555] tracking-wide">No punts yet.<br />Head to My Punts to get started.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {allPunts.map(punt => (
                <div key={punt.id} className="border border-[#2a2a2a] px-4 py-3 flex items-center justify-between hover:bg-[#1c1c1c] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-white truncate">{punt.pick}</div>
                    <div className="text-[10px] text-[#555] truncate">{punt.event}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-[#888]">${punt.stake}</span>
                    <span className={`text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 ${
                      punt.result === 'won'     ? 'bg-[#d4ff00] text-black' :
                      punt.result === 'lost'    ? 'bg-[#2a2a2a] text-[#555]' :
                      punt.result === 'pending' ? 'border border-[#555] text-[#555]' :
                      'bg-[#2a2a2a] text-[#555]'
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
