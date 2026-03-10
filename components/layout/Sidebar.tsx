'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',   label: 'Home',        icon: '🏠' },
  { href: '/punts',       label: 'My Punts',    icon: '🎯' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/profile',     label: 'Profile',     icon: '👤' },
]

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-[220px] min-h-screen border-r border-[#1e1e1e] flex-col sticky top-0 h-screen bg-[#0a0a0a]">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1e1e1e]">
          <div className="font-display text-[26px] tracking-widest leading-none text-white">
            PUNT<span className="text-[#d4ff00]">.</span>AI
          </div>
          <div className="text-[9px] tracking-[2px] uppercase text-[#444] mt-1">AI Betting</div>
        </div>

        {/* Balance */}
        <div className="px-6 py-4 border-b border-[#1e1e1e]">
          <div className="text-[9px] tracking-[2px] uppercase text-[#444] mb-1">Balance</div>
          <div className="font-display text-[28px] text-[#d4ff00] leading-none">
            ${(profile?.balance ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3 text-[13px] transition-all relative ${
                  active ? 'text-white bg-[#161616]' : 'text-[#555] hover:text-white hover:bg-[#161616]'
                }`}
              >
                {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#d4ff00] rounded-r" />}
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-[#1e1e1e] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#d4ff00] text-black font-display text-[13px] flex items-center justify-center rounded-full shrink-0">
              {profile?.avatar_initials ?? '??'}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-white truncate">{profile?.full_name ?? 'User'}</div>
              <div className="text-[9px] text-[#444] truncate">{profile?.tier ?? 'Bronze'}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full border border-[#1e1e1e] text-[#444] text-[9px] tracking-[2px] uppercase py-2 rounded-lg hover:border-[#ff4444] hover:text-[#ff4444] transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center justify-between px-5 h-14">
        <div className="font-display text-[22px] tracking-widest text-white leading-none">
          PUNT<span className="text-[#d4ff00]">.</span>AI
        </div>
        <div className="font-display text-[18px] text-[#d4ff00] leading-none">
          ${(profile?.balance ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#1e1e1e] flex safe-bottom">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all ${
                active ? 'text-[#d4ff00]' : 'text-[#444]'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[9px] tracking-wide uppercase">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
