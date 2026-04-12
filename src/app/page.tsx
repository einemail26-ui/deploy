import Gallery from '@/components/Gallery'
import Ticker from '@/components/Ticker'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <ScrollReveal />
      <div className="page-wrap">

        {/* HERO */}
        <div className="row-full" id="hero">
          <div className="hero-wrap">
            <span className="hero-supertag">2-Bit On-Chain Pareidolia</span>
            <h1 className="hero-title">BITFAUNA</h1>
            <p className="hero-body-text">
              1111 on-chain, generative, 4-color pixel art compositions.<br />
              Every piece encoded entirely in the contract.<br />
              No IPFS. No servers. Pure bitmap logic on Ethereum forever.
            </p>
            <div className="hero-actions">
              <Link href="/canvas" className="btn btn-blue">[Open Canvas →]</Link>
              <a href="https://opensea.io" target="_blank" rel="noopener" className="btn">[View on OpenSea]</a>
            </div>
          </div>
        </div>

        {/* STAT STRIP */}
        <div className="row-full">
          <div className="stat-strip">
            <div className="stat-item"><span className="stat-n">1,111</span><span className="stat-l">Supply</span></div>
            <div className="stat-item"><span className="stat-n">400</span><span className="stat-l">Bytes</span></div>
            <div className="stat-item"><span className="stat-n">2-bit</span><span className="stat-l">Depth</span></div>
            <div className="stat-item"><span className="stat-n">100%</span><span className="stat-l">On-Chain</span></div>
          </div>
        </div>

        {/* GALLERY SECTION BAR */}
        <div className="row-full rv">
          <div className="section-bar">
            <span className="section-bar-num">00</span>
            <span className="section-bar-title">Example Collection</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">1,111 Unique Pieces</span>
          </div>
        </div>

        {/* GALLERY */}
        <Gallery />

        {/* SECTION BAR 02 */}
        <div className="row-full rv" id="architecture">
          <div className="section-bar">
            <span className="section-bar-num">02</span>
            <span className="section-bar-title">Technical Architecture</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">The Numbers</span>
          </div>
        </div>

        {/* TILE: 400 bytes */}
        <div className="tile-row left rv">
          <div className="tile tile-center">
            <span className="t-label">Storage</span>
            <div className="t-num">400<span className="t-unit">bytes</span></div>
            <span className="t-sub">Per Bitfauna</span>
            <p className="t-body">Pixel data compressed into 400 bytes, stored via SSTORE2. Each 2-bit pixel pair encodes two pixels in a single byte — maximum density, minimum gas.</p>
            <span className="t-tag">SSTORE2</span>
          </div>
          <div className="tile-gap" />
        </div>

        {/* TILE: 1,600 px */}
        <div className="tile-row right rv">
          <div className="tile tile-center">
            <span className="t-label">Canvas</span>
            <div className="t-num">1,600<span className="t-unit">px</span></div>
            <span className="t-sub">Per Canvas</span>
            <p className="t-body">A 40×40 grid where 2 bits represent one pixel. Four possible values: White, Gray, Blue, Black. Every composition unique by seed.</p>
            <span className="t-tag">40 × 40</span>
          </div>
          <div className="tile-gap" />
        </div>

        {/* TILE: Palette */}
        <div className="tile-row left rv">
          <div className="tile tile-center">
            <span className="t-label">Palette</span>
            <div style={{display:'flex',gap:10,justifyContent:'center',margin:'8px 0'}}>
              <div style={{width:32,height:32,background:'#fff',border:'1px solid #3a3a3a'}} />
              <div style={{width:32,height:32,background:'#808080',border:'1px solid #3a3a3a'}} />
              <div style={{width:32,height:32,background:'#0000FF',border:'1px solid #3a3a3a'}} />
              <div style={{width:32,height:32,background:'#000',border:'1px solid #3a3a3a'}} />
            </div>
            <span className="t-sub">White · Gray · Blue · Black</span>
            <p className="t-body">Four shades. Two bits. Blue is the rarest — the Spark that defines each composition&apos;s soul.</p>
            <span className="t-tag">2-BIT</span>
          </div>
          <div className="tile-gap" />
        </div>

        {/* TILE: 100% on-chain */}
        <div className="tile-row right rv">
          <div className="tile tile-center">
            <span className="t-label">Provenance</span>
            <div className="t-num">100<span className="t-unit">%</span></div>
            <span className="t-sub">On-Chain</span>
            <p className="t-body">SVGs generated fully on-chain. Metadata, traits, and artwork live entirely in the contract. Zero external dependencies. Permanent.</p>
            <span className="t-tag">ERC-721</span>
          </div>
          <div className="tile-gap" />
        </div>

        {/* TICKER */}
        <div className="row-full">
          <Ticker />
        </div>

        {/* NORMIES VS BITFAUNA */}
        <div className="row-full rv">
          <div className="compare-wrap">
            <span className="compare-label">Context</span>
            <h3 className="compare-title">Normies &amp; Bitfauna</h3>
            <div className="compare-body">
              <p>Normies and Bitfauna share the same groundbreaking on-chain pixel art technology — the 40×40 bitmaps fully stored in the smart contract, canvas editor, and burn-to-edit mechanics with Action Points. Yet they pursue distinctly different goals. Think of Normies as the big brother of the Bitfauna NFTs: the pioneering collection that laid the technological foundation upon which Bitfauna was built.</p>
              <p>Normies, with its 10,000 monochrome human portraits, is the classic, highly scalable PFP collection: instantly recognizable faces, strong community, and perfectly suited as profile pictures.</p>
              <p>Bitfauna, in contrast, limits itself to only 1,111 pieces and deliberately shifts the focus away from PFP toward pure art: the pareidolia effect in its pixel art takes center stage, the underlying technology behind Normies is taken further, and the smaller, more exclusive collection invites deeper interaction with the canvas and the pixel art itself.</p>
            </div>
            <a href="https://normies.art" target="_blank" rel="noopener" style={{display:'inline-block',marginTop:28,fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--dim)',border:'var(--b)',padding:'9px 18px'}}>
              [Explore Normies on normies.art]
            </a>
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="row-full">
          <div className="footer-cta-wrap">
            <div className="footer-cta-text">1,111 visions.<br /><em>Zero servers.</em></div>
            <a href="https://opensea.io" target="_blank" rel="noopener" className="btn btn-blue" style={{fontSize:13,padding:'12px 40px'}}>[View on OpenSea →]</a>
          </div>
        </div>

        {/* CREDIT */}
        <div className="row-full" style={{borderBottom:'none'}}>
          <div className="footer-credit">
            BITFAUNA — Created by{' '}
            <a href="https://x.com/leonardoxbt" target="_blank" rel="noopener" style={{color:'var(--w)',textDecoration:'underline',textUnderlineOffset:3}}>Kali</a>
            {' '}and{' '}
            <a href="https://x.com/xbtphil" target="_blank" rel="noopener" style={{color:'var(--w)',textDecoration:'underline',textUnderlineOffset:3}}>DoPhil</a>
            {' '}with Technology and inspiration from{' '}
            <a href="https://x.com/YigitDuman" target="_blank" rel="noopener" style={{color:'var(--w)',textDecoration:'underline',textUnderlineOffset:3}}>yigit</a>
            {' '}and{' '}
            <a href="https://x.com/serc1n" target="_blank" rel="noopener" style={{color:'var(--w)',textDecoration:'underline',textUnderlineOffset:3}}>serc</a>
          </div>
          <div className="footer-legal">
            <a href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_BITFAUNA_ADDRESS ?? ''}`} target="_blank" rel="noopener">[Contract]</a>
            <a href="#terms">[Terms of Use]</a>
          </div>
        </div>

      </div>
    </>
  )
}
