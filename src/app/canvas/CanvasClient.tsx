'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const PAL=['#FFFFFF','#000000','#808080','#0000FF']
const TOTAL=1600
const CANVAS_ADDRESS=(process.env.NEXT_PUBLIC_CANVAS_ADDRESS??'0x60Ae844E5Eb9BD747feFB9b110E89097C2C88A58') as `0x${string}`
const BITFAUNA_ADDRESS=(process.env.NEXT_PUBLIC_BITFAUNA_ADDRESS??'0xD7c9a6b38568c03fbA1f08f4159dD2c032411Ac9') as `0x${string}`
const STORAGE_ADDRESS=(process.env.NEXT_PUBLIC_STORAGE_ADDRESS??'0x9B2EA7B176D727459233469c88c7352fb060b85B') as `0x${string}`
// BitfaunaCanvasStorage — stores the transform overlay (user edits), separate from original
const CANVAS_STORAGE_ADDRESS='0x324436ae951658C3dc978aE2449467894cB347Ec'
const ALCHEMY_KEY='Aa2hs4IatofJbeB0Nijcw'
const RPC_URL=`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
const RPC_FALLBACK='https://sepolia.drpc.org'
const CANVAS_ABI=[
  {name:'setTransformBitmap',type:'function',stateMutability:'nonpayable',inputs:[{name:'tokenId',type:'uint256'},{name:'bitmap',type:'bytes'}],outputs:[]},
  {name:'commitBurn',type:'function',stateMutability:'nonpayable',inputs:[{name:'tokenIds',type:'uint256[]'},{name:'receiverTokenId',type:'uint256'}],outputs:[]},
  {name:'revealBurn',type:'function',stateMutability:'nonpayable',inputs:[{name:'commitId',type:'uint256'}],outputs:[]},
  {name:'pendingBurnCommitments',type:'function',stateMutability:'view',inputs:[{name:'owner',type:'address'}],outputs:[{name:'commitIds',type:'uint256[]'},{name:'receiverTokenIds',type:'uint256[]'}]},
  {name:'revealBlock',type:'function',stateMutability:'view',inputs:[{name:'commitId',type:'uint256'}],outputs:[{type:'uint256'}]},
] as const
const ERC721_ABI=[
  {name:'approve',type:'function',stateMutability:'nonpayable',inputs:[{name:'to',type:'address'},{name:'tokenId',type:'uint256'}],outputs:[]},
] as const

function h2p(hex:string){const px=new Uint8Array(TOTAL);for(let i=0;i<TOTAL;i++){const b=parseInt(hex.slice((i>>2)*2,(i>>2)*2+2),16);px[i]=(b>>(6-(i&3)*2))&3;}return px;}
function enc(px:Uint8Array){const o=new Uint8Array(400);for(let i=0;i<TOTAL;i++)o[i>>2]|=(px[i]&3)<<(6-(i&3)*2);return o;}
function toHex(b:Uint8Array):`0x${string}`{return('0x'+Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join(''))as`0x${string}`;}
function pct(n:number,t:number){return(n/t*100).toFixed(1)+'%'}
function hsh(n:number){const h=(n>>>0).toString(16).padStart(8,'0');return'0x'+h.slice(0,2)+'..'+h.slice(-2)}
// AP range earned when burning a token: pixelCount * percent * 2 / 100, percent rolled 1-4% by tier
function apRange(pc:number):[number,number]{const min=pc<490?1:pc<890?2:3;return[Math.floor(pc*min*2/100),Math.floor(pc*4*2/100)]}
type NFT={id:number;pixels:Uint8Array;pixelCount:number}
type Log={type:'ok'|'err'|'inf';msg:string}
type PendingCommit={commitId:number;receiverTokenId:number;revealBlock:number}

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
  const [pendingCommits,setPendingCommits]=useState<PendingCommit[]>([])
  const [blockNumber,setBlockNumber]=useState(0)
  const [revealing,setRevealing]=useState<number|null>(null)
  const [gridThickness]=useState(0.5)
  const [tool,setTool]=useState<'brush'|'circle'|'square'>('brush')
  const [refLocked,setRefLockedRaw]=useState(true)
  const [refOpacity,setRefOpacity]=useState(50)
  const [refFilename,setRefFilename]=useState('')
  const [hasRef,setHasRef]=useState(false)
  const mc=useRef<HTMLCanvasElement>(null)
  const gc=useRef<HTMLCanvasElement>(null)
  const pv=useRef<HTMLCanvasElement>(null)
  const shapeStartRef=useRef<{x:number,y:number}|null>(null)
  const originalPixels=useRef<Uint8Array>(new Uint8Array(TOTAL))
  const rc=useRef<HTMLCanvasElement>(null)
  const wrapRef=useRef<HTMLDivElement>(null)
  const refImageRef=useRef<HTMLImageElement|null>(null)
  const refTransformRef=useRef({x:0,y:0,scale:1})
  const refLockedRef=useRef(true)
  const isPanningRef=useRef(false)
  const panStartRef=useRef({x:0,y:0})
  const panRefOriginRef=useRef({x:0,y:0})
  const lastTouchDistRef=useRef<number|null>(null)
  const lastTouchMidRef=useRef({x:0,y:0})
  const {writeContractAsync}=useWriteContract()
  const log=useCallback((type:Log['type'],msg:string)=>setLogs(p=>[...p.slice(-40),{type,msg}]),[])
  function setRefLocked(v:boolean){refLockedRef.current=v;setRefLockedRaw(v)}
  function renderRefCanvas(){
    const c=rc.current;if(!c||!refImageRef.current)return
    const ctx=c.getContext('2d')!,img=refImageRef.current,{x,y,scale}=refTransformRef.current
    ctx.clearRect(0,0,560,560);ctx.drawImage(img,x,y,img.naturalWidth*scale,img.naturalHeight*scale)
  }
  function loadRef(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    setRefFilename(file.name);setHasRef(true)
    const img=new Image()
    img.onload=()=>{
      refImageRef.current=img
      const s=Math.min(560/img.naturalWidth,560/img.naturalHeight)
      refTransformRef.current={x:0,y:0,scale:s}
      renderRefCanvas()
    }
    img.src=URL.createObjectURL(file)
  }

  // Poll current block number every 12s to track revealBurn readiness
  useEffect(()=>{
    async function fetchBlock(){
      try{
        const res=await fetch(RPC_FALLBACK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]})})
        const d=await res.json()
        setBlockNumber(parseInt(d.result,16))
      }catch{}
    }
    fetchBlock()
    const t=setInterval(fetchBlock,12000)
    return()=>clearInterval(t)
  },[])

  // Load pending burn commitments for connected wallet
  const loadPendingCommits=useCallback(async(addr:string)=>{
    try{
      const callData=encodeFunctionData({abi:CANVAS_ABI,functionName:'pendingBurnCommitments',args:[addr as `0x${string}`]})
      const result=await rpcCall(CANVAS_ADDRESS,callData)
      // ABI decode (uint256[], uint256[]): offset1, offset2, len1, ...ids, len2, ...receiverIds
      const hex=result.slice(2)
      const offset1=parseInt(hex.slice(0,64),16)*2
      const offset2=parseInt(hex.slice(64,128),16)*2
      const len1=parseInt(hex.slice(offset1,offset1+64),16)
      const ids:number[]=[]
      for(let i=0;i<len1;i++) ids.push(parseInt(hex.slice(offset1+64+i*64,offset1+128+i*64),16))
      const len2=parseInt(hex.slice(offset2,offset2+64),16)
      const receivers:number[]=[]
      for(let i=0;i<len2;i++) receivers.push(parseInt(hex.slice(offset2+64+i*64,offset2+128+i*64),16))
      // Fetch revealBlock for each commitId
      const commits:PendingCommit[]=await Promise.all(ids.map(async(cid,i)=>{
        try{
          const rbData=encodeFunctionData({abi:CANVAS_ABI,functionName:'revealBlock',args:[BigInt(cid)]})
          const rbResult=await rpcCall(CANVAS_ADDRESS,rbData)
          const rb=parseInt(rbResult.slice(2),16)
          return{commitId:cid,receiverTokenId:receivers[i],revealBlock:rb}
        }catch{return{commitId:cid,receiverTokenId:receivers[i],revealBlock:0}}
      }))
      setPendingCommits(commits)
    }catch{}
  },[])

  useEffect(()=>{const c=mc.current;if(!c)return;const x=c.getContext('2d')!;for(let i=0;i<TOTAL;i++){x.fillStyle=PAL[pixels[i]];x.fillRect(i%40,i/40|0,1,1)}},[pixels])
  const blackCount=pixels.filter(p=>p===1).length

  useEffect(()=>{
    const c=gc.current;if(!c)return;const x=c.getContext('2d')!;x.clearRect(0,0,560,560)
    if(!showGrid)return;const s=14
    const col=blackCount>TOTAL/2?'#FFFFFF':'#000000'
    const r=parseInt(col.slice(1,3),16),g=parseInt(col.slice(3,5),16),b=parseInt(col.slice(5,7),16)
    x.strokeStyle=`rgba(${r},${g},${b},0.8)`;x.lineWidth=gridThickness
    x.beginPath();for(let i=0;i<=40;i++){x.moveTo(i*s,0);x.lineTo(i*s,560);x.moveTo(0,i*s);x.lineTo(560,i*s)}x.stroke()
  },[showGrid,blackCount,gridThickness])

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return
    function onWheel(e:WheelEvent){
      if(refLockedRef.current||!refImageRef.current)return
      e.preventDefault()
      const domC=mc.current;if(!domC)return
      const r=domC.getBoundingClientRect()
      const px=(e.clientX-r.left)/r.width*560,py=(e.clientY-r.top)/r.height*560
      const factor=e.deltaY<0?1.12:1/1.12
      const tr=refTransformRef.current,ns=Math.min(Math.max(tr.scale*factor,0.03),30),ratio=ns/tr.scale
      refTransformRef.current={x:px-ratio*(px-tr.x),y:py-ratio*(py-tr.y),scale:ns}
      const c=rc.current;if(!c)return
      const ctx=c.getContext('2d')!,img=refImageRef.current!,{x,y,scale}=refTransformRef.current
      ctx.clearRect(0,0,560,560);ctx.drawImage(img,x,y,img.naturalWidth*scale,img.naturalHeight*scale)
    }
    el.addEventListener('wheel',onWheel,{passive:false})
    return()=>el.removeEventListener('wheel',onWheel)
  },[])

  const cc=[0,1,2,3].map(c=>pixels.filter(p=>p===c).length)
  function coordsFromClient(cx:number,cy:number){const c=mc.current!,r=c.getBoundingClientRect();const x=Math.floor((cx-r.left)*(40/r.width)),y=Math.floor((cy-r.top)*(40/r.height));return{x,y,ok:x>=0&&x<40&&y>=0&&y<40}}
  function coords(e:React.MouseEvent<HTMLDivElement>){return coordsFromClient(e.clientX,e.clientY)}
  function paint(x:number,y:number){
    const h=Math.floor(brushSize/2)
    const orig=originalPixels.current
    setPixels(prev=>{
      const n=new Uint8Array(prev),ne=new Set(edited)
      let nu=budgetUsed,nc=editCount
      for(let dy=-h;dy<=h;dy++)for(let dx=-h;dx<=h;dx++){
        const px=x+dx,py=y+dy
        if(px<0||px>=40||py<0||py>=40)continue
        const i=py*40+px
        if(n[i]===paintColor)continue
        const wasDiff=n[i]!==orig[i]   // currently differs from original?
        const willDiff=paintColor!==orig[i] // new color differs from original?
        // Block only if this would ADD a new changed pixel and budget is full
        if(!wasDiff&&willDiff&&nu>=budgetMax&&budgetMax>0)continue
        n[i]=paintColor
        if(!wasDiff&&willDiff){ne.add(i);nu++;nc++}
        else if(wasDiff&&!willDiff){ne.delete(i);nu--;nc--}
      }
      editedRef.current=ne;setEdited(ne);setBudgetUsed(nu);setEditCount(nc)
      return n
    })
  }

  function paintShape(cx:number,cy:number,radius:number){
    const orig=originalPixels.current
    const r=Math.max(radius,0.5)
    setPixels(prev=>{
      const n=new Uint8Array(prev),ne=new Set(edited)
      let nu=budgetUsed,nc=editCount
      for(let py=0;py<40;py++)for(let px=0;px<40;px++){
        const dx=px-cx,dy=py-cy
        const inShape=tool==='circle'?Math.sqrt(dx*dx+dy*dy)<=r:Math.abs(dx)<=r&&Math.abs(dy)<=r
        if(!inShape)continue
        const i=py*40+px
        if(n[i]===paintColor)continue
        const wasDiff=n[i]!==orig[i],willDiff=paintColor!==orig[i]
        if(!wasDiff&&willDiff&&nu>=budgetMax&&budgetMax>0)continue
        n[i]=paintColor
        if(!wasDiff&&willDiff){ne.add(i);nu++;nc++}
        else if(wasDiff&&!willDiff){ne.delete(i);nu--;nc--}
      }
      editedRef.current=ne;setEdited(ne);setBudgetUsed(nu);setEditCount(nc)
      return n
    })
  }

  function drawShapePreview(cx:number,cy:number,radius:number){
    const c=pv.current;if(!c)return
    const ctx=c.getContext('2d')!;ctx.clearRect(0,0,560,560)
    const s=14;ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=1;ctx.setLineDash([4,4])
    if(tool==='circle'){ctx.beginPath();ctx.arc((cx+0.5)*s,(cy+0.5)*s,radius*s,0,Math.PI*2);ctx.stroke()}
    else{const r=radius*s;ctx.strokeRect((cx-radius)*s,(cy-radius)*s,r*2,r*2)}
    ctx.setLineDash([])
  }

  function clearPreview(){const c=pv.current;if(!c)return;c.getContext('2d')!.clearRect(0,0,560,560)}

  async function loadToken(nft:NFT){
    setActiveToken(nft)
    setPixels(new Uint8Array(nft.pixels))
    setEdited(new Set());editedRef.current=new Set()
    setBudgetUsed(0);setEditCount(0)
    setSeed(nft.id*0x9e3779b9>>>0);setLock('');setBurnSel(new Set())
    log('ok','// Bitfauna #'+nft.id+' loaded.')

    // 1 — Original pixels (required; rpcCall already tries Alchemy → drpc)
    let orig:Uint8Array
    try{orig=await fetchPixelsOnChain(nft.id)}
    catch(e:any){log('err','// Pixel fetch failed: '+e.message);setBudgetMax(0);return}
    originalPixels.current=orig

    // 2 — Transform layer (optional: reverts if token never edited → use zeros)
    let transformPx:Uint8Array=new Uint8Array(TOTAL)
    try{
      transformPx=await fetchTransformOnChain(nft.id) as Uint8Array
      log('inf','// Transform gefunden — compositing...')
    }catch(e:any){
      log('inf','// Kein Transform gespeichert (unbearbeitetes Token).')
    }

    // 3 — Composite: display[i] = original[i] XOR transform[i]
    const composite=new Uint8Array(TOTAL)
    let used=0
    const ne=new Set<number>()
    for(let i=0;i<TOTAL;i++){
      composite[i]=(orig[i]^transformPx[i])&3
      if(transformPx[i]!==0){used++;ne.add(i)}
    }
    setPixels(composite);setBudgetUsed(used);setEditCount(used)
    setEdited(ne);editedRef.current=ne
    if(used>0) log('ok','// '+used+' Pixel vom Original abweichend.')
    // Update thumbnail in NFT list with composited state (fixes reload scenario)
    const compositeToken={...nft,pixels:new Uint8Array(composite)}
    setActiveToken(compositeToken)
    setOwnedNFTs(prev=>prev.map(n=>n.id===nft.id?compositeToken:n))

    // 4 — Action Points (uses rpcCall with Alchemy → drpc fallback; soft-fail → 0)
    try{
      const apResult=await rpcCall(CANVAS_ADDRESS,'0x5c5c3021'+nft.id.toString(16).padStart(64,'0'))
      const ap=parseInt(apResult.slice(2),16)
      if(!isNaN(ap)&&ap>=0){setBudgetMax(ap);log('inf','// Action Points: '+ap)}else setBudgetMax(0)
    }catch{setBudgetMax(0)}
  }

  async function rpcCall(to:string,data:string):Promise<string>{
    for(const url of [RPC_URL,RPC_FALLBACK]){
      try{
        const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to,data},'latest']})})
        if(!res.ok)continue
        const d=await res.json()
        if(d.error)throw new Error(d.error.message)
        if(!d.result||d.result==='0x')continue
        return d.result
      }catch(e:any){if(url===RPC_FALLBACK)throw e}
    }
    throw new Error('all rpc failed')
  }

  // Poll eth_getTransactionReceipt directly — avoids wagmi hanging issues
  async function pollForReceipt(hash:string):Promise<void>{
    for(let i=0;i<90;i++){
      await new Promise(r=>setTimeout(r,4000))
      for(const url of [RPC_URL,RPC_FALLBACK]){
        try{
          const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionReceipt',params:[hash]})})
          const d=await res.json()
          if(d.result&&d.result.blockNumber){
            if(d.result.status==='0x0')throw new Error('TX reverted on-chain (check budget/AP/ownership)')
            return
          }
        }catch(e:any){if(e.message.includes('reverted'))throw e}
      }
    }
    throw new Error('TX confirmation timeout (6 min)')
  }

  async function fetchPixelsOnChain(id:number):Promise<Uint8Array>{
    // getTokenRawImageData(uint256) = 0x6985bf3c on BitfaunaStorage
    const result=await rpcCall(STORAGE_ADDRESS,'0x6985bf3c'+id.toString(16).padStart(64,'0'))
    // ABI-decode bytes: 32 offset + 32 length + 400 data bytes
    const hex=result.slice(2)
    const dataStart=128 // 32-byte offset + 32-byte length = 64 bytes = 128 hex chars
    const raw=hex.slice(dataStart,dataStart+800) // 400 bytes = 800 hex chars
    return h2p(raw)
  }

  async function fetchTransformOnChain(id:number):Promise<Uint8Array>{
    // getTransformedImageData(uint256) = 0xbab917b9 on BitfaunaCanvasStorage
    // Verified via keccak256("getTransformedImageData(uint256)") — 0x745176a0 was WRONG
    // Reverts with TokenNotTransformed if no edits stored yet — caller must handle
    const result=await rpcCall(CANVAS_STORAGE_ADDRESS,'0xbab917b9'+id.toString(16).padStart(64,'0'))
    const hex=result.slice(2)
    const dataStart=128
    const raw=hex.slice(dataStart,dataStart+800)
    return h2p(raw)
  }

  async function fetchPixelCount(id:number):Promise<number>{
    // getTokenTraits(uint256) = 0x94e56847 → returns (uint8 colorIndex, uint16 pixelcount)
    // ABI-encoded as two uint256 slots (padded)
    const result=await rpcCall(STORAGE_ADDRESS,'0x94e56847'+id.toString(16).padStart(64,'0'))
    const hex=result.slice(2)
    // second slot (bytes 32-63) = pixelcount as uint256
    const pixelcount=parseInt(hex.slice(64,128),16)
    return pixelcount
  }

  async function loadNFTs(addr:string){
    log('inf','// Loading NFT list...')
    try{
      // Fetch all token IDs first (paginated), then lazy-load pixel+trait data in batches
      const allOwned:any[]=[]
      let pageKey:string|undefined=undefined
      do{
        const qUrl:string=`https://eth-sepolia.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${addr}&contractAddresses[]=${BITFAUNA_ADDRESS}&withMetadata=false&pageSize=100`+(pageKey?`&pageKey=${pageKey}`:'')
        const nftRes:Response=await fetch(qUrl)
        if(!nftRes.ok)break
        const nftData:{ownedNfts:any[];pageKey?:string}=await nftRes.json()
        allOwned.push(...(nftData.ownedNfts??[]))
        pageKey=nftData.pageKey
      }while(pageKey)

      if(allOwned.length>0){
        log('ok','// Found '+allOwned.length+' Bitfauna. Loading data...')
        // Show placeholders immediately, then fill in batches of 10
        const placeholders:NFT[]=allOwned.map((t:any)=>({id:parseInt(t.tokenId),pixels:new Uint8Array(TOTAL).fill(0) as unknown as Uint8Array,pixelCount:500}))
        setOwnedNFTs([...placeholders])
        setLock('Select a Bitfauna to edit')

        // Load pixel+trait data in batches to avoid RPC overload
        const BATCH=10
        for(let i=0;i<placeholders.length;i+=BATCH){
          const batch=placeholders.slice(i,i+BATCH)
          const results=await Promise.all(batch.map(async nft=>{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let pixels:any=nft.pixels
            let pixelCount=nft.pixelCount
            try{
              const [px,pc]=await Promise.all([fetchPixelsOnChain(nft.id),fetchPixelCount(nft.id)])
              pixels=px
              pixelCount=pc
              try{
                const tr=await fetchTransformOnChain(nft.id)
                const composite=new Uint8Array(TOTAL)
                for(let i=0;i<TOTAL;i++) composite[i]=(px[i]^tr[i])&3
                pixels=composite
              }catch{}
            }catch{}
            return{...nft,pixels,pixelCount}
          }))
          setOwnedNFTs(prev=>{const next=[...prev];results.forEach((r,j)=>{next[i+j]=r});return next})
        }
        log('ok','// All data loaded.')
        return
      }
    }catch(e:any){log('err','// '+e.message)}
    log('err','// No Bitfauna found for this wallet on Sepolia.')
    setOwnedNFTs([]);setLock('No Bitfauna found')
  }

  useEffect(()=>{if(isConnected&&address){log('ok','// '+address.slice(0,6)+'...'+address.slice(-4));if(chain)log('inf','// '+chain.name);loadNFTs(address);loadPendingCommits(address)}else{setOwnedNFTs([]);setActiveToken(null);setPendingCommits([]);setLock('Connect wallet to load your Bitfauna');log('inf','// Disconnected.')}},[isConnected,address])

  async function approve(){
    if(!activeToken||!editedRef.current.size){log('err','// No changes.');return}
    const token=activeToken  // capture — activeToken may change during async ops
    const orig=originalPixels.current
    setSubmitting(true)
    try{
      // Build FULL transform bitmap: transform[i] = original[i] XOR desired[i]
      const transform=new Uint8Array(400)
      let activeCount=0
      for(let i=0;i<TOTAL;i++){
        const t=(orig[i]^pixels[i])&3
        if(t!==0){transform[i>>2]|=t<<(6-(i&3)*2);activeCount++}
      }
      log('inf','// Geänderte Pixel: '+activeCount+' / Budget: '+budgetMax)
      if(activeCount>budgetMax){log('err','// Budget überschritten! '+activeCount+' > '+budgetMax);setSubmitting(false);return}
      if(activeCount===0){log('err','// Alle Pixel gleich wie Original — nichts zu speichern.');setSubmitting(false);return}
      const txData=encodeFunctionData({abi:CANVAS_ABI,functionName:'setTransformBitmap',args:[BigInt(token.id),toHex(transform)]})
      const tx=await sendTx(CANVAS_ADDRESS,txData)
      log('ok','// TX: '+tx.slice(0,14)+'... warte...')
      await pollForReceipt(tx)
      log('ok','// TX bestätigt. Lade Onchain-Stand...')
      // Re-fetch transform from chain to confirm saved state; fall back to current pixels if RPC fails
      let freshComposite:Uint8Array<ArrayBuffer>=Uint8Array.from(pixels)
      try{
        const freshTransform=await fetchTransformOnChain(token.id) as Uint8Array
        freshComposite=new Uint8Array(TOTAL)
        for(let i=0;i<TOTAL;i++) freshComposite[i]=(orig[i]^freshTransform[i])&3
        log('ok','// Onchain bestätigt — Canvas gespeichert.')
      }catch{
        log('ok','// Canvas gespeichert (Onchain-Verify übersprungen).')
      }
      setPixels(freshComposite)
      const updatedToken={...token,pixels:freshComposite as unknown as Uint8Array}
      setActiveToken(updatedToken)
      setOwnedNFTs(prev=>prev.map(n=>n.id===token.id?updatedToken:n))
    }catch(e:any){log('err','// '+(e.message??'Failed'))}
    finally{setSubmitting(false)}
  }

  // Send TX directly via window.ethereum — bypasses wagmi simulation that can hang
  async function sendTx(to:string, data:string):Promise<string>{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth=(window as any).ethereum
    if(!eth)throw new Error('No wallet detected')
    // Ensure wallet is on Sepolia (chainId 0xaa36a7 = 11155111)
    try{
      await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xaa36a7'}]})
    }catch(switchErr:any){
      // Chain not added yet — add it
      if(switchErr.code===4902){
        await eth.request({method:'wallet_addEthereumChain',params:[{
          chainId:'0xaa36a7',
          chainName:'Sepolia',
          nativeCurrency:{name:'Sepolia ETH',symbol:'ETH',decimals:18},
          rpcUrls:['https://sepolia.drpc.org'],
          blockExplorerUrls:['https://sepolia.etherscan.io'],
        }]})
      }else if(switchErr.code!==4001){throw switchErr}
    }
    const hash:string=await eth.request({
      method:'eth_sendTransaction',
      params:[{from:address,to,data}],
    })
    return hash
  }

  async function doBurn(){
    if(!activeToken||!burnSel.size||!address)return
    // Safety: never include the receiver in the burn set
    const burnIds=Array.from(burnSel).filter(id=>id!==activeToken.id)
    if(!burnIds.length){log('err','// Keine Tokens zum Burnen ausgewählt.');return}
    setBurning(true)
    log('inf','// Burn: #'+burnIds.join(',')+' → Receiver #'+activeToken.id)
    try{
      // Approve each burn token individually (safer than setApprovalForAll)
      for(let i=0;i<burnIds.length;i++){
        const tokenId=burnIds[i]
        log('inf','// ['+(i+1)+'/'+burnIds.length+'] approve #'+tokenId+' → confirm in wallet')
        const approveData=encodeFunctionData({abi:ERC721_ABI,functionName:'approve',args:[CANVAS_ADDRESS,BigInt(tokenId)]})
        const approveHash=await sendTx(BITFAUNA_ADDRESS,approveData)
        log('inf','// Approval TX: '+approveHash.slice(0,10)+'... warte...')
        await pollForReceipt(approveHash)
        log('ok','// #'+tokenId+' approved.')
      }

      // commitBurn
      log('inf','// commitBurn → confirm in wallet')
      const burnData=encodeFunctionData({
        abi:CANVAS_ABI,
        functionName:'commitBurn',
        args:[burnIds.map(BigInt),BigInt(activeToken.id)],
      })
      const burnHash=await sendTx(CANVAS_ADDRESS,burnData)
      log('ok','// Burn TX: '+burnHash.slice(0,12)+'...')
      log('inf','// Committed! Nach 5+ Blocks: revealBurn für AP.')
      setShowBurn(false)
      setBurnSel(new Set())
      setOwnedNFTs(prev=>prev.filter(n=>!burnIds.includes(n.id)))
      if(address) loadPendingCommits(address)
    }catch(e:any){
      const msg:string=e.message??String(e)
      if(msg.includes('rejected')||msg.includes('denied')||msg.includes('4001')){
        log('err','// Abgebrochen.')
      }else{
        log('err','// Fehler: '+msg.slice(0,120))
      }
    }finally{setBurning(false)}
  }

  async function doReveal(commitId:number){
    setRevealing(commitId)
    try{
      const data=encodeFunctionData({abi:CANVAS_ABI,functionName:'revealBurn',args:[BigInt(commitId)]})
      const hash=await sendTx(CANVAS_ADDRESS,data)
      log('ok','// RevealBurn TX: '+hash.slice(0,12)+'...')
      await pollForReceipt(hash)
      log('ok','// AP credited!')
      if(address) loadPendingCommits(address)
      // Reload AP for the active token if its id matches the commit's receiver
      const commit=pendingCommits.find(c=>c.commitId===commitId)
      if(activeToken&&commit&&activeToken.id===commit.receiverTokenId){
        try{
          const apResult=await rpcCall(CANVAS_ADDRESS,'0x5c5c3021'+activeToken.id.toString(16).padStart(64,'0'))
          const ap=parseInt(apResult.slice(2),16)
          if(!isNaN(ap)&&ap>=0){setBudgetMax(ap);log('inf','// Neues Budget: '+ap+' AP')}
        }catch{}
      }
    }catch(e:any){
      const msg:string=e.message??String(e)
      if(msg.includes('rejected')||msg.includes('denied')||msg.includes('4001')){log('err','// Abgebrochen.')}
      else{log('err','// Reveal failed: '+msg.slice(0,100))}
    }finally{setRevealing(null)}
  }

  function doExport(){let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" shape-rendering="crispEdges">`;for(let i=0;i<TOTAL;i++)svg+=`<rect x="${(i%40)*10}" y="${(i/40|0)*10}" width="10" height="10" fill="${PAL[pixels[i]]}"/>`;svg+='</svg>';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));a.download='bitfauna.svg';a.click();log('inf','// Exported.')}

  const bp=budgetMax>0?Math.min(budgetUsed/budgetMax*100,100):0

  return(<>
    <div className="canvas-page">
      <div className="panel-l">
        <div className="panel-head"><span><span className="live-dot"/>BITFAUNA CANVAS 40x40</span><span>{editCount} edits</span></div>
        <div ref={wrapRef} className="canvas-wrap" style={{touchAction:'none'}}
          onMouseDown={e=>{
            if(!refLockedRef.current&&refImageRef.current){
              isPanningRef.current=true
              const r=mc.current!.getBoundingClientRect()
              panStartRef.current={x:(e.clientX-r.left)/r.width*560,y:(e.clientY-r.top)/r.height*560}
              panRefOriginRef.current={x:refTransformRef.current.x,y:refTransformRef.current.y}
              return
            }
            if(!activeToken)return;setIsDown(true);const{x,y,ok}=coords(e);if(!ok)return;if(tool==='brush')paint(x,y);else shapeStartRef.current={x,y}
          }}
          onMouseMove={e=>{
            if(!refLockedRef.current&&refImageRef.current){
              if(isPanningRef.current){
                const r=mc.current!.getBoundingClientRect()
                const cx=(e.clientX-r.left)/r.width*560,cy=(e.clientY-r.top)/r.height*560
                refTransformRef.current={...refTransformRef.current,x:panRefOriginRef.current.x+(cx-panStartRef.current.x),y:panRefOriginRef.current.y+(cy-panStartRef.current.y)}
                renderRefCanvas()
              }
              return
            }
            const{x,y,ok}=coords(e);if(ok)setCur({x,y});if(!activeToken)return;if(tool==='brush'){if(isDown&&ok)paint(x,y)}else if(isDown&&ok&&shapeStartRef.current){const s=shapeStartRef.current;drawShapePreview(s.x,s.y,Math.sqrt((x-s.x)**2+(y-s.y)**2))}
          }}
          onMouseUp={e=>{
            if(!refLockedRef.current&&refImageRef.current){isPanningRef.current=false;return}
            setIsDown(false);if(tool!=='brush'&&shapeStartRef.current){const{x,y,ok}=coords(e);if(ok){const s=shapeStartRef.current;paintShape(s.x,s.y,Math.sqrt((x-s.x)**2+(y-s.y)**2))}clearPreview();shapeStartRef.current=null}
          }}
          onMouseLeave={()=>{isPanningRef.current=false;setIsDown(false);if(tool!=='brush'&&shapeStartRef.current){clearPreview();shapeStartRef.current=null}}}
          onContextMenu={e=>e.preventDefault()}
          onTouchStart={e=>{
            e.preventDefault()
            if(!refLockedRef.current&&refImageRef.current){
              lastTouchDistRef.current=null
              if(e.touches.length===1){
                isPanningRef.current=true
                const t=e.touches[0],r=mc.current!.getBoundingClientRect()
                panStartRef.current={x:(t.clientX-r.left)/r.width*560,y:(t.clientY-r.top)/r.height*560}
                panRefOriginRef.current={x:refTransformRef.current.x,y:refTransformRef.current.y}
              }else if(e.touches.length===2){
                isPanningRef.current=false
                const t0=e.touches[0],t1=e.touches[1],r=mc.current!.getBoundingClientRect()
                lastTouchDistRef.current=Math.hypot(t1.clientX-t0.clientX,t1.clientY-t0.clientY)
                lastTouchMidRef.current={x:((t0.clientX+t1.clientX)/2-r.left)/r.width*560,y:((t0.clientY+t1.clientY)/2-r.top)/r.height*560}
              }
              return
            }
            if(!activeToken)return;setIsDown(true);const t=e.touches[0];const{x,y,ok}=coordsFromClient(t.clientX,t.clientY);if(!ok)return;if(tool==='brush')paint(x,y);else shapeStartRef.current={x,y}
          }}
          onTouchMove={e=>{
            e.preventDefault()
            if(!refLockedRef.current&&refImageRef.current){
              const r=mc.current!.getBoundingClientRect()
              if(e.touches.length===1&&isPanningRef.current){
                const t=e.touches[0]
                const cx=(t.clientX-r.left)/r.width*560,cy=(t.clientY-r.top)/r.height*560
                refTransformRef.current={...refTransformRef.current,x:panRefOriginRef.current.x+(cx-panStartRef.current.x),y:panRefOriginRef.current.y+(cy-panStartRef.current.y)}
                renderRefCanvas()
              }else if(e.touches.length===2){
                const t0=e.touches[0],t1=e.touches[1]
                const dist=Math.hypot(t1.clientX-t0.clientX,t1.clientY-t0.clientY)
                const midX=((t0.clientX+t1.clientX)/2-r.left)/r.width*560,midY=((t0.clientY+t1.clientY)/2-r.top)/r.height*560
                if(lastTouchDistRef.current!==null){
                  const factor=dist/lastTouchDistRef.current
                  const tr=refTransformRef.current
                  const nx=tr.x+(midX-lastTouchMidRef.current.x),ny=tr.y+(midY-lastTouchMidRef.current.y)
                  const ns=Math.min(Math.max(tr.scale*factor,0.03),30),ratio=ns/tr.scale
                  refTransformRef.current={x:midX-ratio*(midX-nx),y:midY-ratio*(midY-ny),scale:ns}
                  renderRefCanvas()
                }
                lastTouchDistRef.current=dist;lastTouchMidRef.current={x:midX,y:midY}
              }
              return
            }
            const t=e.touches[0];const{x,y,ok}=coordsFromClient(t.clientX,t.clientY);if(ok)setCur({x,y});if(!activeToken||!ok)return;if(tool==='brush'){if(isDown)paint(x,y)}else if(shapeStartRef.current){const s=shapeStartRef.current;drawShapePreview(s.x,s.y,Math.sqrt((x-s.x)**2+(y-s.y)**2))}
          }}
          onTouchEnd={e=>{
            e.preventDefault()
            if(!refLockedRef.current&&refImageRef.current){
              if(e.touches.length===0){isPanningRef.current=false;lastTouchDistRef.current=null}
              else if(e.touches.length===1){
                lastTouchDistRef.current=null;isPanningRef.current=true
                const t=e.touches[0],r=mc.current!.getBoundingClientRect()
                panStartRef.current={x:(t.clientX-r.left)/r.width*560,y:(t.clientY-r.top)/r.height*560}
                panRefOriginRef.current={x:refTransformRef.current.x,y:refTransformRef.current.y}
              }
              return
            }
            setIsDown(false);if(tool!=='brush'&&shapeStartRef.current){const t=e.changedTouches[0];const{x,y,ok}=coordsFromClient(t.clientX,t.clientY);if(ok){const s=shapeStartRef.current;paintShape(s.x,s.y,Math.sqrt((x-s.x)**2+(y-s.y)**2))}clearPreview();shapeStartRef.current=null}
          }}
        >
          <canvas ref={mc} width={40} height={40} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:1,imageRendering:'pixelated'}}/>
          <canvas ref={rc} width={560} height={560} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:2,pointerEvents:'none',imageRendering:'pixelated',opacity:refOpacity/100,display:hasRef?'block':'none'}}/>
          <canvas ref={gc} width={560} height={560} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:3,pointerEvents:'none'}}/>
          <canvas ref={pv} width={560} height={560} style={{position:'absolute',top:0,left:0,width:560,height:560,zIndex:4,pointerEvents:'none'}}/>
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
          <button className="btn" style={{width:'100%',color:'var(--blue)',borderColor:'var(--blue)'}} disabled={!activeToken} onClick={()=>{setBurnSel(new Set());setShowBurn(true)}}>[Burn to Get Pixels]</button>
          <p style={{fontSize:10,color:'var(--w)',marginTop:10,lineHeight:1.7}}>Burn another Bitfauna to get its pixel count as budget.</p>
        </div>
        {pendingCommits.length>0&&<div className="tool-sec">
          <span className="tool-title">Pending Burns</span>
          {pendingCommits.map(pc=>{
            const REVEAL_DELAY=5
            const commitBlock=pc.revealBlock-REVEAL_DELAY
            const ready=blockNumber>0&&blockNumber>=pc.revealBlock
            const blocksLeft=Math.max(pc.revealBlock-blockNumber,0)
            const progress=blockNumber>0?Math.min(Math.max((blockNumber-commitBlock)/REVEAL_DELAY,0),1):0
            return<div key={pc.commitId} style={{marginBottom:14,fontSize:11}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{color:'var(--w)',marginBottom:2}}>Commit #{pc.commitId} → Recv #{pc.receiverTokenId}</div>
                  <div style={{color:ready?'var(--blue)':'var(--w)'}}>{ready?'✓ Ready to reveal':'Waiting: '+blocksLeft+' block'+(blocksLeft===1?'':'s')}</div>
                </div>
                <button className="btn" style={{color:ready?'var(--blue)':'var(--w)',borderColor:ready?'var(--blue)':'var(--w)',fontSize:10,padding:'2px 8px',flexShrink:0}} disabled={!ready||revealing===pc.commitId} onClick={()=>doReveal(pc.commitId)}>{revealing===pc.commitId?'[...]':'[Reveal]'}</button>
              </div>
              <div style={{marginTop:6,height:4,borderRadius:2,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
                <div style={{height:'100%',width:(progress*100)+'%',background:ready?'var(--blue)':'#555',borderRadius:2,transition:'width 1s linear'}}/>
              </div>
              {!ready&&<div style={{color:'var(--w)',fontSize:9,marginTop:3,textAlign:'right'}}>~{Math.ceil(blocksLeft*12)}s remaining</div>}
            </div>
          })}
        </div>}
        <div className="tool-sec">
          <span className="tool-title">Paint</span>
          <div className="palette">{[{c:0,bg:'#FFFFFF',l:'White'},{c:1,bg:'#000000',l:'Black'},{c:2,bg:'#808080',l:'Gray'},{c:3,bg:'#0000FF',l:'Blue'}].map(s=><div key={s.c} className={'swatch'+(paintColor===s.c?' on':'')} onClick={()=>setPaintColor(s.c)}><div className="sw-box" style={{background:s.bg,borderColor:s.c===1?'#666':undefined}}/><span className="sw-lbl">{s.l}</span></div>)}</div>
          <div className="brush-row"><span className="brush-label">Tool:</span>{(['brush','circle','square'] as const).map(t=><button key={t} className={'brush-btn'+(tool===t?' on':'')} onClick={()=>{setTool(t);clearPreview();shapeStartRef.current=null}}>{t==='brush'?'Brush':t==='circle'?'○ Circle':'□ Square'}</button>)}</div>
          {tool==='brush'&&<div className="brush-row"><span className="brush-label">Size:</span>{[1,2,3].map(s=><button key={s} className={'brush-btn'+(brushSize===s?' on':'')} onClick={()=>setBrushSize(s)}>{s}px</button>)}</div>}
          {tool!=='brush'&&<div style={{fontSize:10,color:'var(--w)',marginTop:8,opacity:0.6}}>Click &amp; drag on canvas to resize shape</div>}
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
          <span className="tool-title">Reference Image</span>
          <label style={{display:'block',border:'1px dashed #2a2a2a',padding:'8px',textAlign:'center',cursor:'pointer',fontSize:10,color:'var(--dim)',letterSpacing:'0.08em'}} htmlFor="refInput">▲ LOAD IMAGE</label>
          <input type="file" id="refInput" accept="image/*" style={{display:'none'}} onChange={loadRef}/>
          {refFilename&&<div style={{fontSize:9,color:'var(--dim)',marginTop:4,wordBreak:'break-all'}}>{refFilename}</div>}
          <div style={{marginTop:8}}>
            <div style={{fontSize:9,color:'var(--dim)',display:'flex',justifyContent:'space-between',marginBottom:4,letterSpacing:'0.1em',textTransform:'uppercase'}}>
              <span>Opacity</span><span>{refOpacity}%</span>
            </div>
            <input type="range" min={0} max={100} value={refOpacity} onChange={e=>setRefOpacity(Number(e.target.value))} style={{width:'100%',accentColor:'var(--blue)'}}/>
          </div>
          <div style={{display:'flex',gap:6,marginTop:10}}>
            <button className={'brush-btn'+(refLocked?' on':'')} style={{flex:1}} onClick={()=>setRefLocked(true)}>Lock</button>
            <button className={'brush-btn'+(!refLocked?' on':'')} style={{flex:1}} onClick={()=>setRefLocked(false)}>Move Ref</button>
          </div>
          {!refLocked&&hasRef&&<div style={{fontSize:9,color:'var(--dim)',marginTop:6}}>Drag to pan · Scroll to zoom</div>}
        </div>
        <div className="tool-sec">
          <span className="tool-title">Composition</span>
          {['White','Black','Gray','Blue'].map((l,i)=><div key={i} className="meta-row"><span className="mk">{l}</span><span className={'mv'+(i===3?' blue':'')}>{pct(cc[i],TOTAL)}</span></div>)}
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
        <p style={{fontSize:11,color:'var(--w)',marginBottom:16,lineHeight:1.8}}>Select NFTs to burn. <span style={{color:'var(--blue)',fontWeight:700}}>Permanent.</span></p>
        {burnSel.size>0&&(()=>{const sel=ownedNFTs.filter(n=>burnSel.has(n.id));const totMin=sel.reduce((s,n)=>s+apRange(n.pixelCount)[0],0);const totMax=sel.reduce((s,n)=>s+apRange(n.pixelCount)[1],0);return<div style={{fontSize:12,color:'var(--blue)',marginBottom:14,fontWeight:700}}>{burnSel.size} selected · Expected AP: {totMin}–{totMax}</div>})()}
        <div className="nft-grid">{ownedNFTs.filter(n=>n.id!==activeToken?.id).length===0?<div className="nft-empty">No other Bitfauna.</div>:ownedNFTs.filter(n=>n.id!==activeToken?.id).map(n=>{const[apMin,apMax]=apRange(n.pixelCount);return<div key={n.id} className={'nft-card'+(burnSel.has(n.id)?' burn-selected':'')} onClick={()=>setBurnSel(p=>{const nx=new Set(p);nx.has(n.id)?nx.delete(n.id):nx.add(n.id);return nx})}><Thumb px={n.pixels} sz={80}/><div className="nft-card-id">#{n.id}</div><div className="nft-card-px" title={`${n.pixelCount} px trait`}>+{apMin}–{apMax} AP</div></div>})}</div>
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
