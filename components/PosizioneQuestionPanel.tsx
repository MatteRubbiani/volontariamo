'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import SharedChatWidget from '@/components/SharedChatWidget'
import { MessageSquare, X, Sparkles, Loader2 } from 'lucide-react'

interface PosizioneQuestionPanelProps {
  posizioneId: string
  associazioneNome: string
  userId: string | null
  loginHref: string
  initialCandidaturaId: string | null
  buttonClassName?: string
}

export default function PosizioneQuestionPanel({
  posizioneId,
  associazioneNome,
  userId,
  loginHref,
  buttonClassName = ''
}: PosizioneQuestionPanelProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [targetAssociazioneId, setTargetAssociazioneId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenChat = async () => {
    if (!userId) {
      router.push(loginHref)
      return
    }

    if (targetAssociazioneId) {
      setIsOpen(true)
      return
    }

    setIsInitializing(true)
    try {
      const { data, error } = await supabase
        .from('posizioni')
        .select('associazione_id')
        .eq('id', posizioneId)
        .single()

      if (error) throw error

      if (data?.associazione_id) {
        setTargetAssociazioneId(data.associazione_id)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Errore durante il recupero dell\'associazione:', error)
      alert('Impossibile avviare la chat. Riprova più tardi.')
    } finally {
      setIsInitializing(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center items-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      
      {/* SFONDO CLICCABILE PER CHIUDERE SU DESKTOP */}
      <div 
        className="absolute inset-0 hidden sm:block" 
        onClick={() => setIsOpen(false)} 
      />

      {/* 
        🎯 SCHEDA CHAT PROPORZIONATA:
        - MOBILE: 100dvh (Schermo intero nativo per smartphone)
        - DESKTOP: h-[580px] max-w-[480px] arrotondato con ombra morbida
      */}
      <div 
        className="bg-white w-full h-[100dvh] sm:h-[580px] sm:max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col relative z-10 overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER CHAT */}
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-950 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              {associazioneNome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 truncate">{associazioneNome}</h3>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-500 shrink-0" />
                <span>Messaggistica Diretta</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-90"
            title="Chiudi chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 💬 WIDGET CHAT */}
        <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col relative">
          {targetAssociazioneId && userId && (
            <SharedChatWidget 
              volontarioId={userId} 
              associazioneId={targetAssociazioneId} 
              currentUserId={userId} 
              posizioneId={posizioneId} 
            />
          )}
        </div>

      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={handleOpenChat}
        disabled={isInitializing}
        className={buttonClassName || "w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200/60 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"}
      >
        {isInitializing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            <span>Apertura...</span>
          </div>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Fai una domanda</span>
          </>
        )}
      </button>

      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  )
}