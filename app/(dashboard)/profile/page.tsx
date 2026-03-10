'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
     if (data) {
        setProfile(data)
        setFullName((data as any).full_name ?? '')
      }
      setEmail(user.email ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) return setError('Name is required.')
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    const { error: err } = await (supabase
      .from('profiles') as any)
      .update({ full_name: fullName, avatar_initials: initials, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (err) setError(err.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-[11px] tracking-[3px] uppercase text-[#555]">Loading...</div>
    </div>
  )

  const initials = profile?.avatar_initials ?? fullName.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="p-10 max-w-[900px] mx-auto animate-fade-up">
      <div className="mb-10">
        <h1 className="font-display text-[64px] leading-none tracking-wide">
          YOUR <span className="text-[#d4ff00]">PROFILE</span>
        </h1>
        <p className="text-[11px] text-[#555] mt-2">Account details and settings</p>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-0 border border-[#2a2a2a]">
        <div className="p-8 border-r border-[#2a2a2a] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#d4ff00] text-black font-display text-[28px] flex items-center justify-center mb-5">
            {initials}
          </div>
          <div className="font-display text-[28px] tracking-wide leading-none">{profile?.full_name ?? 'User'}</div>
          <div className="text-[11px] text-[#555] mt-1.5">{email}</div>
          <div className="mt-4 border border-[#d4ff00] text-[#d4ff00] text-[9px] tracking-[3px] uppercase px-3 py-1">
            {profile?.tier ?? 'Bronze'} Member
          </div>
          <div className="text-[10px] text-[#555] mt-3">
            Since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}
          </div>
          <div className="w-full mt-8 space-y-3">
            {[
              { label: 'Account ID', value: profile?.id?.slice(0, 8).toUpperCase() ?? '—' },
              { label: 'Balance', value: `$${(profile?.balance ?? 0).toFixed(2)}`, lime: true },
            ].map(({ label, value, lime }) => (
              <div key={label} className="flex justify-between items-center py-2 border-t border-[#2a2a2a]">
                <span className="text-[9px] tracking-[2px] uppercase text-[#555]">{label}</span>
                <span className={`text-[12px] ${lime ? 'text-[#d4ff00] font-display text-[16px]' : 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <h2 className="font-display text-[28px] tracking-wide mb-6">EDIT DETAILS</h2>
          <form onSubmit={saveProfile} className="space-y-5">
            {error && <div className="text-[11px] text-[#ff2d2d] border border-[#ff2d2d] px-4 py-3">{error}</div>}
            {saved && <div className="text-[11px] text-[#d4ff00] border border-[#d4ff00] px-4 py-3">✓ Profile updated</div>}
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Email Address</label>
              <input
                value={email}
                disabled
                className="w-full bg-[#111] border border-[#2a2a2a] text-[#555] font-mono text-[13px] px-4 py-3 outline-none cursor-not-allowed"
              />
              <p className="text-[9px] text-[#555] mt-1.5 tracking-wide">Email cannot be changed here.</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Membership Tier</label>
              <div className="bg-[#111] border border-[#2a2a2a] px-4 py-3 text-[#555] font-mono text-[13px]">
                {profile?.tier ?? 'Bronze'} — upgrades unlock automatically based on activity
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#d4ff00] text-black font-display text-[20px] tracking-[2px] px-8 py-3 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES →'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#2a2a2a]">
            <h3 className="font-display text-[20px] tracking-wide text-[#ff2d2d] mb-4">DANGER ZONE</h3>
            <div className="border border-[#ff2d2d20] p-4 flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white mb-0.5">Delete Account</div>
                <div className="text-[10px] text-[#555]">Permanently remove your account and all data.</div>
              </div>
              <button className="border border-[#ff2d2d] text-[#ff2d2d] text-[10px] tracking-[2px] uppercase px-4 py-2 hover:bg-[#ff2d2d] hover:text-white transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
