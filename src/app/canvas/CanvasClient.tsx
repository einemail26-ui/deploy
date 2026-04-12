'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

const PAL=['#FFFFFF','#808080','#0000FF','#000000']
const TOTAL=1600
const CANVAS_ADDRESS=(process.env.NEXT_PUBLIC_CANVAS_ADDRESS??'0x0000000000000000000000000000000000000000') as `0x${string}`
const BITFAUNA_ADDRESS=(process.env.NEXT_PUBLIC_BITFAUNA_ADDRESS??'0x0000000000000000000000000000000000000000') as `0x${string}`
const ALCHEMY_KEY='Aa2hs4IatofJbeB0Nijcw'
const CANVAS_ABI=[
  {name:'setTransformBitmap',type:'function',stateMutability:'nonpayable',inputs:[{name:'tokenId',type:'uint256'},{name:'bitmap',type:'bytes'}],outputs:[]},
  {name:'commitBurn',type:'function',stateMutability:'nonpayable',inputs:[{name:'tokenIds',type:'uint256[]'},{name:'receiverTokenId',type:'uint256'}],outputs:[]},
] as const
const ERC721_ABI=[{name:'setApprovalForAll',type:'function',stateMutability:'nonpayable',inputs:[{name:'operator',type:'address'},{name:'approved',type:'bool'}],outputs:[]}] as const

function h2p(hex:string){const px=new Uint8Array(TOTAL);for(let i=0;i<TOTAL;i++){const b=parseInt(hex.slice((i>>2)*2,(i>>2)*2+2),16);px[i]=(b>>(6-(i&3)*2))&3;}return px;}
function enc(px:Uint8Array){const o=new Uint8Array(400);for(let i=0;i<TOTAL;i++)o[i>>2]|=(px[i]&3)<<(6-(i&3)*2);return o;}
function toHex(b:Uint8Array):`0x${string}`{return('0x'+Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join(''))as`0x${string}`;}
function pct(n:number,t:number){return(n/t*100).toFixed(1)+'%'}
function hsh(n:number){const h=(n>>>0).toString(16).padStart(8,'0');return'0x'+h.slice(0,2)+'..'+h.slice(-2)}
type NFT={id:number;pixels:Uint8Array;pixelCount:number}
type Log={type:'ok'|'err'|'inf';msg:string}

