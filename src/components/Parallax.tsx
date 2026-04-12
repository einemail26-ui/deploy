'use client'
import { useEffect } from 'react'

export default function Parallax() {
  useEffect(() => {
    const COLOR_CFG: Record<string, { minOp: number; maxOp: number }> = {
      '#FFFFFF': { minOp: 0.06, maxOp: 0.20 },
      '#808080': { minOp: 0.08, maxOp: 0.18 },
      '#0000FF': { minOp: 0.55, maxOp: 0.88 },
    }
    const COLORS = [
      { hex: '#FFFFFF', weight: 52 },
      { hex: '#808080', weight: 38 },
      { hex: '#0000FF', weight: 10 },
    ]
    const LAYERS = [
      { id: 'layer-slow', count: 90,  sizes: [3,4,4,6],    speed: 0.12 },
      { id: 'layer-mid',  count: 70,  sizes: [4,6,8],      speed: 0.30 },
      { id: 'layer-fast', count: 45,  sizes: [8,10,12,16], speed: 0.55 },
    ]

    function weightedColor() {
      const total = COLORS.reduce((s, c) => s + c.weight, 0)
      let r = Math.random() * total
      for (const c of COLORS) { r -= c.weight; if (r <= 0) return c.hex }
      return COLORS[0].hex
    }
    function rnd(a: number, b: number) { return a + Math.random() * (b - a) }
    function pick(arr: number[]) { return arr[Math.floor(Math.random() * arr.length)] }

    LAYERS.forEach(cfg => {
      const el = document.getElementById(cfg.id)
      if (!el) return
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement('div')
        const sz  = pick(cfg.sizes)
        const col = weightedColor()
        const oc  = COLOR_CFG[col]
        const op  = rnd(oc.minOp, oc.maxOp)
        dot.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${col};left:${rnd(0,100)}%;top:${rnd(0,100)}%;opacity:${op.toFixed(3)};image-rendering:pixelated;`
        el.appendChild(dot)
      }
    })

    // Drift keyframes
    const driftCSS = document.createElement('style')
    let kf = ''
    for (let n = 0; n < 6; n++) {
      const dx = (Math.random() * 24 - 12).toFixed(1)
      const dy = (Math.random() * 28 - 14).toFixed(1)
      kf += `@keyframes drift-${n}{from{transform:translate(0,0)}to{transform:translate(${dx}px,${dy}px)}}`
    }
    driftCSS.textContent = kf
    document.head.appendChild(driftCSS)

    document.querySelectorAll('#parallax-bg div > div').forEach((dot, i) => {
      const dur = rnd(18, 55), del = rnd(0, dur)
      ;(dot as HTMLElement).style.animation = `drift-${i % 6} ${dur}s ${del}s ease-in-out infinite alternate`
    })

    // Scroll parallax
    let ticking = false
    function updateParallax() {
      const scrollY = window.scrollY
      LAYERS.forEach(cfg => {
        const el = document.getElementById(cfg.id)
        if (el) el.style.transform = `translateY(${-(scrollY * cfg.speed)}px)`
      })
      ticking = false
    }
    const handler = () => { if (!ticking) { requestAnimationFrame(updateParallax); ticking = true } }
    window.addEventListener('scroll', handler, { passive: true })
    updateParallax()

    return () => {
      window.removeEventListener('scroll', handler)
      driftCSS.remove()
    }
  }, [])

  return (
    <div id="parallax-bg">
      <div className="px-layer" id="layer-slow" />
      <div className="px-layer" id="layer-mid" />
      <div className="px-layer" id="layer-fast" />
    </div>
  )
}
