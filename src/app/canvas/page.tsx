import dynamic from 'next/dynamic'
const CanvasClient = dynamic(() => import('./CanvasClient'), { ssr: false })
export default function CanvasPage() { return <CanvasClient /> }
