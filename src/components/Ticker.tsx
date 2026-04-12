'use client'
import { useEffect, useRef } from 'react'

const ITEMS = [
  'BITFAUNA','1111 EDITIONS','40x40 GRID','2-BIT PALETTE',
  'WHITE - GRAY - BLUE - BLACK','100% ON-CHAIN','400 BYTES',
  'PAREIDOLIA ENGINE','ZERO SERVERS','SSTORE2','ERC-721','FIND YOUR FAUNA'
]

export default function Ticker() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    ;[...ITEMS, ...ITEMS].forEach(t => {
      const s = document.createElement('span')
      s.className = 'ticker-item'
      s.innerHTML = `<span class="dot">*</span>${t}`
      track.appendChild(s)
    })
  }, [])

  return (
    <div className="ticker-wrap">
      <div className="ticker-track" ref={trackRef} />
    </div>
  )
}
