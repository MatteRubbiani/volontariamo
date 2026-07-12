'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'
import SharedChatWidget from '@/components/SharedChatWidget'
import { Inbox, Check, X, Filter, ChevronLeft, User, Award, Sparkles, Loader2, MessageSquare, MapPin, Phone } from 'lucide-react'

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
  const [selectedId, setSelectedId] = useState<string | null>(volontarioDaUrl || null)
  const [filtro, setFiltro] = useState<string>('Tutte')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    if (filtroUrl) {
      const posTrovata = posizioniDisponibili.find(p => p.id === filtroUrl)
      if (posTrovata) setFiltro(posTrovata.titolo)
    }
    if (volontarioDaUrl) setSelectedId(volontarioDaUrl)
  }, [filtroUrl, volontarioDaUrl, posizioniDisponibili])

  const filtriDisponibili = useMemo(() => {
    const titoli = conversazioni.map(c => c.posizione?.titolo).filter(Boolean) as string[]
    const unici = Array.from(new Set([...titoli, ...posizioniDisponibili.map(p => p.titolo)])).sort()
    return ['Tutte', 'Solo Rete (Generici)', ...unici]
  }, [conversazioni, posizioniDisponibili])

  const filtrate = useMemo(() => {
    return conversazioni.filter(c => {
      if (filtro === 'Tutte') return true
      if (filtro === 'Solo Rete (Generici)') return c.tipo === 'rete'
      return c.posizione?.titolo === filtro
    })
  }, [conversazioni, filtro])

  const selectedConv = useMemo(() => conversazioni.find(c => c.volontario_id === selectedId), [conversazioni, selectedId])
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
        c.volontario_id === selectedId ? { ...c, stato_candidatura: nuovoStato } : c
      ))
    } catch (err) {
      console.error(err)
      alert("Impossibile aggiornare lo stato del candidato.")
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
      
      {/* 1️⃣ COLONNA SINISTRA: LISTA CHAT */}
      <div className={`flex flex-col h-full border-r border-slate-100 shrink-0 ${selectedId ? 'hidden lg:flex lg:w-[320px] xl:w-[360px]' : 'flex w-full lg:w-[320px] xl:w-[360px]'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select 
            value={filtro}
            onChange={(e) => { setFiltro(e.target.value); setSelectedId(null) }}
            className="w-full bg-transparent text-slate-900 font-bold text-xs outline-none cursor-pointer"
          >
            {filtriDisponibili.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtrate.map(conv => {
            const isSelected = selectedId === conv.volontario_id
            const p = conv.profilo
            const isCand = conv.tipo === 'candidatura'
            
            return (
              <button 
                key={conv.volontario_id} 
                onClick={() => setSelectedId(conv.volontario_id)} 
                className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/40'}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-slate-100">
                  <img src={getAvatar(p)} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{p?.nome} {p?.cognome}</h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isCand ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                      {isCand ? 'Bando' : 'Rete'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 truncate">{conv.posizione?.titolo || 'Messaggio Diretto'}</p>
                  
                  {isCand && conv.stato_candidatura && (
                    <span className={`inline-block text-[9px] font-bold ${
                      conv.stato_candidatura === 'accettato' ? 'text-emerald-600' : conv.stato_candidatura === 'rifiutato' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      • {conv.stato_candidatura === 'accettato' ? 'Inserito' : conv.stato_candidatura === 'rifiutato' ? 'Rifiutato' : 'In valutazione'}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2️⃣ CHAT CENTRALE */}
      <div className={`flex flex-col flex-grow min-w-0 bg-white ${selectedId ? 'flex w-full lg:w-auto' : 'hidden lg:flex'}`}>
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
            <MessageSquare className="w-8 h-8 stroke-[1.2] text-slate-200" />
            <p className="text-xs font-medium">Seleziona una chat dalla lista per iniziare</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white z-10">
               <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedId(null)} className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg mr-1 transition-colors">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <div>
                   <h3 className="font-bold text-slate-900 text-base leading-none mb-1.5">{profilo?.nome} {profilo?.cognome}</h3>
                   <div className="flex items-center gap-1.5">
                     <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.tipo === 'candidatura' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedConv.posizione?.titolo || 'Rete e Messaggi Diretti'}</p>
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="flex-1 min-h-0 bg-slate-50/30">
              <SharedChatWidget 
                volontarioId={selectedConv.volontario_id} 
                associazioneId={associazioneId} 
                currentUserId={associazioneId} 
              />
            </div>
          </>
        )}
      </div>

      {/* 3️⃣ COLONNA DESTRA: PROFILE DETTAGLI (Sbloccata per schermi Laptop e superiori) */}
      {selectedConv && profilo && (
        <div className="hidden lg:flex flex-col w-[280px] xl:w-[320px] border-l border-slate-100 h-full bg-slate-50/50 p-5 overflow-y-auto space-y-6 animate-in fade-in duration-200 shrink-0">          
          
          <div className="text-center space-y-3 pt-2">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm mx-auto">
              <img src={getAvatar(profilo)} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{profilo.nome} {profilo.cognome}</h4>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {selectedConv.tipo === 'candidatura' ? 'Candidato Posizione' : 'Membro della Rete'}
              </p>
            </div>
          </div>

          {/* PIPELINE DI ASSUNZIONE SELEZIONE */}
          {selectedConv.tipo === 'candidatura' && selectedConv.candidatura_id ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Pipeline Selezione
                </span>
                <div className="text-xs font-semibold text-slate-700">
                  Stato: <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] bg-slate-100 px-1.5 py-0.5 rounded ml-1">{selectedConv.stato_candidatura || 'In attesa'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                {selectedConv.stato_candidatura !== 'accettato' && (
                  <button
                    onClick={() => handleAggiornaStatoCandidatura('accettato')}
                    disabled={isActionLoading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 shadow-xs"
                  >
                    {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accetta Volontario
                  </button>
                )}
                {selectedConv.stato_candidatura !== 'rifiutato' && (
                  <button
                    onClick={() => handleAggiornaStatoCandidatura('rifiutato')}
                    disabled={isActionLoading}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                    Rifiuta
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Anagrafica Rete</span>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Discussione avviata tramite contatto diretto o iscrizione storica all'albo.</p>
            </div>
          )}

          {/* DATI ANAGRAFICI PRECISI E BIOGRAFIA */}
          <div className="space-y-5 pt-2 border-t border-slate-200/60">
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              {profilo.citta_residenza && (
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {profilo.citta_residenza}</div>
              )}
              {profilo.telefono && (
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {profilo.telefono}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Biografia</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {profilo.bio || 'Il volontario non ha inserito una biografia.'}
              </p>
            </div>

            {/* Rendering Competenze aggregate via join in memoria */}
            {profilo.competenze_nomi && profilo.competenze_nomi.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Competenze Rilevate</span>
                <div className="flex flex-wrap gap-1.5">
                  {profilo.competenze_nomi.map((comp: string, idx: number) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
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