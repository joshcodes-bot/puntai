'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName || !email || !password) return setError('All fields required.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true)

    const supabase = createClient()
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, avatar_initials: initials },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <div className="font-display text-[#d4ff00] text-[80px] leading-none mb-6">✓</div>
      <h2 className="font-display text-[48px] tracking-wide mb-3">CHECK YOUR EMAIL</h2>
      <p className="text-[#555] text-[13px] max-w-sm leading-relaxed">
        We've sent a confirmation link to <span className="text-white">{email}</span>. Click it to activate your account.
      </p>
      <Link href="/login" className="mt-10 text-[11px] tracking-[2px] uppercase text-[#d4ff00] hover:underline underline-offset-2">
        Back to Login
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-10 py-7 border-b border-[#2a2a2a] flex items-baseline gap-4">
        <span className="font-display text-[34px] tracking-widest leading-none">
          PUNT<span className="text-[#d4ff00]">.</span>AI
        </span>
        <span className="text-[10px] tracking-[3px] uppercase text-[#555]">AI Betting Platform</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Hero side */}
        <div className="hidden lg:flex flex-col justify-center flex-1 px-16 py-20 border-r border-[#2a2a2a] relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
          <h1 className="font-display text-[clamp(80px,10vw,128px)] leading-[0.88] tracking-tight relative z-10 animate-fade-up">
            JOIN<br />THE<br /><span className="text-[#d4ff00]">SHARP</span><br />SIDE
          </h1>
          <p className="mt-8 text-sm text-[#555] leading-relaxed max-w-sm relative z-10 animate-fade-up-1">
            Free to join. AI picks from day one. No fluff, no noise — just data-driven edges on every market.
          </p>
          <div className="mt-10 relative z-10 animate-fade-up-2 space-y-3">
            {['AI-powered predictions across all major sports', 'Full betting history & P&L tracking', 'Compete on the global leaderboard'].map(f => (
              <div key={f} className="flex items-center gap-3 text-[12px] text-[#888]">
                <span className="text-[#d4ff00] text-[16px] font-display">→</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Form side */}
        <div className="w-full lg:w-[460px] flex flex-col justify-center px-12 py-16 animate-fade-up-1">
          <div className="flex border border-[#2a2a2a] mb-10">
            <Link href="/login" className="flex-1 py-3 text-[#555] text-[11px] tracking-[2px] uppercase text-center hover:text-white transition-colors">Login</Link>
            <span className="flex-1 py-3 bg-[#d4ff00] text-black text-[11px] tracking-[2px] uppercase font-medium text-center">Register</span>
          </div>

          <h2 className="font-display text-[52px] tracking-wide leading-none mb-1">JOIN NOW</h2>
          <p className="text-[11px] text-[#555] mb-8">Create your free PUNT.AI account</p>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="text-[11px] text-[#ff2d2d] border border-[#ff2d2d] px-4 py-3 bg-[#ff2d2d08]">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Alex Turner"
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4ff00] text-black font-display text-[22px] tracking-[3px] py-4 hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <p className="mt-8 text-[11px] text-[#555] text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-[#d4ff00] hover:underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
