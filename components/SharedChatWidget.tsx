'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type ChatMessage = {
  id: string
  volontario_id: string
  associazione_id: string
  mittente_id: string
  testo: string
  is_system: boolean
  created_at: string
}

interface SharedChatWidgetProps {
  volontarioId: string
  associazioneId: string
  currentUserId: string
}

export default function SharedChatWidget({
  volontarioId,
  associazioneId,
  currentUserId
}: SharedChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  // Caricamento Iniziale
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

  // Realtime
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
          if (inc.associazione_id !== associazioneId) return // Sicurezza
          setMessages((prev) => prev.some((m) => m.id === inc.id) ? prev : [...prev, inc])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [volontarioId, associazioneId, supabase])

  // Autoscroll
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current!.scrollTop = chatScrollRef.current!.scrollHeight
      }, 10)
    }
  }, [messages])

  // Invio
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || isSending) return

    setIsSending(true)
    setNewMessage('')

    // Inserimento ottimistico (Fake ID per mostrare subito il messaggio)
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      volontario_id: volontarioId,
      associazione_id: associazioneId,
      mittente_id: currentUserId,
      testo: text,
      is_system: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messaggi')
      .insert({
        volontario_id: volontarioId,
        associazione_id: associazioneId,
        mittente_id: currentUserId,
        testo: text,
        is_system: false
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
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto space-y-4 rounded-3xl bg-slate-50/50 p-4 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-slate-400 shadow-sm border border-slate-100">
              Inizia la conversazione...
            </div>
          </div>
        ) : (
          messages.map((m) => {
            // STILE MESSAGGIO DI SISTEMA (es: Candidatura)
            if (m.is_system) {
              return (
                <div key={m.id} className="flex justify-center my-6">
                  <div className="bg-slate-200/50 text-slate-600 text-xs font-bold px-4 py-2 rounded-2xl max-w-[85%] text-center">
                    {m.testo}
                  </div>
                </div>
              )
            }

            // STILE MESSAGGI NORMALI
            const isMine = m.mittente_id === currentUserId
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[15px] shadow-sm ${
                    isMine
                      ? 'bg-emerald-600 text-white rounded-[20px] rounded-br-[4px]'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-[20px] rounded-bl-[4px]'
                  }`}
                >
                  <p className="leading-relaxed break-words">{m.testo}</p>
                  <p className={`mt-1 text-[11px] font-medium flex ${isMine ? 'text-emerald-100 justify-end' : 'text-slate-400 justify-start'}`}>
                    {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="shrink-0 mt-3 pb-1">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isLoading || isSending}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 pr-14 text-[15px] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isLoading || isSending || !newMessage.trim()}
            className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSending ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}