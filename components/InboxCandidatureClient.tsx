// src/components/InboxCandidatureClient.tsx
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'
import SharedChatWidget from '@/components/SharedChatWidget'

interface InboxProps {
  candidatureIniziali: any[];
  associazioneId: string;
  posizioniDisponibili?: { id: string; titolo: string }[];
}

export default function InboxCandidatureClient({ 
  candidatureIniziali, 
  associazioneId,
  posizioniDisponibili = [] 
}: InboxProps) {
  const searchParams = useSearchParams()
  const filtroUrl = searchParams.get('filterPosizione')

  const [candidature, setCandidature] = useState(candidatureIniziali)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filtroPosizione, setFiltroPosizione] = useState<string>('Tutte')
  const [isBioExpanded, setIsBioExpanded] = useState(false)

  // Inizializzazione stabile del client Supabase
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Sincronizzazione iniziale e reattiva del filtro da URL
  useEffect(() => {
    if (filtroUrl) {
      // Cerca se l'ID passato corrisponde a un titolo noto
      const posTrovata = posizioniDisponibili.find(p => p.id === filtroUrl)
      if (posTrovata) {
        setFiltroPosizione(posTrovata.titolo)
      } else {
        // Fallback: cerca nelle candidature
        const candTrovata = candidature.find(c => c.posizioni?.id === filtroUrl)
        if (candTrovata && candTrovata.posizioni?.titolo) {
          setFiltroPosizione(candTrovata.posizioni.titolo)
        }
      }
    }
  }, [filtroUrl, posizioniDisponibili, candidature])

  // 1. MENU A TENDINA: Combina posizioni uniche ordinate
  const posizioniUniche = useMemo(() => {
    const titoliDaCandidature = candidature.map(c => c.posizioni?.titolo).filter(Boolean) as string[]
    const titoliDaProp = posizioniDisponibili.map(p => p.titolo).filter(Boolean)
    return Array.from(new Set([...titoliDaCandidature, ...titoliDaProp])).sort()
  }, [candidature, posizioniDisponibili])

  // 2. FILTRAGGIO OTTIMIZZATO
  const filtrate = useMemo(() => {
    return candidature.filter(c => {
      if (filtroPosizione === 'Tutte') return true
      return c.posizioni?.titolo === filtroPosizione
    })
  }, [candidature, filtroPosizione])

  // Dettagli Selezione Corrente
  const selectedCandidatura = useMemo(() => {
    return candidature.find(c => c.id === selectedId)
  }, [candidature, selectedId])

  const profilo = selectedCandidatura?.volontario?.profili_volontari

  // Reset espansione bio quando si cambia chat
  useEffect(() => {
    setIsBioExpanded(false)
  }, [selectedId])

  // Helper per le immagini profilo
  const getAvatar = useCallback((p: any) => {
    if (p?.foto_profilo_url) return p.foto_profilo_url
    if (p?.avatar_url) return p.avatar_url
    const nome = p?.nome || 'V'
    const cognome = p?.cognome || 'U'
    return `https://ui-avatars.com/api/?name=${nome}+${cognome}&background=0F172A&color=fff`
  }, [])

  // Gestione stato della singola candidatura
  const gestisciCandidatura = async (idCandidatura: string, nuovoStato: 'accettato' | 'rifiutato') => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('candidature')
        .update({ stato: nuovoStato })
        .eq('id', idCandidatura)

      if (error) throw error

      setCandidature(prev => prev.map(c => c.id === idCandidatura ? { ...c, stato: nuovoStato } : c))
    } catch (error) {
      console.error("Errore aggiornamento:", error)
      alert("Errore operativo durante l'aggiornamento dello stato.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Design raffinato per i badge di stato
  const getBadgeStato = useCallback((stato: string) => {
    switch (stato) {
      case 'accettato':
      case 'accettata': 
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200/60">Inserito</span>
      case 'rifiutato':
      case 'rifiutata': 
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-200/60">Archiviato</span>
      case 'in_contatto': 
        return <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-sky-200/60">In Valutazione</span>
      default: 
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200/60">Nuovo</span>
    }
  }, [])

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-white border-t border-slate-200 lg:border-none lg:rounded-[2rem] lg:shadow-sm lg:border lg:border-slate-200/60">
      
      {/* ========================================= */}
      {/* SINISTRA: MASTER LIST (Inbox)             */}
      {/* ========================================= */}
      <div className={`flex flex-col h-full border-r border-slate-100 transition-all duration-200 shrink-0 ${selectedId ? 'hidden lg:flex lg:w-[36%]' : 'flex w-full lg:w-[36%]'}`}>
        
        {/* Header Interattivo Lista */}
        <div className="shrink-0 p-4 border-b border-slate-100 bg-white flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Candidature
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {filtrate.length}
            </span>
          </div>
          
          <select 
            value={filtroPosizione}
            onChange={(e) => {
              setFiltroPosizione(e.target.value)
              setSelectedId(null)
            }}
            className="w-full bg-slate-50 border border-slate-200/60 hover:border-slate-300 text-slate-800 font-bold text-xs rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-900 transition-all"
          >
            <option value="Tutte">Tutti gli annunci attivi</option>
            {posizioniUniche.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Lista dei Volontari */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {filtrate.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-slate-400 font-medium text-xs">Nessun candidato in questa vista.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtrate.map(cand => {
                const isSelected = selectedId === cand.id
                const p = cand.volontario?.profili_volontari
                return (
                  <button
                    type="button"
                    key={cand.id}
                    onClick={() => setSelectedId(cand.id)}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 relative group ${
                      isSelected ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Indicatore di selezione Premium (Morbido) */}
                    {isSelected && (
                      <div className="absolute left-1 top-4 bottom-4 w-1 bg-slate-900 rounded-full" />
                    )}

                    {/* Avatar */}
                    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60 ml-1">
                      <img 
                        src={getAvatar(p)} 
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${p?.nome || 'V'}+${p?.cognome || 'U'}&background=0F172A&color=fff` }}
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    {/* Dati Brevi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className="font-bold text-slate-900 truncate pr-2 text-sm group-hover:text-emerald-700 transition-colors">
                          {p?.nome || 'Utente'} {p?.cognome || ''}
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {new Date(cand.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate mb-2.5">
                        {cand.posizioni?.titolo}
                      </p>
                      <div className="flex items-center justify-between">
                        {getBadgeStato(cand.stato)}
                        {/* Micro indicatore visivo di apertura */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-600' : 'opacity-0 group-hover:opacity-100'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* DESTRA: DETAIL VIEW (Profilo + Chat)      */}
      {/* ========================================= */}
      <div className={`flex flex-col flex-1 min-w-0 h-full bg-white relative transition-all duration-200 ${selectedId ? 'flex w-full lg:w-auto' : 'hidden lg:flex lg:w-auto'}`}>
        
        {!selectedCandidatura ? (
          // Empty State Dettaglio Asciutto
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-12 h-12 mb-3 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">Nessun profilo selezionato</h3>
            <p className="text-slate-400 font-medium mt-0.5 text-xs">
              Seleziona una richiesta dalla lista per visualizzare i messaggi.
            </p>
          </div>
        ) : (
          <>
            {/* Header Dettaglio Funzionale */}
            <div className="shrink-0 bg-white border-b border-slate-100 p-3.5 sm:p-4 z-20 flex flex-col gap-3">
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button 
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-900 shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </button>
                  
                  <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60">
                     <img src={getAvatar(profilo)} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {profilo?.nome} {profilo?.cognome}
                      </h3>
                      {/* Bottone Toggle Bio Pieghevole */}
                      <button 
                        type="button"
                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${isBioExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title="Visualizza note e bio del volontario"
                      >
                        <span>Bio</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-2.5 h-2.5 transition-transform ${isBioExpanded ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                      {selectedCandidatura.posizioni?.titolo}
                    </p>
                  </div>
                </div>

                {/* Controlli di Stato / Pipeline Operativa */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedCandidatura.stato === 'in_attesa' || selectedCandidatura.stato === 'in_contatto' ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => gestisciCandidatura(selectedCandidatura.id, 'rifiutato')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                      >
                        Archivia
                      </button>
                      <button 
                        type="button"
                        onClick={() => gestisciCandidatura(selectedCandidatura.id, 'accettato')}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isUpdating ? '...' : 'Inserisci'}
                      </button>
                    </>
                  ) : (
                    <div className="shrink-0">
                      {getBadgeStato(selectedCandidatura.stato)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Collassabile a Scomparsa (Fluida) */}
              {isBioExpanded && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                  <span className="font-bold text-slate-700 block mb-0.5">Nota di presentazione:</span>
                  {profilo?.bio || "Nessuna nota biografica inserita dal candidato per questa richiesta."}
                </div>
              )}

            </div>

            {/* 💬 CHAT WRAPPER: Pulito e a tutto schermo */}
            <div className="flex-1 min-h-0 flex flex-col bg-white">
              <SharedChatWidget 
                candidaturaId={selectedCandidatura.id} 
                currentUserId={associazioneId} 
              />
            </div>
          </>
        )}
      </div>

    </div>
  )
}