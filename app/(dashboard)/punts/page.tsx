'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Punt } from '@/types/database'

const RESULT_STYLES: Record<string, string> = {
  won:     'bg-[#d4ff00] text-black',
  lost:    'bg-[#2a2a2a] text-[#555]',
  pending: 'border border-[#555] text-[#555]',
  void:    'bg-[#2a2a2a] text-[#555]',
}

export default function PuntsPage() {
  const [punts, setPunts] = useState<Punt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

  const [form, setForm] = useState({
    event: '', pick: '', odds: '', stake: '', event_date: '',
  })

  const supabase = createClient()

  useEffect(() => { fetchPunts() }, [])

  async function fetchPunts() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('punts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setPunts((data ?? []) as Punt[])
    setLoading(false)
  }

  async function submitPunt(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.event || !form.pick || !form.odds || !form.stake || !form.event_date) {
      return setError('All fields required.')
    }
    const odds = parseFloat(form.odds)
    const stake = parseFloat(form.stake)
    if (isNaN(odds) || odds <= 1) return setError('Odds must be greater than 1.')
    if (isNaN(stake) || stake <= 0) return setError('Stake must be positive.')

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await (supabase.from('punts') as any).insert({
      user_id: user.id,
      event: form.event,
      pick: form.pick,
      odds,
      stake,
      event_date: form.event_date,
      result: 'pending',
      payout: 0,
    })

    if (err) {
      setError(err.message)
    } else {
      setForm({ event: '', pick: '', odds: '', stake: '', event_date: '' })
      setShowForm(false)
      await fetchPunts()
    }
    setSubmitting(false)
  }

  const filtered = filter === 'all' ? punts : punts.filter(p => p.result === filter)
  const won = punts.filter(p => p.result === 'won')
  const totalStaked = punts.reduce((s, p) => s + p.stake, 0)
  const totalPayout = won.reduce((s, p) => s + p.payout, 0)
  const profit = totalPayout - totalStaked

  return (
    <div className="p-10 max-w-[1000px] mx-auto animate-fade-up">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-[64px] leading-none tracking-wide">
            MY <span className="text-[#d4ff00]">PUNTS</span>
          </h1>
          <p className="text-[11px] text-[#555] mt-2">{punts.length} total · track your bets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#d4ff00] text-black font-display text-[18px] tracking-[2px] px-6 py-3 hover:opacity-90 transition-all"
        >
          {showForm ? '✕ CANCEL' : '+ NEW PUNT'}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 border border-[#2a2a2a] mb-8">
        {[
          { label: 'Total Punts', value: punts.length },
          { label: 'Wins', value: won.length },
          { label: 'Win Rate', value: punts.length ? `${Math.round((won.length / punts.length) * 100)}%` : '—' },
          { label: 'Net Profit', value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, lime: profit > 0, red: profit < 0 },
        ].map(({ label, value, lime, red }) => (
          <div key={label} className="px-5 py-5 border-r border-[#2a2a2a] last:border-r-0">
            <div className="text-[9px] tracking-[3px] uppercase text-[#555] mb-2">{label}</div>
            <div className={`font-display text-[36px] leading-none ${lime ? 'text-[#d4ff00]' : red ? 'text-[#ff2d2d]' : 'text-white'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* New punt form */}
      {showForm && (
        <div className="border border-[#d4ff00] p-6 mb-8 animate-fade-up">
          <h3 className="font-display text-[24px] tracking-wide mb-6">LOG A PUNT</h3>
          <form onSubmit={submitPunt}>
            {error && <div className="text-[11px] text-[#ff2d2d] border border-[#ff2d2d] px-4 py-3 mb-4">{error}</div>}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Event</label>
                <input
                  value={form.event}
                  onChange={e => setForm({ ...form, event: e.target.value })}
                  placeholder="e.g. Man City vs Arsenal"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Your Pick</label>
                <input
                  value={form.pick}
                  onChange={e => setForm({ ...form, pick: e.target.value })}
                  placeholder="e.g. Man City"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Odds (decimal)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.odds}
                  onChange={e => setForm({ ...form, odds: e.target.value })}
                  placeholder="e.g. 2.10"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Stake ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.stake}
                  onChange={e => setForm({ ...form, stake: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Event Date</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm({ ...form, event_date: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors"
                />
              </div>
            </div>
            {form.odds && form.stake && (
              <div className="mb-4 px-4 py-3 bg-[#1c1c1c] border border-[#2a2a2a] text-[12px] text-[#888]">
                Potential payout: <span className="text-[#d4ff00] font-display text-[18px]">
                  ${(parseFloat(form.odds || '0') * parseFloat(form.stake || '0')).toFixed(2)}
                </span>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#d4ff00] text-black font-display text-[20px] tracking-[2px] px-8 py-3 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'LOGGING...' : 'LOG PUNT →'}
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border border-[#2a2a2a] mb-4">
        {(['all', 'pending', 'won', 'lost'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 text-[10px] tracking-[2px] uppercase transition-all ${
              filter === f ? 'bg-[#1c1c1c] text-white' : 'text-[#555] hover:text-white'
            }`}
          >
            {f} {f === 'all' ? `(${punts.length})` : `(${punts.filter(p => p.result === f).length})`}
          </button>
        ))}
      </div>

      {/* Punts table */}
      {loading ? (
        <div className="text-center py-20 text-[#555] text-[11px] tracking-[2px] uppercase">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#2a2a2a] py-16 text-center">
          <div className="font-display text-[48px] text-[#2a2a2a] leading-none mb-3">◎</div>
          <div className="text-[11px] text-[#555] tracking-wide">No punts found.</div>
        </div>
      ) : (
        <table className="w-full border-collapse border border-[#2a2a2a]">
          <thead>
            <tr>
              {['Date', 'Event', 'Pick', 'Odds', 'Stake', 'Status', 'Payout'].map(h => (
                <th key={h} className="text-left text-[9px] tracking-[2.5px] uppercase text-[#555] px-4 py-3 border-b border-[#2a2a2a] bg-[#1c1c1c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(punt => (
              <tr key={punt.id} className="hover:bg-[#1c1c1c] transition-colors group">
                <td className="px-4 py-4 text-[10px] text-[#555] border-b border-[#2a2a2a]">
                  {new Date(punt.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-4 text-[12px] border-b border-[#2a2a2a] max-w-[200px] truncate">{punt.event}</td>
                <td className="px-4 py-4 text-[12px] font-medium border-b border-[#2a2a2a]">{punt.pick}</td>
                <td className="px-4 py-4 text-[13px] text-[#888] border-b border-[#2a2a2a]">{punt.odds}×</td>
                <td className="px-4 py-4 text-[12px] border-b border-[#2a2a2a]">${punt.stake}</td>
                <td className="px-4 py-4 border-b border-[#2a2a2a]">
                  <span className={`text-[9px] tracking-[1.5px] uppercase px-2 py-1 ${RESULT_STYLES[punt.result] ?? ''}`}>
                    {punt.result}
                  </span>
                </td>
                <td className={`px-4 py-4 text-[13px] border-b border-[#2a2a2a] font-display ${punt.result === 'won' ? 'text-[#d4ff00]' : 'text-[#555]'}`}>
                  {punt.result === 'won' ? `$${punt.payout}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
