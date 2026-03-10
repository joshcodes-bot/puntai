'use client'

import { useState, useEffect } from 'react'

type Pick = {
  id: number
  event: string
  market: string
  pick: string
  odds: number
  confidence: number
  sport: string
  reasoning: string
}

export default function AIPicks() {
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchPicks(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/picks')
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setPicks(data.picks)
        setGeneratedAt(data.generatedAt)
      }
    } catch {
      setError('Could not load picks. Check your API key.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchPicks() }, [])

  if (loading) return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-[28px] tracking-wide">TODAY'S AI PICKS</h2>
        <span className="text-[9px] tracking-[2px] uppercase text-[#555] border border-[#2a2a2a] px-3 py-1 animate-pulse-lime">
          Generating...
        </span>
      </div>
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="border border-[#2a2a2a] p-5 animate-pulse">
            <div className="h-3 bg-[#2a2a2a] rounded w-1/3 mb-3" />
            <div className="h-5 bg-[#2a2a2a] rounded w-2/3 mb-2" />
            <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div>
      <h2 className="font-display text-[28px] tracking-wide mb-4">TODAY'S AI PICKS</h2>
      <div className="border border-[#ff2d2d] p-6 text-center">
        <div className="text-[#ff2d2d] text-[11px] tracking-wide mb-4">{error}</div>
        <button
          onClick={() => fetchPicks()}
          className="text-[10px] tracking-[2px] uppercase text-[#d4ff00] border border-[#d4ff00] px-4 py-2 hover:bg-[#d4ff00] hover:text-black transition-all"
        >
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-[28px] tracking-wide">TODAY'S AI PICKS</h2>
        <div className="flex items-center gap-3">
          <span className="text-[9px] tracking-[2px] uppercase text-[#555]">
            {generatedAt ? new Date(generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <button
            onClick={() => fetchPicks(true)}
            disabled={refreshing}
            className="text-[9px] tracking-[2px] uppercase text-[#555] border border-[#2a2a2a] px-3 py-1 hover:text-white hover:border-[#555] transition-all disabled:opacity-40"
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {picks.map((pick, i) => (
          <div
            key={pick.id}
            className="border border-[#2a2a2a] p-5 hover:bg-[#1c1c1c] transition-colors"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] tracking-[2px] uppercase text-[#555] border border-[#2a2a2a] px-2 py-0.5">{pick.sport}</span>
                  <span className="text-[9px] tracking-[1px] text-[#555]">{pick.market}</span>
                </div>
                <div className="text-[13px] text-[#888] mb-1">{pick.event}</div>
                <div className="font-display text-[24px] leading-none text-white">{pick.pick}</div>
                {pick.reasoning && (
                  <div className="text-[11px] text-[#555] mt-2 leading-relaxed">{pick.reasoning}</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] tracking-[2px] uppercase text-[#555] mb-1">Odds</div>
                <div className="font-display text-[32px] text-[#d4ff00] leading-none">{pick.odds}</div>
              </div>
            </div>
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
  )
}
