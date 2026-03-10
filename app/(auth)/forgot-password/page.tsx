'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError('Enter your email address.')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-10 py-7 border-b border-[#2a2a2a] flex items-baseline gap-4">
        <span className="font-display text-[34px] tracking-widest leading-none">
          PUNT<span className="text-[#d4ff00]">.</span>AI
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-8 animate-fade-up">
        <div className="w-full max-w-md">
          {sent ? (
            <div className="text-center">
              <div className="font-display text-[#d4ff00] text-[80px] leading-none mb-6">✓</div>
              <h2 className="font-display text-[48px] tracking-wide mb-3">LINK SENT</h2>
              <p className="text-[#555] text-[13px] leading-relaxed">
                Check <span className="text-white">{email}</span> for your password reset link.
              </p>
              <Link href="/login" className="inline-block mt-10 text-[11px] tracking-[2px] uppercase text-[#d4ff00] hover:underline underline-offset-2">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-[52px] tracking-wide leading-none mb-2">RESET PASSWORD</h2>
              <p className="text-[11px] text-[#555] mb-10">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="text-[11px] text-[#ff2d2d] border border-[#ff2d2d] px-4 py-3">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[9px] tracking-[3px] uppercase text-[#555] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-white font-mono text-[13px] px-4 py-3 outline-none focus:border-[#d4ff00] transition-colors placeholder-[#555]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#d4ff00] text-black font-display text-[22px] tracking-[3px] py-4 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK →'}
                </button>
              </form>
              <p className="mt-8 text-[11px] text-[#555] text-center">
                <Link href="/login" className="text-[#d4ff00] hover:underline underline-offset-2">← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
