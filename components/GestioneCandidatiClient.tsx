'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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
  
  // 🚨 STATO LOCALE: Copiamo le candidature iniziali per poterle modificare all'istante
  const [candidature, setCandidature] = useState(Array.isArray(candidatureIniziali) ? candidatureIniziali : [])
  
  // Stato per il caricamento dei bottoni
  const [isUpdating, setIsUpdating] = useState(false)
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [testoMessaggio, setTestoMessaggio] = useState('')
  const [isLoadingMessaggi, setIsLoadingMessaggi] = useState(false)
  const [isSendingMessaggio, setIsSendingMessaggio] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Inizializziamo Supabase per il lato Client
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    if (!selectedCandidato?.id) {
      setMessaggi([])
      setTestoMessaggio('')
      setChatError(null)
      setIsLoadingMessaggi(false)
      return
    }

    let alive = true

    const caricaMessaggi = async () => {
      setIsLoadingMessaggi(true)
      setChatError(null)

      const { data, error } = await supabase
        .from('messaggi')
        .select('id, candidatura_id, mittente_id, testo, created_at')
        .eq('candidatura_id', selectedCandidato.id)
        .order('created_at', { ascending: true })

      if (!alive) return

      if (error) {
        console.error("Errore caricamento messaggi:", error)
        setChatError('Impossibile caricare la chat.')
        setMessaggi([])
      } else {
        setMessaggi(data || [])
      }

      setIsLoadingMessaggi(false)
    }

    caricaMessaggi()

    return () => {
      alive = false
    }
  }, [selectedCandidato?.id, supabase])

  useEffect(() => {
    if (!selectedCandidato?.id) return

    const channel = supabase
      .channel(`messaggi-candidatura-${selectedCandidato.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          filter: `candidatura_id=eq.${selectedCandidato.id}`
        },
        (payload) => {
          setMessaggi((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedCandidato?.id, supabase])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messaggi, selectedCandidato?.id])

  // Filtriamo sulla base dello STATO LOCALE (così si aggiorna subito)
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

  // 🚨 IL MOTORE: Funzione per Accettare o Rifiutare
  const gestisciCandidatura = async (idCandidatura: string, nuovoStato: 'accettato' | 'rifiutato') => {
    setIsUpdating(true)
    
    try {
      // 1. Aggiorniamo il database
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

      // 2. Magia Optimistic UI: Aggiorniamo la lista locale senza ricaricare la pagina
      setCandidature((prev) => 
        prev.map((c) => c.id === idCandidatura ? { ...c, stato: nuovoStato } : c)
      )

      // 3. Chiudiamo il pannello laterale
      setSelectedCandidato(null)

    } catch (error) {
      console.error("Errore durante l'aggiornamento della candidatura:", error)
      alert("Si è verificato un errore di connessione. Riprova.")
    } finally {
      setIsUpdating(false)
    }
  }

  const inviaMessaggio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidato?.id || !testoMessaggio.trim() || isSendingMessaggio) return

    const testoPulito = testoMessaggio.trim()
    const tempId = `temp-${Date.now()}`
    const messaggioTemporaneo = {
      id: tempId,
      candidatura_id: selectedCandidato.id,
      mittente_id: associazioneId,
      testo: testoPulito,
      created_at: new Date().toISOString()
    }

    setChatError(null)
    setTestoMessaggio('')
    setIsSendingMessaggio(true)
    setMessaggi((prev) => [...prev, messaggioTemporaneo])

    const { data, error } = await supabase
      .from('messaggi')
      .insert({
        candidatura_id: selectedCandidato.id,
        mittente_id: associazioneId,
        testo: testoPulito
      })
      .select('id, candidatura_id, mittente_id, testo, created_at')
      .single()

    if (error || !data) {
      console.error("Errore invio messaggio:", error)
      setMessaggi((prev) => prev.filter((m) => m.id !== tempId))
      setTestoMessaggio(testoPulito)
      setChatError('Invio non riuscito. Riprova.')
    } else {
      setMessaggi((prev) => {
        if (prev.some((m) => m.id === data.id)) {
          return prev.filter((m) => m.id !== tempId)
        }
        return prev.map((m) => (m.id === tempId ? data : m))
      })
    }

    setIsSendingMessaggio(false)
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
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]"
            onClick={() => setSelectedCandidato(null)}
          />

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                  {/* 🚨 AGGANCIAMO I BOTTONI */}
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

                  <div className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-inner sm:p-6">
                    <h4 className="mb-4 ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Chat Pre-Accettazione
                    </h4>
                    <div ref={chatScrollRef} className="mb-4 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 p-4 shadow-sm">
                      {isLoadingMessaggi ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                        </div>
                      ) : messaggi.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 italic">Inizia la conversazione...</p>
                        </div>
                      ) : (
                        messaggi.map((msg: any) => {
                          const isMio = msg.mittente_id === associazioneId
                          return (
                            <div key={msg.id} className={`flex ${isMio ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                isMio
                                  ? 'bg-emerald-600 text-white rounded-br-sm'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                              }`}>
                                <p className="leading-relaxed">{msg.testo}</p>
                                <p className={`mt-1 text-[10px] font-bold ${isMio ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                    <form onSubmit={inviaMessaggio} className="shrink-0 mt-auto">
                      {chatError && (
                        <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                          {chatError}
                        </p>
                      )}
                      <div className="relative">
                        <input 
                          type="text"
                          value={testoMessaggio}
                          onChange={(e) => setTestoMessaggio(e.target.value)}
                          placeholder="Scrivi un messaggio..."
                          disabled={isLoadingMessaggi || isSendingMessaggio}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-4 pr-14 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <button
                          type="submit"
                          disabled={isLoadingMessaggi || isSendingMessaggio || !testoMessaggio.trim()}
                          className="absolute right-2 top-2 rounded-xl bg-emerald-600 p-2.5 text-white shadow-md transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSendingMessaggio ? (
                            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </form>
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
