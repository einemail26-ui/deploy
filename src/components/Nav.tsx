'use client'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Nav() {
  return (
    <header>
      <div className="hdr">
        <Link href="/" className="hdr-logo">BITFAUNA</Link>
        <nav className="hdr-nav">
          <Link href="/">Home</Link>
          <Link href="#concept">Docs</Link>
          <Link href="/canvas">Canvas</Link>
          <Link href="#rarity">Rarity</Link>
        </nav>
        <div className="hdr-right">
          <Link href="/canvas" className="hdr-btn">[Canvas]</Link>
          <a href="https://x.com" target="_blank" rel="noopener" className="hdr-btn" style={{width:48,fontSize:14,fontWeight:400,letterSpacing:0}}>𝕏</a>
          <a href="https://opensea.io" target="_blank" rel="noopener" className="hdr-btn">OpenSea</a>
          <div className="hdr-btn" style={{padding:'0 12px'}}>
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                if (!mounted) return <span style={{color:'var(--dim)'}}>Connect</span>
                if (!account) return (
                  <button onClick={openConnectModal} style={{background:'none',border:'none',color:'var(--dim)',fontFamily:'var(--font)',fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <span className="w-dot" />
                    [Connect Wallet]
                  </button>
                )
                return (
                  <button onClick={openAccountModal} style={{background:'none',border:'none',color:'var(--blue)',fontFamily:'var(--font)',fontSize:11,fontWeight:700,letterSpacing:'0.06em',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <span className="w-dot live" />
                    {account.displayName}
                  </button>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  )
}
