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
      titolo: 'Diventa Volontario',
      badge: 'Per i Cittadini',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      descrizione: 'Esplora le posizioni aperte, metti in gioco le tue competenze e crea un impatto reale ed immediato sul tuo territorio.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-sky-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      ),
      hoverColor: 'hover:border-sky-500 hover:ring-sky-500/10',
      disabled: false
    },
    {
      id: 'associazione',
      titolo: 'Ente / Associazione',
      badge: 'Terzo Settore',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      descrizione: 'Pubblica annunci, gestisci le candidature tramite un gestionale dedicato e trova talenti verificati per la tua missione.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-emerald-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      ),
      hoverColor: 'hover:border-emerald-500 hover:ring-emerald-500/10',
      disabled: false
    },
    {
      id: 'impresa',
      titolo: 'Azienda & ESG',
      badge: 'Disponibile a breve',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
      descrizione: 'Attiva percorsi di volontariato aziendale, coinvolgi i tuoi dipendenti e traccia il tuo impatto sociale per i bilanci di sostenibilità.',
      icona: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-purple-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.97 23.97 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
        </svg>
      ),
      hoverColor: '',
      disabled: true
    }
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl w-full">
        
        {/* HEADER INTRODUTTIVO MINIMAL */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Scegli il tuo percorso
          </h1>
        </div>

        {/* GRIGLIA CARDS SELEZIONE */}
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in zoom-in-95 duration-700">
          {ruoli.map((r) => {
            if (r.disabled) {
              return (
                <div 
                  key={r.id} 
                  className="group relative flex flex-col justify-between bg-white/60 p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm opacity-60 cursor-not-allowed select-none"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 shadow-inner">
                        {r.icona}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.badgeClass}`}>
                        {r.badge}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-500">
                      {r.titolo}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed">
                      {r.descrizione}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-300">
                    <span>Coming Soon</span>
                  </div>
                </div>
              )
            }

            return (
              <Link 
                key={r.id} 
                href={getHref(r.id)}
                className={`group relative flex flex-col justify-between bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-4 focus:outline-none ${r.hoverColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {r.icona}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.badgeClass}`}>
                      {r.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                    {r.titolo}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                    {r.descrizione}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                  <span>Inizia ora</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RoleSelectionContent />
    </Suspense>
  )
}