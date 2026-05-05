'use client'

import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import SharedChatWidget from '@/components/SharedChatWidget'

export default function InboxCandidatureClient({ 
  candidatureIniziali, 
  associazioneId 
}: { 
  candidatureIniziali: any[], 
  associazioneId: string 
}) {
  const [candidature, setCandidature] = useState(candidatureIniziali)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filtroPosizione, setFiltroPosizione] = useState<string>('Tutte')

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Estraiamo le posizioni uniche per il menu a tendina dei filtri
  const posizioniUniche = Array.from(new Set(candidature.map(c => c.posizioni?.titolo))).filter(Boolean) as string[]

  // Filtriamo la lista
  const filtrate = candidature.filter(c => {
    if (filtroPosizione === 'Tutte') return true;
    return c.posizioni?.titolo === filtroPosizione;
  })

  const selectedCandidatura = candidature.find(c => c.id === selectedId)
  const profilo = selectedCandidatura?.volontario?.profili_volontari

  const getAvatar = (p: any) => {
    if (p?.foto_profilo_url) return p.foto_profilo_url
    if (p?.avatar_url) return p.avatar_url
    const nome = p?.nome || 'V'
    const cognome = p?.cognome || 'U'
    return `https://ui-avatars.com/api/?name=${nome}+${cognome}&background=10B981&color=fff`
  }

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
      alert("Errore durante l'aggiornamento. Riprova.")
    } finally {
      setIsUpdating(false)
    }
  }

  const getBadgeStato = (stato: string) => {
    switch (stato) {
      case 'accettato':
      case 'accettata': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Accettato</span>
      case 'rifiutato':
      case 'rifiutata': return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200">Rifiutato</span>
      case 'in_contatto': return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-200">In Contatto</span>
      default: return <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">Nuovo</span>
    }
  }

  return (
    // Usa h-full per occupare l'intero contenitore blindato del parent
    <div className="flex h-full w-full overflow-hidden bg-white border-t border-slate-200 lg:border-none lg:rounded-[2rem] lg:shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
      
      {/* ========================================= */}
      {/* SINISTRA: MASTER LIST (Inbox)             */}
      {/* ========================================= */}
      <div className={`flex flex-col h-full border-r border-slate-100 transition-all duration-300 ${selectedId ? 'hidden lg:flex lg:w-[35%]' : 'flex w-full lg:w-[35%]'}`}>
        
        {/* Header Lista & Filtri */}
        <div className="shrink-0 p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 mb-4">Inbox Candidature</h2>
          <select 
            value={filtroPosizione}
            onChange={(e) => setFiltroPosizione(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium appearance-none"
          >
            <option value="Tutte">Tutte le posizioni ({candidature.length})</option>
            {posizioniUniche.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Lista Scrollabile */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {filtrate.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 font-medium text-sm">Nessuna candidatura trovata.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtrate.map(cand => {
                const isSelected = selectedId === cand.id
                const p = cand.volontario?.profili_volontari
                return (
                  <button
                    key={cand.id}
                    onClick={() => setSelectedId(cand.id)}
                    className={`w-full text-left p-4 lg:p-5 transition-colors hover:bg-slate-50 flex items-start gap-4 ${isSelected ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm">
                      <img 
                        src={getAvatar(p)} 
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${p?.nome || 'V'}+${p?.cognome || 'U'}&background=10B981&color=fff` }}
                        alt="Avatar" className="w-full h-full object-cover" 
                      />
                    </div>
                    {/* Dati */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-900 truncate pr-2 text-sm lg:text-base">
                          {p?.nome || 'Utente'} {p?.cognome || ''}
                        </h3>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {new Date(cand.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 truncate mb-2">
                        {cand.posizioni?.titolo}
                      </p>
                      <div>{getBadgeStato(cand.stato)}</div>
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
      <div className={`flex flex-col h-full bg-slate-50 relative transition-all duration-300 ${selectedId ? 'flex w-full lg:w-[65%]' : 'hidden lg:flex lg:w-[65%]'}`}>
        
        {!selectedCandidatura ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.221-1.15-2.136-2.389-2.097a48.025 48.025 0 0 0-11.212 0c-1.24.039-2.39 1.954-2.39 2.097v4.286c0 1.136.847 2.1 1.98 2.193 1.326.108 2.666.163 4.02.163l3 3v-3.091c.34-.02.68-.045 1.02-.072" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800">Seleziona una chat</h3>
            <p className="text-slate-500 font-medium mt-2">Scegli una candidatura dalla lista per visualizzare il profilo e iniziare a chattare.</p>
          </div>
        ) : (
          <>
            {/* Header Profilo & Azioni */}
            <div className="shrink-0 bg-white border-b border-slate-100 p-4 lg:p-6 shadow-sm z-10 flex items-center justify-between">
              
              {/* Tasto Indietro (Solo Mobile) & Info Utente */}
              <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                <button 
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                
                <div className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-slate-100">
                   <img src={getAvatar(profilo)} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-sm lg:text-lg truncate">{profilo?.nome} {profilo?.cognome}</h3>
                  <p className="text-[11px] lg:text-xs font-semibold text-slate-500 truncate">Candidato per: {selectedCandidatura.posizioni?.titolo}</p>
                </div>
              </div>

              {/* Bottoni Azione (Rifiuta/Accetta) */}
              <div className="flex gap-2 shrink-0">
                {selectedCandidatura.stato === 'in_attesa' || selectedCandidatura.stato === 'in_contatto' ? (
                  <>
                    <button 
                      onClick={() => gestisciCandidatura(selectedCandidatura.id, 'rifiutato')}
                      disabled={isUpdating}
                      className="hidden sm:block px-4 py-2 text-xs lg:text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                    >
                      Rifiuta
                    </button>
                    <button 
                      onClick={() => gestisciCandidatura(selectedCandidatura.id, 'accettato')}
                      disabled={isUpdating}
                      className="px-4 py-2 text-xs lg:text-sm font-bold text-white bg-emerald-600 rounded-full shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? '...' : 'Accetta'}
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    {getBadgeStato(selectedCandidatura.stato)}
                  </div>
                )}
              </div>
            </div>

            {/* Info Profilo Bio & Chat */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {/* Bio Rapida */}
              <div className="shrink-0 p-4 lg:p-6 bg-gradient-to-b from-white to-transparent">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100/50">
                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Informazioni Profilo</p>
                  <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed">
                    {profilo?.bio || "Questo volontario non ha ancora scritto una bio. Inizia a chattare per conoscerlo meglio!"}
                  </p>
                </div>
              </div>

              {/* Chat Wrapper */}
              <div className="flex-1 min-h-0 px-4 lg:px-6 pb-4">
                <SharedChatWidget candidaturaId={selectedCandidatura.id} currentUserId={associazioneId} />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}