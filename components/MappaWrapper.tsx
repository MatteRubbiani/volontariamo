'use client'

import dynamic from 'next/dynamic'

// Carichiamo la mappa VERA escludendola dal server
const MappaEsplora = dynamic(
  () => import('@/components/MappaEsplora'), 
  { 
    ssr: false, 
    loading: () => <div className="w-full h-[500px] bg-slate-100 animate-pulse rounded-[2rem] flex items-center justify-center font-bold text-slate-400">Caricamento Mappa...</div> 
  }
)

export default function MappaWrapper(props: any) {
  return <MappaEsplora {...props} />
}