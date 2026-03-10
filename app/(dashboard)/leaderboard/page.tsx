import { createServerSupabaseClient } from '@/lib/supabase-server'

const TIER_COLORS: Record<string, string> = {
  Platinum: 'text-[#e5e4e2]', Gold: 'text-[#ffd700]',
  Silver: 'text-[#c0c0c0]',   Bronze: 'text-[#cd7f32]',
}

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rows } = await supabase.from('leaderboard_view').select('*').order('rank', { ascending: true }).limit(50)
  const entries = (rows ?? []) as any[]
  const userRank = entries.findIndex((e: any) => e.user_id === user?.id) + 1

  return (
    <div className="p-5 lg:p-8 max-w-[900px] mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-4xl lg:text-5xl leading-none tracking-wide text-white">
          LEADER<span className="text-[#d4ff00]">BOARD</span>
        </h1>
        <p className="text-xs text-[#555] mt-1">Ranked by net profit</p>
      </div>

      {userRank > 0 && (
        <div className="bg-[#141414] border border-[#d4ff00] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
          <span className="text-sm text-[#888]">Your rank</span>
          <span className="font-display text-3xl text-[#d4ff00]">#{userRank}</span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-[#141414] border border-[#222] rounded-2xl py-16 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-sm text-[#555]">No data yet. Start punting to appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry: any, i: number) => {
            const isMe = entry.user_id === user?.id
            return (
              <div key={entry.user_id}
                className={`rounded-2xl border p-4 transition-colors ${isMe ? 'border-[#d4ff00] bg-[#141414]' : 'border-[#222] bg-[#141414] hover:border-[#2a2a2a]'}`}>
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`font-display text-2xl leading-none w-8 shrink-0 ${i < 3 ? 'text-[#d4ff00]' : 'text-[#333]'}`}>
                    #{entry.rank}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-[#222] text-white font-display text-sm flex items-center justify-center rounded-full shrink-0">
                    {entry.avatar_initials ?? '??'}
                  </div>
                  {/* Name + tier */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${isMe ? 'text-[#d4ff00]' : 'text-white'}`}>
                      {entry.full_name ?? 'Anonymous'} {isMe && <span className="text-[#555] font-normal">(you)</span>}
                    </div>
                    <div className={`text-[10px] uppercase tracking-widest ${TIER_COLORS[entry.tier] ?? 'text-[#555]'}`}>
                      {entry.tier}
                    </div>
                  </div>
                  {/* Profit */}
                  <div className={`font-display text-xl leading-none shrink-0 ${entry.total_profit >= 0 ? 'text-[#22c55e]' : 'text-[#ff4444]'}`}>
                    {entry.total_profit >= 0 ? '+' : ''}${Number(entry.total_profit).toFixed(0)}
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e1e1e]">
                  {[
                    { label: 'Punts', value: entry.total_punts },
                    { label: 'Wins', value: entry.wins },
                    { label: 'Win Rate', value: `${entry.win_rate ?? 0}%` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[9px] text-[#444] uppercase tracking-widest">{label}</div>
                      <div className="text-sm text-[#888] font-medium">{value}</div>
                    </div>
                  ))}
                  {/* Win rate bar */}
                  <div className="flex-1 ml-2">
                    <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#d4ff00] rounded-full" style={{ width: `${entry.win_rate ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