export default function CanvasClient(){
  const {address,isConnected,chain}=useAccount()
  const [pixels,setPixels]=useState(()=>new Uint8Array(TOTAL).fill(3))
  const [edited,setEdited]=useState<Set<number>>(new Set())
  const editedRef=useRef<Set<number>>(new Set())
  const [paintColor,setPaintColor]=useState(0)
  const [brushSize,setBrushSize]=useState(1)
  const [showGrid,setShowGrid]=useState(true)
  const [activeToken,setActiveToken]=useState<NFT|null>(null)
  const [ownedNFTs,setOwnedNFTs]=useState<NFT[]>([])
  const [budgetMax,setBudgetMax]=useState(0)
  const [budgetUsed,setBudgetUsed]=useState(0)
  const [editCount,setEditCount]=useState(0)
  const [logs,setLogs]=useState<Log[]>([{type:'inf',msg:'// Connect wallet to begin.'}])
  const [isDown,setIsDown]=useState(false)
  const [showSel,setShowSel]=useState(false)
  const [showBurn,setShowBurn]=useState(false)
  const [burnSel,setBurnSel]=useState<Set<number>>(new Set())
  const [lock,setLock]=useState('Connect wallet to load your Bitfauna')
  const [seed,setSeed]=useState(0)
  const [cur,setCur]=useState({x:0,y:0})
  const [submitting,setSubmitting]=useState(false)
  const [burning,setBurning]=useState(false)
  const mc=useRef<HTMLCanvasElement>(null)
  const gc=useRef<HTMLCanvasElement>(null)
  const {writeContractAsync}=useWriteContract()
  const log=useCallback((type:Log['type'],msg:string)=>setLogs(p=>[...p.slice(-20),{type,msg}]),[])

  useEffect(()=>{const c=mc.current;if(!c)return;const x=c.getContext('2d')!;for(let i=0;i<TOTAL;i++){x.fillStyle=PAL[pixels[i]];x.fillRect(i%40,i/40|0,1,1)}},[pixels])
  useEffect(()=>{const c=gc.current;if(!c)return;const x=c.getContext('2d')!;x.clearRect(0,0,560,560);if(!showGrid)return;const s=14;x.strokeStyle='rgba(255,255,255,0.07)';x.lineWidth=0.5;x.beginPath();for(let i=0;i<=40;i++){x.moveTo(i*s,0);x.lineTo(i*s,560);x.moveTo(0,i*s);x.lineTo(560,i*s)}x.stroke()},[showGrid])

  const cc=[0,1,2,3].map(c=>pixels.filter(p=>p===c).length)
  function coords(e:React.MouseEvent<HTMLDivElement>){const c=mc.current!,r=c.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)*(40/r.width)),y=Math.floor((e.clientY-r.top)*(40/r.height));return{x,y,ok:x>=0&&x<40&&y>=0&&y<40}}
  function paint(x:number,y:number){const h=Math.floor(brushSize/2);setPixels(prev=>{const n=new Uint8Array(prev),ne=new Set(edited);let nu=budgetUsed,nc=editCount;for(let dy=-h;dy<=h;dy++)for(let dx=-h;dx<=h;dx++){const px=x+dx,py=y+dy;if(px<0||px>=40||py<0||py>=40)continue;const i=py*40+px;if(n[i]===paintColor)continue;if(!ne.has(i)&&nu>=budgetMax&&budgetMax>0)continue;n[i]=paintColor;if(!ne.has(i)){ne.add(i);nu++;nc++}}editedRef.current=ne;setEdited(ne);setBudgetUsed(nu);setEditCount(nc);return n})}

  async function loadToken(nft:NFT){
    setActiveToken(nft);setPixels(new Uint8Array(nft.pixels));setEdited(new Set());setBudgetUsed(0);setEditCount(0);setSeed(nft.id*0x9e3779b9>>>0);setLock('');
    log('ok','// Bitfauna #'+nft.id+' loaded.')
    try{
      const res=await fetch(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:'0x5b8c543711228595c72a76828b12107e9ccc1b56',data:'0x'+('c87b56dd').padEnd(8,'0')+nft.id.toString(16).padStart(64,'0')},'latest']})})
      const apRes=await fetch(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:'0x5b8c543711228595c72a76828b12107e9ccc1b56',data:'0x5c5c3021'+nft.id.toString(16).padStart(64,'0')},'latest']})})
      if(apRes.ok){const d=await apRes.json();const ap=parseInt(d.result,16);if(!isNaN(ap)&&ap>0){setBudgetMax(ap);log('inf','// Action Points: '+ap);}else{setBudgetMax(100)}}
    }catch{setBudgetMax(100)}
  }

  async function loadNFTs(addr:string){
    log('inf','// Loading...')
    try{
      const apiUrl=(process.env.NEXT_PUBLIC_API_URL??'http://localhost:3001')
      const nftRes=await fetch(`https://eth-sepolia.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${addr}&contractAddresses[]=0x2a47Ba82E696d7e322505AfEdfE0d51c385DA486&withMetadata=false`)
      if(nftRes.ok){
        const nftData=await nftRes.json()
        const owned=nftData.ownedNfts??[]
        if(owned.length>0){
          log('ok','// Found '+owned.length+' Bitfauna on-chain.')
          const nfts=await Promise.all(owned.map(async(t:any)=>{
            const id=parseInt(t.tokenId)
            let pixels=new Uint8Array(TOTAL).fill(3)
            try{const pxRes=await fetch(apiUrl+'/bitfauna/'+id+'/pixels');if(pxRes.ok){const raw=await pxRes.text();const px=new Uint8Array(TOTAL);for(let i=0;i<TOTAL;i++)px[i]=parseInt(raw[i])||0;pixels=px}}catch{}
            return{id,pixels,pixelCount:1600}
          }))
          setOwnedNFTs(nfts);setLock('Select a Bitfauna to edit');return
        }
      }
    }catch(e:any){log('err','// '+e.message)}
    log('err','// No Bitfauna found for this wallet on Sepolia.')
    setOwnedNFTs([]);setLock('No Bitfauna found')
  }

  useEffect(()=>{if(isConnected&&address){log('ok','// '+address.slice(0,6)+'...'+address.slice(-4));if(chain)log('inf','// '+chain.name);loadNFTs(address)}else{setOwnedNFTs([]);setActiveToken(null);setLock('Connect wallet to load your Bitfauna');log('inf','// Disconnected.')}},[isConnected,address])

  async function approve(){
    if(!activeToken||!editedRef.current.size){log('err','// No changes.');return}
    setSubmitting(true)
    try{
      // Build diff bitmap — only edited pixels, rest stays 0x00
      const diff=new Uint8Array(400)
      editedRef.current.forEach(i=>{
        const byteIdx=i>>2
        const bitShift=6-(i&3)*2
        diff[byteIdx]|=(pixels[i]&3)<<bitShift
      })
      const activeCount=Array.from(diff).reduce((s,b)=>{
        let c=0
        if(((b>>6)&3)!==0)c++
        if(((b>>4)&3)!==0)c++
        if(((b>>2)&3)!==0)c++
        if((b&3)!==0)c++
        return s+c
      },0)
      log('inf','// editedRef size: '+editedRef.current.size+' edited size: '+edited.size)
      log('inf','// Submitting '+activeCount+' active pixels (budget: '+budgetMax+')')
      if(activeCount>budgetMax){log('err','// Exceeds budget! '+activeCount+' > '+budgetMax);setSubmitting(false);return}
      const tx=await writeContractAsync({address:CANVAS_ADDRESS,abi:CANVAS_ABI,functionName:'setTransformBitmap',args:[BigInt(activeToken.id),toHex(diff)]})
      log('ok','// TX: '+tx.slice(0,10)+'...')
    }catch(e:any){log('err','// '+(e.shortMessage??e.message??'Failed'))}
    finally{setSubmitting(false)}
  }

  async function doBurn(){if(!activeToken||!burnSel.size)return;setBurning(true);try{log('inf','// Approving...');await writeContractAsync({address:BITFAUNA_ADDRESS,abi:ERC721_ABI,functionName:'setApprovalForAll',args:[CANVAS_ADDRESS,true]});log('ok','// Approved!');log('inf','// Burning...');const tx=await writeContractAsync({address:CANVAS_ADDRESS,abi:CANVAS_ABI,functionName:'commitBurn',args:[Array.from(burnSel).map(BigInt),BigInt(activeToken.id)]});log('ok','// Burn: '+tx.slice(0,10)+'...');setShowBurn(false);setBurnSel(new Set())}catch(e:any){log('err','// '+(e.shortMessage??e.message??String(e)))}finally{setBurning(false)}}

  function doExport(){let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" shape-rendering="crispEdges">`;for(let i=0;i<TOTAL;i++)svg+=`<rect x="${(i%40)*10}" y="${(i/40|0)*10}" width="10" height="10" fill="${PAL[pixels[i]]}"/>`;svg+='</svg>';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));a.download='bitfauna.svg';a.click();log('inf','// Exported.')}

  const bp=budgetMax>0?Math.min(budgetUsed/budgetMax*100,100):0

  return(<>
    <header><div className="hdr">
      <Link href="/" className="hdr-logo">BITFAUNA</Link>
      <Link href="/" style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'0 20px',display:'flex',alignItems:'center',borderRight:'var(--b)',color:'var(--dim)'}}>← Back</Link>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0 20px',display:'flex',alignItems:'center',color:'var(--blue)'}}>Canvas</span>
      {chain&&<span style={{fontSize:10,padding:'0 16px',display:'flex',alignItems:'center',color:'var(--dim)',borderLeft:'var(--b)'}}>{chain.name}</span>}
      <div style={{marginLeft:'auto',borderLeft:'var(--b)',padding:'0 20px',display:'flex',alignItems:'center'}}>
        <ConnectButton.Custom>{({account,openAccountModal,openConnectModal,mounted})=>{if(!mounted)return null;if(!account)return<button onClick={openConnectModal} className="hdr-btn" style={{border:'none'}}><span className="w-dot"/>Connect</button>;return<button onClick={openAccountModal} className="hdr-btn connected" style={{border:'none'}}><span className="w-dot live"/>{account.displayName}</button>}}</ConnectButton.Custom>
      </div>
    </div></header>

    <div className="canvas-page">
      <div className="panel-l">
        <div className="panel-head"><span><span className="live-dot"/>BITFAUNA CANVAS 40x40</span><span>{editCount} edits</span></div>
        <div className="canvas-wrap" onMouseDown={e=>{if(!activeToken)return;setIsDown(true);const{x,y,ok}=coords(e);if(ok)paint(x,y)}} onMouseMove={e=>{const{x,y,ok}=coords(e);if(ok)setCur({x,y});if(!isDown||!ok||!activeToken)return;paint(x,y)}} onMouseUp={()=>setIsDown(false)} onMouseLeave={()=>setIsDown(false)} onContextMenu={e=>e.preventDefault()}>
          <canvas ref={mc} width={40} height={40} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:1,imageRendering:'pixelated'}}/>
          <canvas ref={gc} width={560} height={560} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:2,pointerEvents:'none'}}/>
          {lock&&<div id="canvas-lock"><span className="lock-msg">{lock}</span>
            {!isConnected&&<ConnectButton.Custom>{({openConnectModal})=><button className="btn btn-blue" onClick={openConnectModal}>[Connect Wallet]</button>}</ConnectButton.Custom>}
            {isConnected&&ownedNFTs.length>0&&<button className="btn btn-blue" onClick={()=>setShowSel(true)}>[Select Bitfauna]</button>}
          </div>}
        </div>
        <div className="panel-foot"><span>40x40 · 2-bit · <span className="hi">{hsh(seed)}</span></span><span>x:{cur.x} y:{cur.y}</span><span>Budget: {budgetMax-budgetUsed}/{budgetMax}</span></div>
      </div>

      <div className="panel-r">
        <div className="tool-sec">
          <span className="tool-title">Active Bitfauna</span>
          <div className="nft-row"><div className="nft-thumb">{activeToken?<Thumb px={activeToken.pixels}/>:<span>—</span>}</div><div className="nft-info"><div className="nft-id">{activeToken?'Bitfauna #'+activeToken.id:'No NFT selected'}</div><div className="nft-sub">{activeToken?'Budget: '+budgetMax+' px':'Connect wallet'}</div></div></div>
          <button className="btn" style={{width:'100%',marginBottom:12}} disabled={!isConnected||!ownedNFTs.length} onClick={()=>setShowSel(true)}>[Select Bitfauna to Edit]</button>
          <div className="budget-wrap"><div className="budget-label">Budget: <span>{budgetMax-budgetUsed}</span>/<span>{budgetMax}</span></div><div className="budget-bar-bg"><div className="budget-bar-fill" style={{width:bp+'%'}}/></div></div>
        </div>
        <div className="tool-sec">
          <span className="tool-title">Expand Budget</span>
          <button className="btn" style={{width:'100%',color:'var(--blue)',borderColor:'var(--blue)'}} disabled={!activeToken} onClick={()=>{log('inf','// Opening burn modal...');setShowBurn(true)}}>[Burn to Get Pixels]</button>
          <p style={{fontSize:10,color:'var(--dim)',marginTop:10,lineHeight:1.7}}>Burn another Bitfauna to get its pixel count as budget.</p>
        </div>
        <div className="tool-sec">
          <span className="tool-title">Paint</span>
          <div className="palette">{[{c:0,bg:'#FFFFFF',l:'White'},{c:1,bg:'#808080',l:'Gray'},{c:2,bg:'#0000FF',l:'Blue'},{c:3,bg:'#000000',l:'Black'}].map(s=><div key={s.c} className={'swatch'+(paintColor===s.c?' on':'')} onClick={()=>setPaintColor(s.c)}><div className="sw-box" style={{background:s.bg,borderColor:s.c===3?'#444':undefined}}/><span className="sw-lbl">{s.l}</span></div>)}</div>
          <div className="brush-row"><span className="brush-label">Brush:</span>{[1,2,3].map(s=><button key={s} className={'brush-btn'+(brushSize===s?' on':'')} onClick={()=>setBrushSize(s)}>{s}px</button>)}</div>
        </div>
        <div className="tool-sec">
          <span className="tool-title">Canvas</span>
          <div className="btn-row">
            <button className="btn" disabled={!activeToken} onClick={()=>{setPixels(new Uint8Array(TOTAL).fill(3));setEdited(new Set());setEditCount(0);setBudgetUsed(0);log('inf','// Cleared.')}}>[Clear]</button>
            <button className="btn" disabled={!activeToken} onClick={doExport}>[Export SVG]</button>
            <button className="btn" onClick={()=>setShowGrid(g=>!g)}>[Grid:{showGrid?'ON':'OFF'}]</button>
          </div>
        </div>
        <div className="tool-sec">
          <span className="tool-title">Composition</span>
          {['White','Gray','Blue','Black'].map((l,i)=><div key={i} className="meta-row"><span className="mk">{l}</span><span className={'mv'+(i===2?' blue':'')}>{pct(cc[i],TOTAL)}</span></div>)}
        </div>
        <div className="tool-sec"><span className="tool-title">Status</span><div className="log">{logs.map((l,i)=><div key={i} className={l.type}>{l.msg}</div>)}</div></div>
        <div className="spacer"/>
        <div className="tool-sec"><button className="btn btn-blue btn-full" disabled={!activeToken||!edited.size||submitting} onClick={approve}>{submitting?'[Submitting...]':'[Approve Changes]'}</button></div>
      </div>
    </div>

    {showSel&&<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowSel(false)}}><div className="modal">
      <div className="modal-head"><span className="modal-title">Select Bitfauna</span><button className="modal-close" onClick={()=>setShowSel(false)}>✕</button></div>
      <div className="modal-body"><div className="nft-grid">{ownedNFTs.length===0?<div className="nft-empty">No Bitfauna found.</div>:ownedNFTs.map(n=><div key={n.id} className={'nft-card'+(activeToken?.id===n.id?' selected':'')} onClick={()=>{loadToken(n);setShowSel(false)}}><Thumb px={n.pixels} sz={80}/><div className="nft-card-id">#{n.id}</div><div className="nft-card-px">{n.pixelCount} px</div></div>)}</div></div>
      <div className="modal-footer"><button className="btn" style={{flex:1}} onClick={()=>setShowSel(false)}>[Cancel]</button></div>
    </div></div>}

    {showBurn&&<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowBurn(false)}}><div className="modal">
      <div className="modal-head"><span className="modal-title">Burn for Budget</span><button className="modal-close" onClick={()=>setShowBurn(false)}>✕</button></div>
      <div className="modal-body">
        <p style={{fontSize:11,color:'var(--gray)',marginBottom:16,lineHeight:1.8}}>Select NFTs to burn. <span style={{color:'var(--blue)',fontWeight:700}}>Permanent.</span></p>
        {burnSel.size>0&&<div style={{fontSize:12,color:'var(--blue)',marginBottom:14,fontWeight:700}}>{burnSel.size} selected</div>}
        <div className="nft-grid">{ownedNFTs.filter(n=>n.id!==activeToken?.id).length===0?<div className="nft-empty">No other Bitfauna.</div>:ownedNFTs.filter(n=>n.id!==activeToken?.id).map(n=><div key={n.id} className={'nft-card'+(burnSel.has(n.id)?' burn-selected':'')} onClick={()=>setBurnSel(p=>{const nx=new Set(p);nx.has(n.id)?nx.delete(n.id):nx.add(n.id);return nx})}><Thumb px={n.pixels} sz={80}/><div className="nft-card-id">#{n.id}</div><div className="nft-card-px">+{n.pixelCount}px</div></div>)}</div>
      </div>
      <div className="modal-footer">
        <button className="btn" style={{flex:1}} onClick={()=>setShowBurn(false)}>[Cancel]</button>
        <button className="btn" style={{flex:1,color:'var(--blue)',borderColor:'var(--blue)'}} disabled={!burnSel.size||burning} onClick={doBurn}>{burning?'[Processing...]':'[Burn Selected]'}</button>
      </div>
    </div></div>}
  </>)
}

function Thumb({px,sz=56}:{px:Uint8Array;sz?:number}){
  const r=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{if(!r.current)return;r.current.width=40;r.current.height=40;const c=r.current.getContext('2d')!;for(let i=0;i<1600;i++){c.fillStyle=PAL[px[i]];c.fillRect(i%40,i/40|0,1,1)}},[px])
  return<canvas ref={r} style={{width:sz,height:sz,imageRendering:'pixelated'}}/>
}
