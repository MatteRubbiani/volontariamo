'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'
import SharedChatWidget from '@/components/SharedChatWidget'
import { marcaMessaggiComeLetti } from '@/app/actions/messaggi'
import { Check, X, Filter, ChevronLeft, User, Award, Sparkles, Loader2, MessageSquare, MapPin, Phone, Briefcase } from 'lucide-react'

interface HubMessaggiProps {
  conversazioniIniziali: any[]
  associazioneId: string
  posizioniDisponibili?: { id: string; titolo: string }[]
}

export default function HubMessaggiClient({ 
  conversazioniIniziali, 
  associazioneId,
  posizioniDisponibili = [] 
}: HubMessaggiProps) {
  const searchParams = useSearchParams()
  const filtroUrl = searchParams.get('filterPosizione')
  const volontarioDaUrl = searchParams.get('volontario')

  const [conversazioni, setConversazioni] = useState(conversazioniIniziali)
  const [selectedKey, setSelectedKey] = useState<string | null>(volontarioDaUrl || null) 
  const [filtro, setFiltro] = useState<string>('Tutte')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ==========================================
  // ⚡ REALTIME LISTENER (Notifiche Istantanee)
  // ==========================================
  useEffect(() => {
    const canaleRealtime = supabase
      .channel('messaggi_live_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messaggi', filter: `associazione_id=eq.${associazioneId}` },
        (payload) => {
          const m = payload.new
          if (m.mittente_id === associazioneId) return // Ignoriamo i messaggi inviati da noi

          setConversazioni(prev => {
            const chiaveDiscussione = m.volontario_id
            const esiste = prev.some(c => c.chiave_id === chiaveDiscussione)

            if (esiste) {
              return prev.map(c => {
                if (c.chiave_id === chiaveDiscussione) {
                  return {
                    ...c,
                    non_letto: selectedKey !== chiaveDiscussione,
                    ultimo_messaggio_testo: m.testo,
                    ultimo_messaggio_data: m.created_at
                  }
                }
                return c
              }).sort((a, b) => new Date(b.ultimo_messaggio_data).getTime() - new Date(a.ultimo_messaggio_data).getTime())
            } else {
              // Se è un nuovo utente assoluto, ricarichiamo la pagina per includerlo
              window.location.reload()
              return prev
            }
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canaleRealtime) }
  }, [associazioneId, selectedKey, supabase])

  // Imposta filtri o utente iniziale dall'URL
  useEffect(() => {
    if (filtroUrl) {
      const posTrovata = posizioniDisponibili.find(p => p.id === filtroUrl)
      if (posTrovata) setFiltro(posTrovata.titolo)
    }
    if (volontarioDaUrl) setSelectedKey(volontarioDaUrl)
  }, [filtroUrl, volontarioDaUrl, posizioniDisponibili])

// ==========================================
  // 💾 MARCA COME LETTO (Client e Persistenza)
  // ==========================================
  useEffect(() => {
    if (!selectedKey) return;

    const convSelezionata = conversazioni.find(c => c.chiave_id === selectedKey);
    
    // Se la chat ha effettivamente messaggi non letti, procediamo all'aggiornamento
    if (convSelezionata && convSelezionata.non_letto) {
      // 1. Spegniamo il pallino blu all'istante lato UI
      setConversazioni(prev => prev.map(c => 
        c.chiave_id === selectedKey ? { ...c, non_letto: false } : c
      ));

      // 2. Chiamiamo il database
      marcaMessaggiComeLetti(convSelezionata.volontario_id, associazioneId)
        .catch(err => console.error("Errore nella action:", err));
    }
  }, [selectedKey]); // Togliamo "associazioneId" dalle dipendenze per evitare loop indesiderati

  // Filtro unificato: Tutte o singola posizione
  const filtriDisponibili = useMemo(() => {
    return ['Tutte', ...posizioniDisponibili.map(p => p.titolo).sort()]
  }, [posizioniDisponibili])

  const filtrate = useMemo(() => {
    return conversazioni.filter(c => {
      if (filtro === 'Tutte') return true
      return c.posizione?.titolo === filtro
    })
  }, [conversazioni, filtro])

  const selectedConv = useMemo(() => conversazioni.find(c => c.chiave_id === selectedKey), [conversazioni, selectedKey])
  const profilo = selectedConv?.profilo

  const handleAggiornaStatoCandidatura = async (nuovoStato: 'accettato' | 'rifiutato' | 'in_contatto') => {
    if (!selectedConv?.candidatura_id) return
    setIsActionLoading(true)

    try {
      const { error } = await supabase
        .from('candidature')
        .update({ stato: nuovoStato })
        .eq('id', selectedConv.candidatura_id)

      if (error) throw error

      setConversazioni(prev => prev.map(c => 
        c.chiave_id === selectedKey ? { ...c, stato_candidatura: nuovoStato } : c
      ))
    } catch (err) {
      console.error(err)
      alert("Errore nell'aggiornamento.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const getAvatar = useCallback((p: any) => {
    if (p?.foto_profilo_url) return p.foto_profilo_url
    return `https://ui-avatars.com/api/?name=${p?.nome || 'V'}+${p?.cognome || 'U'}&background=0F172A&color=fff`
  }, [])

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-white border-t border-slate-100 lg:rounded-3xl lg:border lg:shadow-xs">
      
      {/* 1️⃣ COLONNA LISTA INBOX */}
      <div className={`flex flex-col h-full border-r border-slate-100 shrink-0 ${selectedKey ? 'hidden lg:flex lg:w-[320px] xl:w-[360px]' : 'flex w-full lg:w-[320px] xl:w-[360px]'}`}>
        
        {/* Selettore Filtri */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={filtro}
            onChange={(e) => { setFiltro(e.target.value); setSelectedKey(null) }}
            className="w-full bg-transparent text-slate-900 font-bold text-sm outline-none cursor-pointer"
          >
            {filtriDisponibili.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Lista conversazioni con pallini blu per i non letti */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtrate.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">Nessuna conversazione trovata.</div>
          ) : (
            filtrate.map(conv => {
              const isSelected = selectedKey === conv.chiave_id
              const p = conv.profilo
              
              return (
                <button 
                  key={conv.chiave_id} 
                  onClick={() => setSelectedKey(conv.chiave_id)} 
                  className={`w-full text-left p-4 flex items-start gap-3 transition-all relative ${
                    isSelected ? 'bg-slate-100' : 'hover:bg-slate-50/60'
                  } ${conv.non_letto ? 'bg-blue-50/15' : ''}`}
                >
                  <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-slate-200">
                    <img src={getAvatar(p)} className="w-full h-full object-cover" alt="" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm truncate ${conv.non_letto ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {p?.nome} {p?.cognome}
                      </h3>
                      {conv.non_letto && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse"></span>}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {conv.posizione ? (
                        <>
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-500 font-medium truncate">{conv.posizione.titolo}</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium truncate">Messaggio Generale</p>
                      )}
                    </div>
                    
                    <p className={`text-xs truncate mt-1 ${conv.non_letto ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                      {conv.ultimo_messaggio_testo}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2️⃣ COLONNA CHAT CENTRALE */}
      <div className={`flex flex-col flex-grow min-w-0 bg-white ${selectedKey ? 'flex w-full lg:w-auto' : 'hidden lg:flex'}`}>
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
            <MessageSquare className="w-10 h-10 stroke-[1.2] text-slate-200" />
            <p className="text-sm font-medium">Seleziona una discussione per iniziare</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white z-10">
               <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedKey(null)} className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg mr-1 transition-colors">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg leading-tight">{profilo?.nome} {profilo?.cognome}</h3>
                   <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedConv.posizione?.titolo || 'Messaggio Generale'}</p>
                 </div>
               </div>
            </div>
            
            <div className="flex-1 min-h-0 bg-slate-50/50">
              {/* Carichiamo il widget passando l'ID dell'annuncio selezionato */}
              <SharedChatWidget 
                volontarioId={selectedConv.volontario_id} 
                associazioneId={associazioneId} 
                currentUserId={associazioneId} 
                posizioneId={selectedConv.posizione_id}
              />
            </div>
          </>
        )}
      </div>

      {/* 3️⃣ COLONNA DETTAGLI DESTRA */}
      {selectedConv && profilo && (
        <div className="hidden lg:flex flex-col w-[300px] border-l border-slate-100 h-full bg-slate-50/50 p-6 overflow-y-auto space-y-6 shrink-0">          
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 mx-auto">
              <img src={getAvatar(profilo)} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{profilo.nome} {profilo.cognome}</h4>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                {selectedConv.tipo === 'candidatura' ? 'Candidato' : 'Richiesta Info'}
              </p>
            </div>
          </div>

          {selectedConv.tipo === 'candidatura' && selectedConv.candidatura_id && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stato Selezione</span>
                <div className="text-sm font-semibold text-slate-900 mt-1 capitalize">{selectedConv.stato_candidatura?.replace('_', ' ')}</div>
              </div>

              <div className="flex flex-col gap-2">
                {selectedConv.stato_candidatura !== 'accettato' && (
                  <button
                    onClick={() => handleAggiornaStatoCandidatura('accettato')}
                    disabled={isActionLoading}
                    className="w-full py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accetta
                  </button>
                )}
                {selectedConv.stato_candidatura !== 'rifiutato' && (
                  <button
                    onClick={() => handleAggiornaStatoCandidatura('rifiutato')}
                    disabled={isActionLoading}
                    className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-red-600 font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Rifiuta
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-200/60">
            <div className="space-y-2 text-sm text-slate-600">
              {profilo.citta_residenza && (
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {profilo.citta_residenza}</div>
              )}
              {profilo.telefono && (
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {profilo.telefono}</div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Bio</span>
              <p className="text-sm text-slate-600 leading-relaxed">
                {profilo.bio || 'Nessuna bio.'}
              </p>
            </div>

            {profilo.competenze_nomi && profilo.competenze_nomi.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5"><Award className="w-4 h-4 text-slate-400" /> Competenze</span>
                <div className="flex flex-wrap gap-1.5">
                  {profilo.competenze_nomi.map((comp: string, idx: number) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}