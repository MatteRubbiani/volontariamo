'use client'

import { useRouter } from 'next/navigation'

export default function TastoIndietro() {
  const router = useRouter()

  const handleBack = () => {
    // Se c'è uno storico di navigazione torna indietro preservando filtri e mappa, altrimenti va a /esplora
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/esplora')
    }
  }

  return (
    <button 
      type="button"
      onClick={handleBack}
      className="inline-flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-md text-slate-900 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border border-slate-200/60"
      aria-label="Torna indietro"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
  )
}