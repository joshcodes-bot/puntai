import type { Metadata } from 'next'
import { Bebas_Neue, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-mono',
})

export const metadata: Metadata = {
  title: 'PUNT.AI — AI Betting Platform',
  description: 'AI-powered predictions for serious bettors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${ibmPlexMono.variable} bg-black text-white font-mono`}>
        {children}
      </body>
    </html>
  )
}
