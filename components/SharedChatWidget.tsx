'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, Send, ShieldCheck, Sparkles } from 'lucide-react'

type ChatMessage = {
  id: string
  volontario_id: string
  associazione_id: string
  mittente_id: string
  testo: string
  is_system: boolean
  created_at: string
  posizione_id?: string | null
  letto: boolean
}

interface SharedChatWidgetProps {
  volontarioId: string
  associazioneId: string
  currentUserId: string
  posizioneId?: string | null // Passato per sapere da quale annuncio scrive
}

export default function SharedChatWidget({
  volontarioId,
  associazioneId,
  currentUserId,
  posizioneId = null
}: SharedChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // 1. CARICAMENTO UNIFICATO (Storico completo tra le due persone)
  useEffect(() => {
    let alive = true
    const loadMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messaggi')
        .select('*')
        .eq('volontario_id', volontarioId)
        .eq('associazione_id', associazioneId)
        .order('created_at', { ascending: true })

      if (alive && !error) setMessages(data ?? [])
      if (alive) setIsLoading(false)
    }
    loadMessages()
    return () => { alive = false }
  }, [volontarioId, associazioneId, supabase])

  // 2. WEB_SOCKET REALTIME
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${volontarioId}-${associazioneId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          filter: `volontario_id=eq.${volontarioId}`
        },
        (payload) => {
          const inc = payload.new as ChatMessage
          if (inc.associazione_id !== associazioneId) return 
          setMessages((prev) => prev.some((m) => m.id === inc.id) ? prev : [...prev, inc])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [volontarioId, associazioneId, supabase])

  // Autoscroll fluido
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => { chatScrollRef.current!.scrollTop = chatScrollRef.current!.scrollHeight }, 10)
    }
  }, [messages])

  // Raggruppamento dei messaggi per giorno
  const messaggiRaggruppati = useMemo(() => {
    const gruppi: { [key: string]: ChatMessage[] } = {}
    messages.forEach((m) => {
      const data = new Date(m.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      if (!gruppi[data]) gruppi[data] = []
      gruppi[data].push(m)
    })
    return Object.entries(gruppi)
  }, [messages])

  // Invio con aggancio del contesto di posizione
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || isSending) return

    setIsSending(true)
    setNewMessage('')

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      volontario_id: volontarioId,
      associazione_id: associazioneId,
      mittente_id: currentUserId,
      testo: text,
      is_system: false,
      created_at: new Date().toISOString(),
      posizione_id: posizioneId,
      letto: false
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messaggi')
      .insert({
        volontario_id: volontarioId,
        associazione_id: associazioneId,
        mittente_id: currentUserId,
        testo: text,
        is_system: false,
        posizione_id: posizioneId, // Registriamo quale annuncio sta visualizzando
        letto: false
      })
      .select().single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setNewMessage(text)
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m))
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col flex-grow h-full min-h-0 overflow-hidden bg-white">
      
      {/* AREA SCROLL (Sass-Premium Design) */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto space-y-6 p-6 scroll-smooth bg-slate-50/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/80 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
              <Sparkles className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Inizia la conversazione</h4>
            <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">I messaggi scambiati appariranno in questo thread unificato.</p>
          </div>
        ) : (
          messaggiRaggruppati.map(([data, msgs]) => (
            <div key={data} className="space-y-4">
              
              {/* Separatore temporale */}
              <div className="flex items-center justify-center my-4">
                <span className="h-[1px] bg-slate-100 flex-1"></span>
                <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mx-3">
                  <Calendar className="w-3 h-3 text-slate-300" /> {data}
                </span>
                <span className="h-[1px] bg-slate-100 flex-1"></span>
              </div>

              {msgs.map((m) => {
                if (m.is_system) {
                  return (
                    <div key={m.id} className="flex justify-center my-4">
                      <div className="bg-slate-100 border border-slate-200/50 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-2xl max-w-[85%] text-center flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> {m.testo}
                      </div>
                    </div>
                  )
                }

                const isMine = m.mittente_id === currentUserId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] space-y-1">
                      <div
                        className={`px-4 py-3 text-sm transition-all leading-relaxed ${
                          isMine
                            ? 'bg-slate-900 text-white rounded-3xl rounded-tr-sm shadow-xs'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-3xl rounded-tl-sm shadow-xs'
                        }`}
                      >
                        <p className="break-words font-medium">{m.testo}</p>
                      </div>
                      <span className={`block text-[10px] font-bold text-slate-400 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* INPUT BAR (Stile Intercom Premium) */}
      <form onSubmit={sendMessage} className="shrink-0 p-4 border-t border-slate-100 bg-white">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isLoading || isSending}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 px-5 py-4 pr-16 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-1 focus:ring-slate-950/5 disabled:opacity-70 font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || isSending || !newMessage.trim()}
            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition-all hover:bg-black disabled:opacity-30 active:scale-95 shrink-0"
          >
            {isSending ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}