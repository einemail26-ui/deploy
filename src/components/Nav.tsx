'use client'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Nav() {
  const { isConnected } = useAccount()

  return (
    <header>
      <div className="hdr">
        <Link href="/" className="hdr-logo">BITFAUNA</Link>
        <Link href="/canvas" className="hdr-btn" style={{ borderLeft: 'var(--b)', borderRight: 'none' }}>
          [Canvas]
        </Link>
        <div style={{ marginLeft: 'auto', borderLeft: 'var(--b)', display: 'flex', alignItems: 'stretch' }}>
          <ConnectButton.Custom>
            {({ account, openAccountModal, openConnectModal, mounted }) => {
              if (!mounted) return null
              if (!account) return (
                <button
                  onClick={openConnectModal}
                  className="hdr-btn"
                  style={{ border: 'none', color: 'var(--w)' }}
                >
                  <span className="w-dot" style={{ marginRight: 6 }} />
                  [Connect Wallet]
                </button>
              )
              return (
                <button
                  onClick={openAccountModal}
                  className="hdr-btn connected"
                  style={{ border: 'none' }}
                >
                  <span className="w-dot live" style={{ marginRight: 6 }} />
                  {account.displayName}
                </button>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
