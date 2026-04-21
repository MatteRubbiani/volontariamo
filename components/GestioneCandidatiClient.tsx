'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Tab = 'nuovi' | 'accettati' | 'rifiutati'

export default function GestioneCandidatiClient({ 
  candidatureIniziali = [], 
  posizioneId 
}: { 
  candidatureIniziali?: any[], 
  posizioneId: string 
}) {
  const [activeTab, setActiveTab] = useState<Tab>('nuovi')
  const [selectedCandidato, setSelectedCandidato] = useState<any>(null)
  const [candidature, setCandidature] = useState(Array.isArray(candidatureIniziali) ? candidatureIniziali : [])
  const [isUpdating, setIsUpdating] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const filtrate = candidature.filter((c: any) => {
    const stato = c?.stato || 'in_attesa'
    if (activeTab === 'nuovi') return stato === 'in_attesa' || stato === 'in_contatto'
    if (activeTab === 'accettati') return stato === 'accettato'
    return stato === 'rifiutato'
  })

  const getAvatar = (profilo: any) => {
    if (profilo?.foto_profilo_url) return profilo.foto_profilo_url
    const nome = profilo?.nome || 'V'
    const cognome = profilo?.cognome || 'U'
    return `https://ui-avatars.com/api/?name=${nome}+${cognome}&background=10B981&color=fff`
  }

  const gestisciCandidatura = async (idCandidatura: string, nuovoStato: 'accettato' | 'rifiutato') => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from('candidature').update({ stato: nuovoStato }).eq('id', idCandidatura)
      if (error) throw error
      setCandidature((prev) => prev.map((c) => c.id === idCandidatura ? { ...c, stato: nuovoStato } : c))
      setSelectedCandidato(null)
    } catch (error) {
      console.error("Errore:", error)
      alert("Errore, riprova.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative w-full">
      {/* NAVIGAZIONE TAB */}
      <div className="flex items-center gap-8 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
        {(['nuovi', 'accettati', 'rifiutati'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === t ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {t}
            {activeTab === t && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-full animate-in fade-in zoom-in-50 duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* LISTA CANDIDATI */}
      <div className="grid gap-4">
        {filtrate.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">Nessun candidato in questa sezione.</p>
          </div>
        ) : (
          filtrate.map((cand: any) => {
            const profilo = cand?.volontario?.profili_volontari
            return (
              <button
                key={cand.id}
                onClick={() => setSelectedCandidato(cand)}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:shadow-lg hover:border-emerald-100 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-md">
                    <img src={getAvatar(profilo)} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-emerald-600">
                      {profilo?.nome || 'Utente'} {profilo?.cognome || ''}
                    </h3>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* SLIDE-OVER PANNELLO (Z-INDEX 100) */}
      {selectedCandidato && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
            onClick={() => setSelectedCandidato(null)}
          />
          
          {/* Aggiunto 'pt-safe' o padding top se necessario */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[100] animate-in slide-in-from-right duration-500 flex flex-col">
            
            {/* Header Pannello - Professionale e sempre visibile */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-[101]">
              <button onClick={() => setSelectedCandidato(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => gestisciCandidatura(selectedCandidato.id, 'rifiutato')}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  Rifiuta
                </button>
                <button 
                  onClick={() => gestisciCandidatura(selectedCandidato.id, 'accettato')}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"
                >
                  {isUpdating ? '...' : 'Accetta'}
                </button>
              </div>
            </div>

            {/* Contenuto */}
            <div className="flex-1 overflow-y-auto p-6">
               {/* Contenuto profilo... */}
               <h2 className="text-2xl font-black">{selectedCandidato?.volontario?.profili_volontari?.nome}</h2>
               <p className="mt-4 text-slate-600">{selectedCandidato?.volontario?.profili_volontari?.bio || 'Nessuna bio.'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}