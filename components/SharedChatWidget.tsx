'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type ChatMessage = {
  id: string
  candidatura_id: string
  mittente_id: string
  testo: string
  created_at: string
}

interface SharedChatWidgetProps {
  candidaturaId: string
  currentUserId: string
}

export default function SharedChatWidget({
  candidaturaId,
  currentUserId
}: SharedChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    if (!candidaturaId) return

    let alive = true

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      setChatError(null)

      const { data, error } = await supabase
        .from('messaggi')
        .select('id, candidatura_id, mittente_id, testo, created_at')
        .eq('candidatura_id', candidaturaId)
        .order('created_at', { ascending: true })

      if (!alive) return

      if (error) {
        console.error('Errore caricamento messaggi:', error)
        setChatError('Impossibile caricare la chat.')
        setMessages([])
      } else {
        setMessages(data ?? [])
      }

      setIsLoadingMessages(false)
    }

    loadMessages()

    return () => {
      alive = false
    }
  }, [candidaturaId, supabase])

  useEffect(() => {
    if (!candidaturaId) return

    const channel = supabase
      .channel(`messaggi-candidatura-${candidaturaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          filter: `candidatura_id=eq.${candidaturaId}`
        },
        (payload) => {
          const incomingMessage = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((message) => message.id === incomingMessage.id)) return prev
            return [...prev, incomingMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [candidaturaId, supabase])

  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollTimeout = setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
      }, 10)
      return () => clearTimeout(scrollTimeout)
    }
  }, [messages])

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const cleanedMessage = newMessage.trim()
    if (!cleanedMessage || isSendingMessage) return

    const tempId = `temp-${Date.now()}`
    const temporaryMessage: ChatMessage = {
      id: tempId,
      candidatura_id: candidaturaId,
      mittente_id: currentUserId,
      testo: cleanedMessage,
      created_at: new Date().toISOString()
    }

    setChatError(null)
    setNewMessage('')
    setIsSendingMessage(true)
    
    setMessages((prev) => [...prev, temporaryMessage])

    const { data, error } = await supabase
      .from('messaggi')
      .insert({
        candidatura_id: candidaturaId,
        mittente_id: currentUserId,
        testo: cleanedMessage
      })
      .select('id, candidatura_id, mittente_id, testo, created_at')
      .single()

    if (error || !data) {
      console.error('Errore invio messaggio:', error)
      setMessages((prev) => prev.filter((message) => message.id !== tempId))
      setNewMessage(cleanedMessage)
      setChatError('Invio non riuscito. Riprova.')
    } else {
      setMessages((prev) => {
        if (prev.some((message) => message.id === data.id)) {
          return prev.filter((message) => message.id !== tempId)
        }
        return prev.map((message) => (message.id === tempId ? data : message))
      })
    }

    setIsSendingMessage(false)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      
      {/* AREA MESSAGGI: Resa più clean, senza bordi tratteggiati, con sfondo morbido */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto space-y-4 rounded-3xl bg-slate-50/50 p-4 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
      >
        {isLoadingMessages ? (
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
          messages.map((message) => {
            const isMine = message.mittente_id === currentUserId
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {/* BOLLE DI TESTO: Stile moderno con angoli asimmetrici per indicare la coda del fumetto */}
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[15px] shadow-sm ${
                    isMine
                      ? 'bg-emerald-600 text-white rounded-[20px] rounded-br-[4px]'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-[20px] rounded-bl-[4px]'
                  }`}
                >
                  <p className="leading-relaxed break-words">{message.testo}</p>
                  <p className={`mt-1 text-[11px] font-medium flex ${isMine ? 'text-emerald-100 justify-end' : 'text-slate-400 justify-start'}`}>
                    {new Date(message.created_at).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* BARRA INPUT: Trasformata a "pillola" in stile iOS, pulsante invio perfettamente tondo */}
      <form onSubmit={sendMessage} className="shrink-0 mt-3 pb-1">
        {chatError && (
          <p className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {chatError}
          </p>
        )}
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isLoadingMessages || isSendingMessage}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 pr-14 text-[15px] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isLoadingMessages || isSendingMessage || !newMessage.trim()}
            className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSendingMessage ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}