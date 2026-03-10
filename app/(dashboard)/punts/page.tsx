'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const FILTERS = ['all', 'pending', 'won', 'lost'] as const
type Filter = typeof FILTERS[number]

const RESULT_STYLE: Record<string, string> = {
  won:     'bg-[#22c55e20] text-[#22c55e]',
  lost:    'bg-[#ff444420] text-[#ff4444]',
  pending: 'bg-[#ffffff10] text-[#888]',
  void:    'bg-[#ffffff10] text-[#555]',
}

export default function PuntsPage() {
  const [punts, setPunts]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState<Filter>('all')
  const [form, setForm]         = useState({ event: '', pick: '', odds: '', stake: '', event_date: '' })

  const supabase = createClient()

  useEffect(() => { fetchPunts() }, [])

  async function fetchPunts() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('punts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setPunts(data ?? [])
    setLoading(false)
  }

  async function submitPunt(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const odds = parseFloat(form.odds), stake = parseFloat(form.stake)
    if (!form.event || !form.pick || !form.odds || !form.stake || !form.event_date) return setError('All fields required.')
    if (isNaN(odds) || odds <= 1) return setError('Odds must be greater than 1.')
    if (isNaN(stake) || stake <= 0) return setError('Stake must be positive.')
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: err } = await (supabase.from('punts') as any).insert({
      user_id: user.id, event: form.event, pick: form.pick,
      odds, stake, result: 'pending', payout: 0, event_date: form.event_date,
    })
    if (err) setError(err.message)
    else { setForm({ event: '', pick: '', odds: '', stake: '', event_date: '' }); setShowForm(false); await fetchPunts() }
    setSubmitting(false)
  }

  const filtered  = filter === 'all' ? punts : punts.filter(p => p.result === filter)
  const won       = punts.filter(p => p.result === 'won')
  const profit    = won.reduce((s: number, p: any) => s + p.payout, 0) - punts.reduce((s: number, p: any) => s + p.stake, 0)
  const winRate   = punts.filter(p => p.result !== 'pending' && p.result !== 'void').length
    ? Math.round(won.length / punts.filter(p => p.result !== 'pending' && p.result !== 'void').length * 100) : 0

  return (
    <div className="p-5 lg:p-8 max-w-[900px] mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl lg:text-5xl leading-none tracking-wide text-white">
            MY <span className="text-[#d4ff00]">PUNTS</span>
          </h1>
          <p className="text-xs text-[#555] mt-1">{punts.length} total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#d4ff00] text-black font-display text-base tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-all"
        >
          {showForm ? '✕ Cancel' : '+ New Punt'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {[
          { label: 'Total', value: punts.length },
          { label: 'Wins', value: won.length },
          { label: 'Win Rate', value: `${winRate}%` },
          { label: 'Profit', value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(0)}`, green: profit > 0, red: profit < 0 },
        ].map(({ label, value, green, red }: any) => (
          <div key={label} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3.5">
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">{label}</div>
            <div className={`font-display text-2xl leading-none ${green ? 'text-[#22c55e]' : red ? 'text-[#ff4444]' : 'text-white'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* New punt form */}
      {showForm && (
        <div className="bg-[#141414] border border-[#d4ff00] rounded-2xl p-5 mb-6 animate-fade-up">
          <h3 className="font-display text-xl text-white tracking-wide mb-5">LOG A PUNT</h3>
          <form onSubmit={submitPunt} className="space-y-3">
            {error && <div className="text-xs text-[#ff4444] border border-[#ff4444] px-4 py-3 rounded-xl">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Event</label>
                <input value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}
                  placeholder="e.g. Man City vs Arsenal"
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-[#d4ff00] transition-colors placeholder-[#444]" />
              </div>
              <div>
                <label className="block text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Your Pick</label>
                <input value={form.pick} onChange={e => setForm({ ...form, pick: e.target.value })}
                  placeholder="e.g. Man City"
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-[#d4ff00] transition-colors placeholder-[#444]" />
              </div>
              <div>
                <label className="block text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Odds</label>
                <input type="number" step="0.01" value={form.odds} onChange={e => setForm({ ...form, odds: e.target.value })}
                  placeholder="2.10"
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-[#d4ff00] transition-colors placeholder-[#444]" />
              </div>
              <div>
                <label className="block text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Stake ($)</label>
                <input type="number" step="0.01" value={form.stake} onChange={e => setForm({ ...form, stake: e.target.value })}
                  placeholder="50"
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-[#d4ff00] transition-colors placeholder-[#444]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Event Date</label>
                <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-[#d4ff00] transition-colors" />
              </div>
            </div>
            {form.odds && form.stake && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-sm text-[#666]">
                Potential return: <span className="text-[#d4ff00] font-display text-xl ml-2">
                  ${(parseFloat(form.odds || '0') * parseFloat(form.stake || '0')).toFixed(2)}
                </span>
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#d4ff00] text-black font-display text-xl tracking-widest py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
              {submitting ? 'LOGGING...' : 'LOG PUNT →'}
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all ${
              filter === f ? 'bg-white text-black border-white font-semibold' : 'text-[#555] border-[#222] hover:text-white hover:border-[#555]'
            }`}>
            {f} ({f === 'all' ? punts.length : punts.filter(p => p.result === f).length})
          </button>
        ))}
      </div>

      {/* Punt cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#141414] border border-[#222] rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-[#222] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[#222] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#222] rounded-2xl py-16 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-sm text-[#555]">No {filter !== 'all' ? filter : ''} punts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((punt: any) => (
            <div key={punt.id} className="bg-[#141414] border border-[#222] rounded-2xl p-4 hover:border-[#333] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">
                    {new Date(punt.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                  <div className="font-semibold text-white text-base leading-snug truncate">{punt.pick}</div>
                  <div className="text-sm text-[#666] truncate mt-0.5">{punt.event}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${RESULT_STYLE[punt.result] ?? ''}`}>
                    {punt.result}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e1e1e]">
                <div>
                  <div className="text-[9px] text-[#444] uppercase tracking-widest">Odds</div>
                  <div className="font-display text-lg text-white">{punt.odds}×</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#444] uppercase tracking-widest">Stake</div>
                  <div className="font-display text-lg text-white">${punt.stake}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#444] uppercase tracking-widest">Return</div>
                  <div className={`font-display text-lg ${punt.result === 'won' ? 'text-[#22c55e]' : 'text-[#444]'}`}>
                    {punt.result === 'won' ? `$${punt.payout}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
