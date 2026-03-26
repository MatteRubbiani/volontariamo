'use client'

import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatRealtime({
  candidaturaId,
  userId,
  messaggiIniziali,
  coloreUtente
}: {
  candidaturaId: string
  userId: string
  messaggiIniziali: any[]
  coloreUtente: 'blue' | 'emerald'
}) {
  const [messaggi, setMessaggi] = useState(messaggiIniziali)
  const [testo, setTesto] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. SCROLL BLOCCATO IN BASSO
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messaggi])

  // 2. MOTORE REALTIME CON CANALE UNIVOCO
  useEffect(() => {
    // Usiamo un nome canale specifico per questa chat per non far accavallare i dati
    const channelName = `chat_${candidaturaId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          filter: `candidatura_id=eq.${candidaturaId}`
        },
        (payload) => {
          setMessaggi((prev: any) => {
            // Se il messaggio è già a schermo (perché l'abbiamo appena mandato noi), ignoralo
            if (prev.some((m: any) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("🟢 Connesso al Tempo Reale!")
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [candidaturaId, supabase])

  // 3. INVIO "STILE WHATSAPP" (Ottimistico)
  const gestisciInvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testo.trim()) return

    const messaggioDaInviare = testo.trim()
    setTesto('') // Svuota l'input all'istante

    // A. MOSTRA SUBITO IL MESSAGGIO A SCHERMO (Creiamo un ID falso temporaneo)
    const tempId = `temp-${Date.now()}`
    const messaggioTemporaneo = {
      id: tempId,
      candidatura_id: candidaturaId,
      mittente_id: userId,
      testo: messaggioDaInviare,
      created_at: new Date().toISOString()
    }
    
    setMessaggi((prev: any) => [...prev, messaggioTemporaneo])

    // B. MANDA IL MESSAGGIO AL SERVER IN BACKGROUND
    const { data, error } = await supabase.from('messaggi').insert({
      candidatura_id: candidaturaId,
      mittente_id: userId,
      testo: messaggioDaInviare
    }).select().single()

    // C. SE C'È UN ERRORE, TE LO URLA IN FACCIA!
    if (error) {
      console.error("ERRORE DATABASE:", error.message)
      alert(`⚠️ Errore di Supabase: ${error.message}\nControlla i permessi RLS!`)
      // Rimuoviamo il messaggio finto perché l'invio è fallito
      setMessaggi((prev: any) => prev.filter((m: any) => m.id !== tempId))
    } else if (data) {
      // Sostituisce l'ID finto con quello vero del database
      setMessaggi((prev: any) => prev.map((m: any) => m.id === tempId ? data : m))
    }
  }

  // Colori (fissi per evitare che Tailwind li cancelli)
  const isEmerald = coloreUtente === 'emerald'
  const mioBg = isEmerald ? 'bg-emerald-600' : 'bg-blue-600'
  const bottoneHover = isEmerald ? 'hover:bg-emerald-700' : 'hover:bg-blue-700'

  return (
    // CONTENITORE: Altezza 100%, niente sbordamenti (overflow-hidden)
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">
      
      {/* AREA MESSAGGI: flex-1 si espande, lo scroll vive qui dentro */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4"
      >
        {!messaggi || messaggi.length === 0 ? (
          <div className="text-center py-20 opacity-50 m-auto">
            <div className="text-4xl mb-2">👋</div>
            <p className="font-bold text-slate-500">Nessun messaggio.</p>
          </div>
        ) : (
          messaggi.map((msg: any) => {
            const isMio = msg.mittente_id === userId
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMio ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-5 py-3 shadow-sm ${
                  isMio 
                    ? `${mioBg} text-white rounded-[1.5rem] rounded-br-sm` 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-[1.5rem] rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.testo}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-1 px-2">
                  {isMounted ? new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* BARRA SCRITTURA: flex-none è il muro di cemento. Non scende, non si rimpicciolisce. */}
      <div className="flex-none p-3 md:p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <form onSubmit={gestisciInvio} className="flex items-center gap-3 max-w-4xl mx-auto">
          <input 
            type="text" 
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Scrivi un messaggio..." 
            autoComplete="off"
            className="flex-grow bg-slate-100 border-transparent rounded-full px-6 py-4 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all font-medium text-slate-700"
            required
          />
          <button 
            type="submit" 
            className={`w-14 h-14 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${mioBg} ${bottoneHover}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  )
}