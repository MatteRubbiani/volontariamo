'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function RoleSelectionContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  const getHref = (role: string) => {
    const base = `/app/onboarding/${role}`
    return redirectTo ? `${base}?redirectTo=${encodeURIComponent(redirectTo)}` : base
  }

  const ruoli = [
    {
      id: 'volontario',
      titolo: 'Voglio fare volontariato',
      sottotitolo: 'Per i Cittadini',
      descrizione: 'Esplora le opportunità vicino a te, metti in gioco le tue competenze e sostieni le cause che ami.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-900">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'associazione',
      titolo: 'Siamo un ente o associazione',
      sottotitolo: 'Terzo Settore',
      descrizione: 'Pubblica opportunità, gestisci i volontari con un pannello dedicato e fai crescere il tuo impatto.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-900">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21 Im-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'impresa',
      titolo: 'Siamo un’azienda (ESG)',
      sottotitolo: 'Disponibile a breve',
      descrizione: 'Coinvolgi i dipendenti in attività di volontariato aziendale e traccia l’impatto per i bilanci di sostenibilità.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      ),
      disabled: true
    }
  ]

  return (
    // 🟢 Sottraiamo l'altezza esatta della navbar (76px) e forziamo la centratura flex senza scrollbar orizzontali/verticali
    <main className="h-[calc(100dvh-76px)] w-full bg-white px-6 flex flex-col justify-center items-center overflow-y-auto font-sans antialiased selection:bg-slate-100">
      <div className="max-w-[1040px] w-full flex flex-col items-center py-8 md:py-0">
        
        {/* TITOLO PERFETTAMENTE BILANCIATO AL CENTRO */}
        <div className="text-center max-w-xl mb-12 md:mb-14 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <h1 className="text-3xl md:text-[2.5rem] font-semibold tracking-tight text-slate-950 leading-tight">
            Come vuoi usare Volontariando?
          </h1>
          <p className="text-base text-slate-500 font-normal">
            Scegli la tua tipologia di profilo per iniziare. Potrai cambiare o aggiungere ruoli in ogni momento dal tuo pannello.
          </p>
        </div>

        {/* CONTENITORE SCHEDE */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-3 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)]">
          {ruoli.map((r) => {
            if (r.disabled) {
              return (
                <div 
                  key={r.id} 
                  className="group relative flex flex-col justify-between bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 opacity-50 cursor-not-allowed select-none transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="text-slate-400">
                      {r.icona}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium tracking-wide text-slate-400 block">
                        {r.sottotitolo}
                      </span>
                      <h2 className="text-xl font-medium text-slate-400">
                        {r.titolo}
                      </h2>
                      <p className="text-sm text-slate-400 font-normal leading-relaxed pt-1">
                        {r.descrizione}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Link 
                key={r.id} 
                href={getHref(r.id)}
                className="group relative flex flex-col justify-between bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-300 active:scale-[0.99]"
              >
                <div className="space-y-6">
                  <div className="text-slate-900 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    {r.icona}
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold tracking-wide text-slate-400 block group-hover:text-slate-500 transition-colors">
                      {r.sottotitolo}
                    </span>
                    <h2 className="text-xl font-medium text-slate-950">
                      {r.titolo}
                    </h2>
                    <p className="text-sm text-slate-500 font-normal leading-relaxed pt-1 group-hover:text-slate-600 transition-colors">
                      {r.descrizione}
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span className="underline underline-offset-4 decoration-slate-200 group-hover:decoration-slate-900 transition-colors">Scegli questo ruolo</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </main>
  )
}

export default function OnboardingLandingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100dvh-76px)] w-full items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RoleSelectionContent />
    </Suspense>
  )
}