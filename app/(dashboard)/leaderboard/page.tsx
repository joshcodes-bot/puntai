import { createServerSupabaseClient } from '@/lib/supabase'

const TIER_STYLES: Record<string, string> = {
  Platinum: 'text-[#e5e4e2] border-[#e5e4e2]',
  Gold:     'text-[#ffd700] border-[#ffd700]',
  Silver:   'text-[#c0c0c0] border-[#c0c0c0]',
  Bronze:   'text-[#cd7f32] border-[#cd7f32]',
}

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Query leaderboard — aggregate from punts + profiles
  const { data: rows } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('rank', { ascending: true })
    .limit(50)

  const entries = rows ?? []
  const userRank = entries.findIndex(e => e.user_id === user?.id) + 1

  return (
    <div className="p-10 max-w-[900px] mx-auto animate-fade-up">
      <div className="mb-10">
        <h1 className="font-display text-[64px] leading-none tracking-wide">
          LEADER<span className="text-[#d4ff00]">BOARD</span>
        </h1>
        <p className="text-[11px] text-[#555] mt-2">Ranked by net profit · Updated live</p>
      </div>

      {/* Your rank callout */}
      {userRank > 0 && (
        <div className="border border-[#d4ff00] px-6 py-4 mb-8 flex items-center justify-between animate-fade-up-1">
          <div className="text-[11px] tracking-[2px] uppercase text-[#555]">Your Rank</div>
          <div className="font-display text-[40px] text-[#d4ff00] leading-none">#{userRank}</div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="border border-[#2a2a2a] py-20 text-center">
          <div className="font-display text-[48px] text-[#2a2a2a] mb-3">◆</div>
          <div className="text-[11px] text-[#555] tracking-wide">No data yet. Start punting to appear here.</div>
        </div>
      ) : (
        <table className="w-full border-collapse border border-[#2a2a2a]">
          <thead>
            <tr>
              {['Rank', 'Punter', 'Tier', 'Punts', 'Wins', 'Win Rate', 'Net Profit'].map(h => (
                <th key={h} className="text-left text-[9px] tracking-[2.5px] uppercase text-[#555] px-4 py-3 border-b border-[#2a2a2a] bg-[#1c1c1c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isMe = entry.user_id === user?.id
              return (
                <tr
                  key={entry.user_id}
                  className={`transition-colors ${isMe ? 'bg-[#d4ff0008] border-l-2 border-l-[#d4ff00]' : 'hover:bg-[#1c1c1c]'}`}
                >
                  <td className="px-4 py-4 border-b border-[#2a2a2a]">
                    <span className={`font-display text-[20px] leading-none ${i < 3 ? 'text-[#d4ff00]' : 'text-[#555]'}`}>
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#2a2a2a] text-white font-display text-[12px] flex items-center justify-center flex-shrink-0">
                        {entry.avatar_initials ?? '??'}
                      </div>
                      <span className={`text-[13px] ${isMe ? 'text-[#d4ff00]' : 'text-white'}`}>
                        {entry.full_name ?? 'Anonymous'} {isMe && <span className="text-[9px] tracking-[1px] text-[#555]">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-b border-[#2a2a2a]">
                    <span className={`text-[9px] tracking-[2px] uppercase border px-2 py-0.5 ${TIER_STYLES[entry.tier] ?? 'text-[#555] border-[#555]'}`}>
                      {entry.tier}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-b border-[#2a2a2a] text-[13px] text-[#888]">{entry.total_punts}</td>
                  <td className="px-4 py-4 border-b border-[#2a2a2a] text-[13px] text-[#888]">{entry.wins}</td>
                  <td className="px-4 py-4 border-b border-[#2a2a2a] text-[13px]">
                    <div className="flex items-center gap-2">
                      <span>{entry.win_rate}%</span>
                      <div className="flex-1 h-[2px] bg-[#2a2a2a] max-w-[60px]">
                        <div className="h-full bg-[#d4ff00]" style={{ width: `${entry.win_rate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-4 border-b border-[#2a2a2a] font-display text-[18px] leading-none ${
                    entry.total_profit >= 0 ? 'text-[#d4ff00]' : 'text-[#ff2d2d]'
                  }`}>
                    {entry.total_profit >= 0 ? '+' : ''}${Number(entry.total_profit).toFixed(0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
