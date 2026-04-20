import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Nav from '@/components/Nav'
import Parallax from '@/components/Parallax'

export const metadata: Metadata = {
  title: 'BITFAUNA — 2-Bit On-Chain Pareidolia',
  description: '1111 on-chain, generative, 4-color pixel art compositions. 100% on Ethereum.',
  icons: { icon: '/favicon.webp' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Parallax />
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
