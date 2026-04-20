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

        {/* SECTION BAR 01 */}
        <div className="row-full rv" id="project">
          <div className="section-bar">
            <span className="section-bar-num">01</span>
            <span className="section-bar-title">The BitFauna Project</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">1,111 Digital Primordial Forms</span>
          </div>
        </div>

        {/* PROJECT INTRO */}
        <div className="row-full rv">
          <div className="compare-wrap" style={{maxWidth:720}}>
            <p className="t-body" style={{fontSize:14,lineHeight:1.8,color:'var(--w)'}}>
              Bitfauna is a technological statement against dependence on off-chain infrastructure. While most NFT projects are merely pointers to external servers (IPFS/Arweave), Bitfauna is self-contained. No API, no gateway, no dependencies — just pure code.
            </p>

            <p className="t-body" style={{fontSize:13,lineHeight:1.8,color:'var(--w)',marginTop:24,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>The Collection</p>
            <p className="t-body" style={{fontSize:14,lineHeight:1.8,color:'var(--w)'}}>
              The genesis collection consists of 1,111 unique, monochromatic canvases. These serve as a digital &quot;primordial soup&quot; from which the community carves new forms. The distribution of base colors is algorithmically determined: White / Black / Gray / Blue — each Bitfauna starts in one of these four colors from the on-chain palette.
            </p>

            <p className="t-body" style={{fontSize:13,lineHeight:1.8,color:'var(--w)',marginTop:24,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>On-Chain Traits</p>
            <p className="t-body" style={{fontSize:14,lineHeight:1.8,color:'var(--w)'}}>
              Each NFT carries four essential traits stored directly within the smart contract and interpreted by the renderer:
            </p>
            <ul style={{margin:'10px 0 0 0',padding:'0 0 0 18px',listStyle:'disc',color:'var(--w)',fontSize:14,lineHeight:2}}>
              <li><strong style={{color:'var(--w)'}}>Color:</strong> The base color of the organism.</li>
              <li><strong style={{color:'var(--w)'}}>Pixelcount:</strong> The density of matter (ranging from 300 to 1,000 pixels).</li>
              <li><strong style={{color:'var(--w)'}}>Action Points (AP):</strong> The energy level, increased by &quot;sacrificing&quot; (burning) other Bitfauna.</li>
              <li><strong style={{color:'var(--w)'}}>Edited:</strong> A binary status indicating whether the organism has already been transformed by human or artificial intelligence.</li>
            </ul>

            <p className="t-body" style={{fontSize:13,lineHeight:1.8,color:'var(--w)',marginTop:24,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>What Makes Bitfauna Unique</p>
            <p className="t-body" style={{fontSize:14,lineHeight:1.8,color:'var(--w)'}}>
              Unlike conventional projects, Bitfauna utilizes highly efficient 400-byte binary encoding. Each of the 1,600 pixels (40×40) is defined by 2 bits, allowing for shading and depth while keeping the data footprint minimal. Bitfauna is not a passive image — it is an on-chain tool.
            </p>
          </div>
        </div>

        {/* SECTION BAR 02 */}
        <div className="row-full rv" id="architecture">
          <div className="section-bar">
            <span className="section-bar-num">02</span>
            <span className="section-bar-title">Technical Architecture</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">The Pure Chain Approach</span>
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

        {/* TILE: Binary Encoding */}
        <div className="tile-row right rv">
          <div className="tile tile-center">
            <span className="t-label">Binary Encoding</span>
            <div className="t-num" style={{fontSize:28}}>2<span className="t-unit">bits/px</span></div>
            <span className="t-sub">Four Colors. Four Values.</span>
            <p className="t-body">Each pixel is stored as a 2-bit integer — four possible values. Four pixels fit in a single byte. The entire 40×40 canvas compresses to exactly 400 bytes of raw on-chain binary, written permanently via SSTORE2.</p>

            {/* Color index table */}
            <div style={{display:'grid',gridTemplateColumns:'auto auto auto auto',gap:'6px 18px',margin:'18px auto',maxWidth:280,textAlign:'left',fontSize:11}}>
              <span style={{color:'var(--w)',fontWeight:700,fontSize:9,letterSpacing:'0.1em',borderBottom:'1px solid #333',paddingBottom:4}}>BITS</span>
              <span style={{color:'var(--w)',fontWeight:700,fontSize:9,letterSpacing:'0.1em',borderBottom:'1px solid #333',paddingBottom:4}}>INDEX</span>
              <span style={{color:'var(--w)',fontWeight:700,fontSize:9,letterSpacing:'0.1em',borderBottom:'1px solid #333',paddingBottom:4}}>COLOR</span>
              <span style={{color:'var(--w)',fontWeight:700,fontSize:9,letterSpacing:'0.1em',borderBottom:'1px solid #333',paddingBottom:4}}>HEX</span>
              {([['00','0','White','#FFFFFF'],['01','1','Black','#000000'],['10','2','Gray','#808080'],['11','3','Blue','#0000FF']] as const).map(([bits,idx,name,hex])=>(
                [
                  <code key={bits+'b'} style={{color:'#4fc3f7',fontFamily:'monospace',letterSpacing:'0.1em'}}>{bits}</code>,
                  <span key={bits+'i'} style={{color:'var(--w)'}}>{idx}</span>,
                  <span key={bits+'n'} style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{width:10,height:10,background:hex,border:'1px solid #555',display:'inline-block',flexShrink:0,verticalAlign:'middle'}}/>
                    <span style={{color:'var(--w)'}}>{name}</span>
                  </span>,
                  <code key={bits+'h'} style={{color:'#888',fontFamily:'monospace',fontSize:9}}>{hex}</code>,
                ]
              ))}
            </div>


<span className="t-tag">RAW BINARY</span>
          </div>
          <div className="tile-gap" />
        </div>

        {/* TILE: 100% on-chain */}
        <div className="tile-row left rv">
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

        {/* SECTION BAR 03 */}
        <div className="row-full rv">
          <div className="section-bar">
            <span className="section-bar-num">03</span>
            <span className="section-bar-title">Digital Evolution in 2 Bits</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">Context</span>
          </div>
        </div>

        {/* DIGITAL EVOLUTION */}
        <div className="row-full rv">
          <div className="compare-wrap" style={{maxWidth:720}}>
            <p className="t-body" style={{fontSize:14,lineHeight:1.8,color:'var(--w)'}}>
              In a world of fleeting digital assets, Bitfauna stands for permanence through transformation. The collection is a living dataset. Through the Sacrifice (Burn) mechanism, users extract energy (Action Points) to refine existing organisms. It is a closed system of creation and destruction — value lies not just in ownership, but in actively shaping the on-chain history.
            </p>
          </div>
        </div>

        {/* SECTION BAR 04 */}
        <div className="row-full rv">
          <div className="section-bar">
            <span className="section-bar-num">04</span>
            <span className="section-bar-title">Normies &amp; Bitfauna</span>
            <div className="section-bar-line" />
            <span className="section-bar-end">The Core Difference</span>
          </div>
        </div>

        {/* NORMIES VS BITFAUNA */}
        <div className="row-full rv">
          <div className="compare-wrap">
            <div className="compare-body">
              <p>Normies and Bitfauna share the same groundbreaking on-chain pixel art technology — the 40×40 bitmaps fully stored in the smart contract, canvas editor, and burn-to-edit mechanics with Action Points. Yet they pursue distinctly different goals. Think of Normies as the big brother of the Bitfauna NFTs: the pioneering collection that laid the technological foundation upon which Bitfauna was built.</p>
              <p>Normies, with its 10,000 monochrome human portraits, is the classic, highly scalable PFP collection: instantly recognizable faces, strong community, and perfectly suited as profile pictures.</p>
              <p>Bitfauna, in contrast, limits itself to only 1,111 pieces and deliberately shifts the focus away from PFP toward pure art.</p>
              <p><strong style={{color:'var(--w)'}}>Visual Depth vs. Simplicity:</strong> While Normies relies on a minimalist 1-bit system (monochrome, 200 bytes), Bitfauna expands the horizon to 2-bit (4 colors). This enables shading, depth, and complex textures that are impossible in the Normies world. Bitfauna is the tool for artists and detail lovers.</p>
              <p><strong style={{color:'var(--w)'}}>Focus vs. Expansion:</strong> Normies is rapidly evolving into a complex ecosystem — with the &quot;Hive&quot; as a social hub, the &quot;Arena&quot; for competitive interactions, and the development of its own AI agents.</p>
              <p><strong style={{color:'var(--w)'}}>Item vs. Agent:</strong> This is the decisive difference: Bitfauna does not aspire to become an autonomous agent. Bitfauna remains the pure canvas project — an item or tool that can be used, painted, and traded by humans and AI agents alike. It is the canvas on which AIs can leave their mark, without building the complexity of their own social behavior model.</p>
            </div>
            <a href="https://normies.art" target="_blank" rel="noopener" style={{display:'inline-block',marginTop:28,fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--w)',border:'var(--b)',padding:'9px 18px'}}>
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
