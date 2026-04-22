'use client'

import { useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import SharedChatWidget from '@/components/SharedChatWidget'

type Tab = 'nuovi' | 'accettati' | 'rifiutati'

export default function GestioneCandidatiClient({ 
  candidatureIniziali = [], 
  posizioneId,
  associazioneId
}: { 
  candidatureIniziali?: any[], 
  posizioneId: string,
  associazioneId: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('nuovi')
  const [selectedCandidato, setSelectedCandidato] = useState<any>(null)
  
  const [candidature, setCandidature] = useState(Array.isArray(candidatureIniziali) ? candidatureIniziali : [])
  const [isUpdating, setIsUpdating] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const filtrate = candidature.filter((c: any) => {
    const stato = c?.stato || 'in_attesa'
    if (activeTab === 'nuovi') return stato === 'in_attesa' || stato === 'in_contatto'
    if (activeTab === 'accettati') return stato === 'accettato' || stato === 'accettata'
    return stato === 'rifiutato' || stato === 'rifiutata'
  })

  const getAvatar = (profilo: any) => {
    if (profilo?.foto_profilo_url) return profilo.foto_profilo_url
    if (profilo?.avatar_url) return profilo.avatar_url
    const nome = profilo?.nome || 'V'
    const cognome = profilo?.cognome || 'U'
    return `https://ui-avatars.com/api/?name=${nome}+${cognome}&background=10B981&color=fff`
  }

  const gestisciCandidatura = async (idCandidatura: string, nuovoStato: 'accettato' | 'rifiutato') => {
    setIsUpdating(true)
    
    try {
      const { data: candidaturaAggiornata, error } = await supabase
        .from('candidature')
        .update({ stato: nuovoStato })
        .eq('id', idCandidatura)
        .select('id, stato')
        .single()

      if (error) throw error
      if (!candidaturaAggiornata || candidaturaAggiornata.stato !== nuovoStato) {
        throw new Error('Aggiornamento candidatura non confermato.')
      }

      setCandidature((prev) => 
        prev.map((c) => c.id === idCandidatura ? { ...c, stato: nuovoStato } : c)
      )
      setSelectedCandidato(null)

    } catch (error) {
      console.error("Errore durante l'aggiornamento della candidatura:", error)
      alert("Si è verificato un errore di connessione. Riprova.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative rounded-[2rem] border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-[2rem] bg-gradient-to-b from-emerald-50/70 to-transparent" />

      {/* NAVIGAZIONE TAB */}
      <div className="relative mb-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm no-scrollbar sm:gap-3">
        {(['nuovi', 'accettati', 'rifiutati'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.24em] transition-all sm:flex-none sm:px-5 ${
              activeTab === t
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LISTA CANDIDATI */}
      <div className="relative grid gap-3 sm:gap-4">
        {filtrate.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500 sm:text-base">Nessun candidato in questa sezione.</p>
          </div>
        ) : (
          filtrate.map((cand: any) => {
            const profilo = cand?.volontario?.profili_volontari
            return (
              <button
                key={cand.id}
                onClick={() => setSelectedCandidato(cand)}
                className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/60 sm:p-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white bg-slate-100 shadow-md transition-transform group-hover:scale-[1.03] sm:h-16 sm:w-16">
                    <img 
                      src={getAvatar(profilo)} 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${profilo?.nome || 'V'}+${profilo?.cognome || 'U'}&background=10B981&color=fff`;
                      }}
                      className="w-full h-full object-cover" 
                      alt="Avatar" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-black text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
                      {profilo?.nome || 'Utente'} {profilo?.cognome || 'Sconosciuto'}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Candidato il {cand?.created_at ? new Date(cand.created_at).toLocaleDateString('it-IT') : ''}
                      </span>
                      {cand?.stato === 'in_contatto' && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">In contatto</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 shadow-sm transition-all group-hover:bg-emerald-600 group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* MODAL CANDIDATO */}
      {selectedCandidato && (
        <>
          {/* BACKDROP (Dietro il Modal) */}
<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9990] animate-in fade-in duration-300" />

{/* CONTENITORE MODAL */}
<div 
  className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
  onClick={() => setSelectedCandidato(null)}
>
            {/* CARD MODAL (Ferma la propagazione del click per non chiudersi se clicchi dentro) */}
            <div 
              className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[800px] animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-6">
                <button 
                  onClick={() => setSelectedCandidato(null)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => gestisciCandidatura(selectedCandidato.id, 'rifiutato')}
                    disabled={isUpdating}
                    className="hidden rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:block"
                  >
                    Rifiuta
                  </button>
                  <button 
                    onClick={() => gestisciCandidatura(selectedCandidato.id, 'accettato')}
                    disabled={isUpdating}
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
                  >
                    {isUpdating ? 'Salvataggio...' : 'Accetta'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-4 sm:p-8 custom-scrollbar">
                <div className="flex h-full flex-col gap-6">
                  {/* SCHEDA PROFILO */}
                  <div className="shrink-0 flex flex-col items-center gap-5 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 text-center shadow-sm md:flex-row md:items-start md:gap-8 md:text-left">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-white bg-slate-100 shadow-xl sm:h-32 sm:w-32">
                      <img 
                        src={getAvatar(selectedCandidato?.volontario?.profili_volontari)} 
                        onError={(e) => {
                            const p = selectedCandidato?.volontario?.profili_volontari;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${p?.nome || 'V'}+${p?.cognome || 'U'}&background=10B981&color=fff`;
                        }}
                        className="w-full h-full object-cover" 
                        alt="Avatar" 
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        {selectedCandidato?.volontario?.profili_volontari?.nome || 'Utente'} {selectedCandidato?.volontario?.profili_volontari?.cognome || ''}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base sm:leading-8">
                        {selectedCandidato?.volontario?.profili_volontari?.bio || 'Nessuna biografia inserita.'}
                      </p>
                    </div>
                  </div>

                  {/* CHAT CONTAINER */}
                  <div className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-inner sm:p-6">
                    <h4 className="mb-4 ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Chat Pre-Accettazione
                    </h4>
                    <SharedChatWidget candidaturaId={selectedCandidato.id} currentUserId={associazioneId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}