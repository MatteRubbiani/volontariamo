'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

type ChatMessage = {
  id: string
  candidatura_id: string
  mittente_id: string
  testo: string
  created_at: string
}

interface PosizioneQuestionPanelProps {
  posizioneId: string
  associazioneNome: string
  userId: string | null
  loginHref: string
  initialCandidaturaId?: string | null
  buttonClassName?: string
}

export default function PosizioneQuestionPanel({
  posizioneId,
  associazioneNome,
  userId,
  loginHref,
  initialCandidaturaId = null,
  buttonClassName = ''
}: PosizioneQuestionPanelProps) {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [candidaturaId, setCandidaturaId] = useState<string | null>(initialCandidaturaId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const fetchConversation = useCallback(async () => {
    if (!userId) return

    setIsLoadingConversation(true)
    setErrorMessage(null)

    try {
      let targetCandidaturaId = candidaturaId

      if (!targetCandidaturaId) {
        const { data: existingCandidatura, error: candidaturaError } = await supabase
          .from('candidature')
          .select('id')
          .eq('posizione_id', posizioneId)
          .eq('volontario_id', userId)
          .maybeSingle()

        if (candidaturaError) throw candidaturaError

        targetCandidaturaId = existingCandidatura?.id ?? null
        if (targetCandidaturaId) setCandidaturaId(targetCandidaturaId)
      }

      if (!targetCandidaturaId) {
        setMessages([])
        return
      }

      const { data: storedMessages, error: messagesError } = await supabase
        .from('messaggi')
        .select('id, candidatura_id, mittente_id, testo, created_at')
        .eq('candidatura_id', targetCandidaturaId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      setMessages(storedMessages ?? [])
    } catch (error) {
      console.error('Errore caricamento conversazione:', error)
      setErrorMessage('Non siamo riusciti a caricare la conversazione.')
    } finally {
      setIsLoadingConversation(false)
    }
  }, [candidaturaId, posizioneId, supabase, userId])

  const ensureCandidatura = async () => {
    if (!userId) throw new Error('Utente non autenticato.')
    if (candidaturaId) return candidaturaId

    const { data: existingCandidatura, error: existingError } = await supabase
      .from('candidature')
      .select('id')
      .eq('posizione_id', posizioneId)
      .eq('volontario_id', userId)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingCandidatura?.id) {
      setCandidaturaId(existingCandidatura.id)
      return existingCandidatura.id
    }

    const { data: createdCandidatura, error: createError } = await supabase
      .from('candidature')
      .insert({
        posizione_id: posizioneId,
        volontario_id: userId,
        stato: 'in_contatto'
      })
      .select('id')
      .single()

    if (createError) {
      if (createError.code !== '23505') throw createError

      const { data: duplicatedCandidatura, error: duplicateLookupError } = await supabase
        .from('candidature')
        .select('id')
        .eq('posizione_id', posizioneId)
        .eq('volontario_id', userId)
        .single()

      if (duplicateLookupError || !duplicatedCandidatura?.id) throw duplicateLookupError

      setCandidaturaId(duplicatedCandidatura.id)
      return duplicatedCandidatura.id
    }

    if (!createdCandidatura?.id) throw new Error('Impossibile creare la candidatura.')

    setCandidaturaId(createdCandidatura.id)
    return createdCandidatura.id
  }

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = draftMessage.trim()
    if (!trimmedMessage || !userId || isSending) return

    setIsSending(true)
    setErrorMessage(null)
    setDraftMessage('')

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      candidatura_id: candidaturaId ?? 'pending',
      mittente_id: userId,
      testo: trimmedMessage,
      created_at: new Date().toISOString()
    }

    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const targetCandidaturaId = await ensureCandidatura()

      const { data: insertedMessage, error: insertError } = await supabase
        .from('messaggi')
        .insert({
          candidatura_id: targetCandidaturaId,
          mittente_id: userId,
          testo: trimmedMessage
        })
        .select('id, candidatura_id, mittente_id, testo, created_at')
        .single()

      if (insertError || !insertedMessage) throw insertError

      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? insertedMessage : msg)))
    } catch (error) {
      console.error('Errore invio messaggio:', error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setDraftMessage(trimmedMessage)
      setErrorMessage('Invio non riuscito. Riprova tra qualche secondo.')
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !userId) return
    fetchConversation()
  }, [fetchConversation, isOpen, userId])

  useEffect(() => {
    if (!isOpen) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [isOpen])

  if (!userId) {
    return (
      <Link
        href={loginHref}
        className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-white ${buttonClassName}`}
      >
        Fai una domanda
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white ${buttonClassName}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.993 2.707 3.226 1.129.166 2.27.293 3.423.379.349.026.67.21.865.501L12 21l2.755-4.134a1.14 1.14 0 0 1 .865-.5 48.23 48.23 0 0 0 3.423-.38c1.584-.232 2.707-1.626 2.707-3.225V6.741c0-1.602-1.123-2.995-2.707-3.228A48.393 48.393 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        Fai una domanda
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Chiudi chat"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm animate-in fade-in duration-300"
          />

          <aside className="fixed inset-y-0 right-0 z-[110] flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.2)] animate-in slide-in-from-right duration-300">
            <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Chat associazione</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Scrivi a {associazioneNome}</h2>
                {!candidaturaId && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Al primo messaggio verrà creata automaticamente la tua candidatura.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
              {isLoadingConversation ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">Nessun messaggio ancora.</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">Scrivi la tua prima domanda all&apos;associazione.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.mittente_id === userId
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMine ? 'rounded-br-sm bg-slate-900 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
                        <p className="leading-relaxed">{message.testo}</p>
                        <p className={`mt-1 text-[10px] font-semibold ${isMine ? 'text-slate-300' : 'text-slate-400'}`}>
                          {new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
              {errorMessage && (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {errorMessage}
                </p>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Scrivi un messaggio..."
                  disabled={isSending}
                  className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSending || !draftMessage.trim()}
                  className="inline-flex h-12 min-w-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  ) : (
                    'Invia'
                  )}
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
