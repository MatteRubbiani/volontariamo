'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'
import SharedChatWidget from '@/components/SharedChatWidget'

interface HubMessaggiProps {
  conversazioniIniziali: any[];
  associazioneId: string;
  posizioniDisponibili?: { id: string; titolo: string }[];
}

export default function HubMessaggiClient({ 
  conversazioniIniziali, 
  associazioneId,
  posizioniDisponibili = [] 
}: HubMessaggiProps) {
  const searchParams = useSearchParams()
  const filtroUrl = searchParams.get('filterPosizione')
  const volontarioDaUrl = searchParams.get('volontario') // <--- Estratto parametro

  const [conversazioni, setConversazioni] = useState(conversazioniIniziali)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filtroPosizione, setFiltroPosizione] = useState<string>('Tutte')
  const [isBioExpanded, setIsBioExpanded] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Sincronizzazione filtri e selezione automatica da URL
  useEffect(() => {
    // 1. Gestione filtro posizione
    if (filtroUrl) {
      const posTrovata = posizioniDisponibili.find(p => p.id === filtroUrl)
      if (posTrovata) setFiltroPosizione(posTrovata.titolo)
    }
    
    // 2. Selezione automatica chat
    if (volontarioDaUrl) {
      setSelectedId(volontarioDaUrl)
    }
  }, [filtroUrl, volontarioDaUrl, posizioniDisponibili])

  const posizioniUniche = useMemo(() => {
    const titoli = conversazioni.map(c => c.posizioni?.titolo).filter(Boolean) as string[]
    return Array.from(new Set([...titoli, ...posizioniDisponibili.map(p => p.titolo)])).sort()
  }, [conversazioni, posizioniDisponibili])

  const filtrate = useMemo(() => {
    return conversazioni.filter(c => {
      if (filtroPosizione === 'Tutte') return true
      return c.posizioni?.titolo === filtroPosizione
    })
  }, [conversazioni, filtroPosizione])

  const selectedConv = useMemo(() => conversazioni.find(c => c.volontario_id === selectedId), [conversazioni, selectedId])
  const profilo = selectedConv?.volontario?.profili_volontari

  useEffect(() => { setIsBioExpanded(false) }, [selectedId])

  const getAvatar = useCallback((p: any) => {
    if (p?.foto_profilo_url) return p.foto_profilo_url
    return `https://ui-avatars.com/api/?name=${p?.nome || 'V'}+${p?.cognome || 'U'}&background=0F172A&color=fff`
  }, [])

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-white border-t border-slate-200 lg:rounded-[2rem] lg:shadow-sm lg:border lg:border-slate-200/60">
      
      {/* SINISTRA: LISTA MESSAGGI (HUB) */}
      <div className={`flex flex-col h-full border-r border-slate-100 transition-all duration-200 shrink-0 ${selectedId ? 'hidden lg:flex lg:w-[36%]' : 'flex w-full lg:w-[36%]'}`}>
        <div className="shrink-0 p-4 border-b border-slate-100 bg-white">
          <select 
            value={filtroPosizione}
            onChange={(e) => { setFiltroPosizione(e.target.value); setSelectedId(null) }}
            className="w-full bg-slate-50 border border-slate-200/60 text-slate-800 font-bold text-xs rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="Tutte">Tutti i contatti</option>
            {posizioniUniche.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtrate.map(conv => {
            const isSelected = selectedId === conv.volontario_id
            const p = conv.volontario?.profili_volontari
            return (
              <button 
                key={conv.volontario_id} 
                onClick={() => setSelectedId(conv.volontario_id)} 
                className={`w-full text-left p-4 flex items-start gap-3 ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                  <img src={getAvatar(p)} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{p?.nome} {p?.cognome}</h3>
                  <p className="text-xs text-slate-500 truncate">{conv.posizioni?.titolo || 'Rete Volontari'}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* DESTRA: CHAT UNIFICATA */}
      <div className={`flex flex-col flex-1 min-w-0 bg-white ${selectedId ? 'flex w-full lg:w-auto' : 'hidden lg:flex'}`}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Seleziona un contatto</div>
        ) : (
          <>
            <div className="shrink-0 border-b p-4 flex justify-between items-center">
               <h3 className="font-black">{profilo?.nome} {profilo?.cognome}</h3>
               <button onClick={() => setSelectedId(null)} className="lg:hidden">Chiudi</button>
            </div>
            <div className="flex-1 min-h-0">
              <SharedChatWidget 
                volontarioId={selectedConv.volontario_id} 
                associazioneId={associazioneId} 
                currentUserId={associazioneId} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}