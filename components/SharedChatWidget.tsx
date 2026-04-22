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
    // 🚨 IL FIX: flex-1 min-h-0 overflow-hidden blinda il contenitore, impedendogli di crescere all'infinito
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      
      {/* AREA MESSAGGI (Autorizzata a scrollare internamente) */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto space-y-3 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 p-4 shadow-sm scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
      >
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 italic">
              Inizia la conversazione...
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.mittente_id === currentUserId
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMine
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed break-words">{message.testo}</p>
                  <p className={`mt-1 text-[10px] font-bold ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
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

      {/* BARRA INPUT (Blindata in fondo con shrink-0) */}
      <form onSubmit={sendMessage} className="shrink-0 mt-4 pb-1">
        {chatError && (
          <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
            {chatError}
          </p>
        )}
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isLoadingMessages || isSendingMessage}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 pr-14 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoadingMessages || isSendingMessage || !newMessage.trim()}
            className="absolute right-2 top-2 rounded-xl bg-emerald-600 p-2.5 text-white shadow-md transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            {isSendingMessage ? (
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
  )
}