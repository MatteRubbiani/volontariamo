'use client'

import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, ServerCog, ShieldCheck } from 'lucide-react'

export function WorkspaceTransitionOverlay() {
  const { workspace } = useWorkspace()
  const [isActive, setIsActive] = useState(false)
  const [step, setStep] = useState(0)
  const prevWorkspace = useRef(workspace)

  useEffect(() => {
    // Se c'è un cambio effettivo di workspace...
    if (prevWorkspace.current && prevWorkspace.current !== workspace) {
      setIsActive(true)
      setStep(0)

      // Creiamo una sequenza di "finti" task di sistema più lenta per dare feedback visivo
      const t1 = setTimeout(() => setStep(1), 750)  // Primo cambio dopo 0.75s
      const t2 = setTimeout(() => setStep(2), 1500) // Secondo cambio dopo 1.5s
      const t3 = setTimeout(() => setStep(3), 2250) // Terzo cambio dopo 2.25s

      // Chiusura totale dopo 3 secondi (coordinato con tailwind.config.ts)
      const t4 = setTimeout(() => {
        setIsActive(false)
        setStep(0)
      }, 3000)

      prevWorkspace.current = workspace
      
      // Pulizia dei timer
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
    prevWorkspace.current = workspace
  }, [workspace])

  if (!isActive) return null

  const isAziendale = workspace === 'aziendale'

  // I testi che si alterneranno durante il caricamento (Azienda vs Privato)
  const stepsTextAziendale = [
    "Inizializzazione ambiente protetto...",
    "Verifica credenziali ESG...",
    "Sincronizzazione dati aziendali...",
    "Accesso verificato."
  ]

  const stepsTextPrivato = [
    "Chiusura sessione crittografata...",
    "Rimozione policy aziendali...",
    "Caricamento profilo personale...",
    "Ritorno alla modalità standard."
  ]

  const texts = isAziendale ? stepsTextAziendale : stepsTextPrivato

  return (
    // Contenitore fisso con z-index astronomico [9999] e blocco dei click, con animazione opaca prolungata
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center animate-overlay-fade overflow-hidden">
      
      {/* Sfondo oscurante COMPLETAMENTE OPACO DURANTE IL PICCO */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isAziendale ? 'bg-slate-950' : 'bg-white'
      }`} />

      {/* Modal Centrale stile Terminale/Dashboard */}
      <div className={`relative flex flex-col items-center w-[340px] p-8 rounded-3xl shadow-2xl border backdrop-blur-xl ${
        isAziendale ? 'bg-slate-900/90 border-violet-500/30' : 'bg-white/90 border-slate-200'
      }`}>
        
        {/* Intestazione */}
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className={`w-4 h-4 ${isAziendale ? 'text-violet-400' : 'text-blue-500'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isAziendale ? 'text-slate-400' : 'text-slate-500'}`}>
            Security Context
          </span>
        </div>

        {/* Icona Animata (Ingranaggio che diventa Spunta) */}
        <div className={`mb-6 p-4 rounded-full ${
          isAziendale ? 'bg-violet-500/10 text-violet-400' : 'bg-blue-500/10 text-blue-500'
        }`}>
          {step < 3 ? (
            <ServerCog className="w-12 h-12 animate-spin-slow" />
          ) : (
            <CheckCircle2 className="w-12 h-12 animate-in zoom-in duration-300 text-emerald-500" />
          )}
        </div>

        {/* Testo Dinamico (Cambia ogni 750ms) */}
        <div className="h-10 flex items-center justify-center text-center w-full">
          <p className={`text-sm font-bold transition-opacity duration-300 ${
            step === 3 ? 'opacity-100 text-emerald-500' : 'opacity-80 animate-pulse'
          } ${isAziendale && step < 3 ? 'text-slate-200' : ''} ${!isAziendale && step < 3 ? 'text-slate-700' : ''}`}>
            {texts[step]}
          </p>
        </div>

        {/* Barra di Progresso Reale (coordinata con la durata opaca) */}
        <div className={`w-full h-1.5 mt-6 rounded-full overflow-hidden ${
          isAziendale ? 'bg-slate-800' : 'bg-slate-200'
        }`}>
          <div className={`h-full rounded-full animate-progress-fill ${
            isAziendale ? 'bg-violet-500' : 'bg-blue-500'
          }`} />
        </div>
        
      </div>
    </div>
  )
}