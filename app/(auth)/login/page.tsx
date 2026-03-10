'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('All fields required.')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
            BET<br />SMART<br /><span className="text-[#d4ff00]">WIN</span><br />MORE
          </h1>
          <p className="mt-8 text-sm text-[#555] leading-relaxed max-w-sm relative z-10 animate-fade-up-1">
            Real-time AI predictions, live odds tracking, and full account management — built for serious bettors.
          </p>
          <div className="flex mt-14 relative z-10 animate-fade-up-2">
            {[['94%', 'Accuracy'], ['12K', 'Users'], ['$4.2M', 'Paid Out']].map(([val, lbl]) => (
              <div key={lbl} className="flex-1 px-6 py-5 border border-[#2a2a2a] bg-[#080808]">
                <div className="font-display text-[40px] text-[#d4ff00] leading-none">{val}</div>
                <div className="text-[9px] tracking-[2.5px] uppercase text-[#555] mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form side */}
        <div className="w-full lg:w-[460px] flex flex-col justify-center px-12 py-16 animate-fade-up-1">
          {/* Mode tabs */}
          <div className="flex border border-[#2a2a2a] mb-10">
            <span className="flex-1 py-3 bg-[#d4ff00] text-black text-[11px] tracking-[2px] uppercase font-medium text-center">Login</span>
            <Link href="/signup" className="flex-1 py-3 text-[#555] text-[11px] tracking-[2px] uppercase text-center hover:text-white transition-colors">Register</Link>
          </div>

          <h2 className="font-display text-[52px] tracking-wide leading-none mb-1">SIGN IN</h2>
          <p className="text-[11px] text-[#555] mb-8">Access your PUNT.AI account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-[11px] text-[#ff2d2d] border border-[#ff2d2d] px-4 py-3 bg-[#ff2d2d08]">
                {error}
              </div>
            )}
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
                placeholder="••••••••"
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[10px] text-[#555] hover:text-[#d4ff00] transition-colors tracking-wider">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4ff00] text-black font-display text-[22px] tracking-[3px] py-4 hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>

          <p className="mt-8 text-[11px] text-[#555] text-center">
            No account?{' '}
            <Link href="/signup" className="text-[#d4ff00] hover:underline underline-offset-2">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
