'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types/database'

const NAV = [
  { href: '/dashboard',    label: 'DASHBOARD',    icon: '◈' },
  { href: '/punts',        label: 'MY PUNTS',     icon: '◎' },
  { href: '/leaderboard',  label: 'LEADERBOARD',  icon: '◆' },
  { href: '/profile',      label: 'PROFILE',      icon: '◉' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[220px] min-h-screen border-r border-[#2a2a2a] flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#2a2a2a]">
        <div className="font-display text-[28px] tracking-widest leading-none">
          PUNT<span className="text-[#d4ff00]">.</span>AI
        </div>
        <div className="text-[9px] tracking-[2px] uppercase text-[#555] mt-1">AI Betting Platform</div>
      </div>

      {/* Balance */}
      <div className="px-6 py-5 border-b border-[#2a2a2a] bg-[#1c1c1c]">
        <div className="text-[9px] tracking-[2px] uppercase text-[#555] mb-1">Balance</div>
        <div className="font-display text-[32px] text-[#d4ff00] leading-none">
          ${(profile?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-[11px] tracking-[2px] uppercase transition-all relative group ${
                active
                  ? 'text-white bg-[#1c1c1c]'
                  : 'text-[#555] hover:text-white hover:bg-[#1c1c1c]'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d4ff00]" />
              )}
              <span className={active ? 'text-[#d4ff00]' : 'text-[#333] group-hover:text-[#555]'}>
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="border-t border-[#2a2a2a] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#d4ff00] text-black font-display text-[14px] flex items-center justify-center flex-shrink-0">
            {profile?.avatar_initials ?? '??'}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-white truncate">{profile?.full_name ?? 'User'}</div>
            <div className="text-[9px] text-[#555] truncate">{profile?.tier ?? 'Bronze'} Member</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full border border-[#2a2a2a] text-[#555] text-[9px] tracking-[2px] uppercase py-2 hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-all"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
