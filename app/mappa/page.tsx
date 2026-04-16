import { Suspense } from 'react'
import VistaEsplora from '@/components/VistaEsplora'

// 🚨 DIRETTIVE PER IL DEPLOY (Vercel le adora)
export const runtime = 'nodejs' 
export const dynamic = 'force-dynamic'

export default function VolontarioDashboard() {
  return (
    <div className="bg-white w-full h-[calc(100vh-70px)] overflow-hidden">
      
      {/* Avvolgiamo VistaEsplora in un confine di Suspense. 
          Questo risolve l'errore "useSearchParams() should be wrapped in a suspense boundary"
      */}
      <Suspense fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">
            Caricamento Mappa...
          </p>
        </div>
      }>
        <VistaEsplora />
      </Suspense>

    </div>
  )
}