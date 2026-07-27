'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { User, Building2, Briefcase, ArrowRight, Sparkles } from 'lucide-react'

function RoleSelectionContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const claimId = searchParams.get('claim_id')

  // Costruisce l'URL di destinazione preservando parametri critici come claim_id
  const getHref = (role: string) => {
    const base = `/app/onboarding/${role}`
    if (redirectTo) {
      return `${base}?redirectTo=${encodeURIComponent(redirectTo)}`
    }
    if (role === 'associazione' && claimId) {
      return `${base}?claim_id=${encodeURIComponent(claimId)}`
    }
    return base
  }

  const ruoli = [
    {
      id: 'volontario',
      titolo: 'Voglio fare volontariato',
      sottotitolo: 'Per i Cittadini',
      descrizione: 'Esplora le opportunità vicino a te, metti in gioco le tue competenze e sostieni le cause che ami.',
      icona: <User className="w-6 h-6" />,
      disabled: false,
      badge: null
    },
    {
      id: 'associazione',
      titolo: 'Siamo un ente o associazione',
      sottotitolo: 'Terzo Settore',
      descrizione: 'Pubblica opportunità, gestisci i volontari con un pannello dedicato e fai crescere il tuo impatto.',
      icona: <Building2 className="w-6 h-6" />,
      disabled: false,
      badge: claimId ? 'Scheda da rivendicare' : null
    },
    {
      id: 'impresa',
      titolo: 'Siamo un’azienda (ESG)',
      sottotitolo: 'Disponibile a breve',
      descrizione: 'Coinvolgi i dipendenti in attività di volontariato aziendale e traccia l’impatto per i bilanci di sostenibilità.',
      icona: <Briefcase className="w-6 h-6" />,
      disabled: true,
      badge: 'In arrivo'
    }
  ]

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] w-full bg-slate-50/50 px-4 sm:px-6 pt-6 md:pt-12 pb-28 md:pb-12 flex flex-col justify-center items-center overflow-y-auto font-sans antialiased selection:bg-slate-100">
      <div className="max-w-[1040px] w-full flex flex-col items-center">
        
        {/* TITOLO PRINCIPALE */}
        <div className="text-center max-w-xl mb-8 md:mb-12 space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-bold tracking-tight text-slate-950 leading-tight">
            Come vuoi usare Volontariando?
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed px-2">
            Scegli la tua tipologia di profilo per iniziare. Potrai cambiare o aggiungere ruoli in ogni momento dal tuo pannello.
          </p>
        </div>

        {/* CONTENITORE SCHEDE */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-3 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)]">
          {ruoli.map((r) => {
            if (r.disabled) {
              return (
                <div 
                  key={r.id} 
                  className="relative flex flex-col justify-between bg-slate-100/60 p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 opacity-60 cursor-not-allowed select-none transition-all duration-300"
                >
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200/60 flex items-center justify-center text-slate-400">
                      {r.icona}
                    </div>
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 tracking-wide uppercase">
                        {r.badge || r.sottotitolo}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-500 pt-1">
                        {r.titolo}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
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
                className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                  r.badge 
                    ? 'bg-white border-emerald-500/80 shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.18)] hover:border-emerald-600'
                    : 'bg-white border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-slate-300'
                }`}
              >
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all duration-300">
                    {r.icona}
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors ${
                      r.badge 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      {r.badge && <Sparkles className="w-3 h-3 text-emerald-600" />}
                      <span>{r.badge || r.sottotitolo}</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-950 pt-1">
                      {r.titolo}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed group-hover:text-slate-600 transition-colors">
                      {r.descrizione}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className={r.badge ? 'text-emerald-700 font-bold' : 'group-hover:text-emerald-700 transition-colors'}>
                    {r.badge ? 'Rivendica ora' : 'Scegli questo ruolo'}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    r.badge 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
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
      <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center bg-slate-50/50">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RoleSelectionContent />
    </Suspense>
  )
}