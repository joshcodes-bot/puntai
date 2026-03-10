'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Pick = {
  id: number
  sport: string
  event: string
  market: string
  pick: string
  odds: number
  confidence: number
  reasoning: string
  commenceTime?: string
}

type Leg = Pick

const SPORT_EMOJI: Record<string, string> = {
  'EPL': '⚽', 'UCL': '⚽', 'Europa': '⚽',
  'NRL': '🏉', 'Rugby Union': '🏉',
  'NBA': '🏀', 'UFC/MMA': '🥊',
}

function formatKickoff(iso?: string) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Pacific/Auckland'
    }) + ' NZT'
  } catch { return null }
}

function ConfBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 68 ? '#d4ff00' : '#f59e0b'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-xs text-[#999] w-8 text-right shrink-0">{pct}%</span>
    </div>
  )
}

export default function AIPicks() {
  const [day, setDay]                 = useState<'today' | 'tomorrow'>('today')
  const [picks, setPicks]             = useState<Pick[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState('')
  const [meta, setMeta]               = useState({ generatedAt: '', gamesAnalysed: 0 })
  const [filter, setFilter]           = useState('All')
  const [legs, setLegs]               = useState<Leg[]>([])
  const [stake, setStake]             = useState('50')
  const [posting, setPosting]         = useState(false)
  const [posted, setPosted]           = useState(false)

  const load = useCallback(async (refresh = false, forDay?: 'today' | 'tomorrow') => {
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    const d_param = forDay ?? day
    try {
      const r = await fetch(`/api/picks?day=${d_param}`)
      const d = await r.json()
      if (d.picks?.length) {
        setPicks(d.picks)
        setMeta({ generatedAt: d.generatedAt, gamesAnalysed: d.gamesAnalysed ?? 0 })
      } else {
        setError(d.error ?? 'No picks available right now.')
      }
    } catch { setError('Could not connect. Check API keys in Vercel.') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function switchDay(d: 'today' | 'tomorrow') {
    if (d === day) return
    setDay(d)
    setFilter('All')
    setPicks([])
    setLegs([])
    load(false, d)
  }

  function toggleLeg(pick: Pick) {
    setLegs(prev =>
      prev.find(l => l.id === pick.id)
        ? prev.filter(l => l.id !== pick.id)
        : [...prev, pick]
    )
    setPosted(false)
  }

  const multiOdds   = legs.reduce((a, l) => a * l.odds, 1)
  const stakeNum    = parseFloat(stake) || 0
  const payout      = stakeNum * multiOdds
  const sports      = ['All', ...Array.from(new Set(picks.map(p => p.sport)))]
  const visible     = filter === 'All' ? picks : picks.filter(p => p.sport === filter)

  async function postMulti() {
    if (!legs.length || !stakeNum) return
    setPosting(true)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const eventName = legs.map(l => l.pick).join(' + ')
      await (sb.from('punts') as any).insert({
        user_id: user.id,
        event: legs.map(l => l.event).join(' | '),
        pick: eventName,
        odds: parseFloat(multiOdds.toFixed(2)),
        stake: stakeNum,
        result: 'pending',
        payout: 0,
        event_date: new Date().toISOString().split('T')[0],
      })
      setPosted(true)
      setLegs([])
    } catch (e) { console.error(e) }
    finally { setPosting(false) }
  }

  // ── LOADING ──
  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white">AI PICKS</h2>
          <p className="text-xs text-[#555] mt-1">Fetching live odds & analysing…</p>
        </div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="bg-[#141414] rounded-2xl p-5 border border-[#222] animate-pulse">
          <div className="h-3 bg-[#222] rounded w-24 mb-3" />
          <div className="h-5 bg-[#222] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#222] rounded w-full mb-1" />
          <div className="h-3 bg-[#222] rounded w-2/3" />
        </div>
      ))}
    </div>
  )

  // ── ERROR ──
  if (error && !picks.length) return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-white mb-4">AI PICKS</h2>
      <div className="bg-[#141414] rounded-2xl border border-[#222] p-10 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-[#777] mb-5 leading-relaxed max-w-xs mx-auto">{error}</p>
        <button onClick={() => load(true)} className="text-xs tracking-widest uppercase px-5 py-2.5 rounded-full border border-[#d4ff00] text-[#d4ff00] hover:bg-[#d4ff00] hover:text-black transition-all">
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white">AI PICKS</h2>
          <p className="text-xs text-[#555] mt-1">
            {meta.gamesAnalysed > 0 && `${meta.gamesAnalysed} games analysed · `}
            {meta.generatedAt && `Updated ${new Date(meta.generatedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="text-xs text-[#555] hover:text-white transition-colors disabled:opacity-30 mt-1"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* ── DAY TABS ── */}
      <div className="flex gap-2 mb-4">
        {(['today', 'tomorrow'] as const).map(d => (
          <button
            key={d}
            onClick={() => switchDay(d)}
            className={`text-xs tracking-widest uppercase px-5 py-2 rounded-full border font-medium transition-all ${
              day === d
                ? 'bg-[#d4ff00] text-black border-[#d4ff00]'
                : 'text-[#555] border-[#2a2a2a] hover:text-white hover:border-[#555]'
            }`}
          >
            {d === 'today' ? '📅 Today' : '📆 Tomorrow'}
          </button>
        ))}
      </div>

      {/* ── MULTI BUILDER ── */}
      {legs.length > 0 && (
        <div className="bg-[#141414] border border-[#d4ff00] rounded-2xl p-5 mb-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-white tracking-wide">MULTI BET</h3>
            <button onClick={() => setLegs([])} className="text-xs text-[#555] hover:text-[#ff4444] transition-colors">Clear all</button>
          </div>

          {/* Legs */}
          <div className="space-y-2 mb-5">
            {legs.map(leg => (
              <div key={leg.id} className="flex items-center justify-between bg-[#1c1c1c] rounded-xl px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">
                    {SPORT_EMOJI[leg.sport] ?? '🎯'} {leg.sport} · {leg.market}
                  </div>
                  <div className="text-sm font-semibold text-white truncate">{leg.pick}</div>
                  <div className="text-xs text-[#666] truncate">{leg.event}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display text-2xl text-[#d4ff00]">{leg.odds}</span>
                  <button onClick={() => toggleLeg(leg)} className="text-[#444] hover:text-[#ff4444] text-xl leading-none transition-colors">×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Stake + payout */}
          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1.5">Stake ($)</label>
              <input
                type="number"
                value={stake}
                onChange={e => setStake(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d4ff00] transition-colors"
                placeholder="50"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Combined odds</div>
              <div className="font-display text-3xl text-[#d4ff00] leading-none">{multiOdds.toFixed(2)}×</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Potential return</div>
              <div className="font-display text-2xl text-white leading-none">${payout.toFixed(2)}</div>
            </div>
          </div>

          {posted ? (
            <div className="w-full py-3.5 rounded-xl bg-[#1c1c1c] text-[#22c55e] text-sm text-center font-medium">
              ✓ Multi posted to your punts!
            </div>
          ) : (
            <button
              onClick={postMulti}
              disabled={posting || !stakeNum}
              className="w-full py-3.5 rounded-xl bg-[#d4ff00] text-black font-display text-xl tracking-widest hover:opacity-90 transition-all disabled:opacity-40"
            >
              {posting ? 'POSTING…' : `POST MULTI →`}
            </button>
          )}
        </div>
      )}

      {/* ── SPORT FILTER TABS ── */}
      {sports.length > 2 && (
        <div className="flex gap-2 mb-4 mt-4 flex-wrap">
          {sports.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all ${
                filter === s
                  ? 'bg-white text-black border-white font-semibold'
                  : 'text-[#555] border-[#2a2a2a] hover:text-white hover:border-[#555]'
              }`}
            >
              {SPORT_EMOJI[s] ?? ''} {s}
            </button>
          ))}
        </div>
      )}

      {/* ── PICK CARDS ── */}
      <div className="space-y-3">
        {visible.map(pick => {
          const inMulti  = legs.some(l => l.id === pick.id)
          const kickoff  = formatKickoff(pick.commenceTime)
          return (
            <div
              key={pick.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                inMulti ? 'border-[#d4ff00] bg-[#141414]' : 'border-[#222] bg-[#141414] hover:border-[#333]'
              }`}
            >
              <div className="p-5">
                {/* Sport + time */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-widest">
                    {SPORT_EMOJI[pick.sport] ?? '🎯'} {pick.sport}
                  </span>
                  <span className="text-[#333]">·</span>
                  <span className="text-xs text-[#555]">{pick.market}</span>
                  {kickoff && <>
                    <span className="text-[#333]">·</span>
                    <span className="text-xs text-[#555]">🕐 {kickoff}</span>
                  </>}
                </div>

                {/* Event + pick + odds */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#666] mb-1 truncate">{pick.event}</div>
                    <div className="text-xl font-bold text-white leading-snug">{pick.pick}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Odds</div>
                    <div className="font-display text-4xl text-[#d4ff00] leading-none">{pick.odds}</div>
                  </div>
                </div>

                {/* Reasoning */}
                <p className="text-sm text-[#777] leading-relaxed mb-4 pl-3 border-l-2 border-[#2a2a2a]">
                  {pick.reasoning}
                </p>

                {/* Confidence + button */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">AI Confidence</div>
                    <ConfBar pct={pick.confidence} />
                  </div>
                  <button
                    onClick={() => toggleLeg(pick)}
                    className={`shrink-0 text-xs tracking-widest uppercase px-5 py-2.5 rounded-full border font-medium transition-all ${
                      inMulti
                        ? 'bg-[#d4ff00] text-black border-[#d4ff00]'
                        : 'text-[#888] border-[#333] hover:border-[#d4ff00] hover:text-[#d4ff00]'
                    }`}
                  >
                    {inMulti ? '✓ Added' : '+ Add leg'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {visible.length === 0 && !loading && (
        <div className="bg-[#141414] rounded-2xl border border-[#222] py-14 text-center">
          <div className="text-4xl mb-3">🕐</div>
          <p className="text-sm text-[#666]">No {filter !== 'All' ? filter : ''} games found for today.</p>
        </div>
      )}
    </div>
  )
}
