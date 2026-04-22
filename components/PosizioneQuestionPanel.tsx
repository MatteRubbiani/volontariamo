'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import SharedChatWidget from '@/components/SharedChatWidget'

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
  initialCandidaturaId,
  buttonClassName = ''
}: PosizioneQuestionPanelProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [candidaturaId, setCandidaturaId] = useState<string | null>(initialCandidaturaId)
  const [isInitializing, setIsInitializing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleOpenChat = async () => {
    // 1. Se non è loggato, lo mandiamo al login
    if (!userId) {
      router.push(loginHref)
      return
    }

    // 2. Se ha già una candidatura, apriamo subito il modal
    if (candidaturaId) {
      setIsOpen(true)
      return
    }

    // 3. Se non ha la candidatura, la creiamo in modo "silenzioso"
    setIsInitializing(true)
    try {
      const { data, error } = await supabase
        .from('candidature')
        .insert({
          posizione_id: posizioneId,
          volontario_id: userId,
          stato: 'in_attesa' // Lo mettiamo in attesa, così l'associazione lo vede nei "Nuovi"
        })
        .select('id')
        .single()

      if (error) throw error

      if (data) {
        setCandidaturaId(data.id)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Errore durante la creazione della chat:', error)
      alert('Impossibile avviare la chat. Riprova più tardi.')
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <>
      {/* BOTTONE "FAI UNA DOMANDA" */}
      <button
        onClick={handleOpenChat}
        disabled={isInitializing}
        className={`flex items-center justify-center font-semibold py-3.5 rounded-xl text-sm border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        {isInitializing ? (
          <div className="flex items-center gap-2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            <span>Apertura...</span>
          </div>
        ) : (
          <span>Fai una domanda</span>
        )}
      </button>

      {/* MODAL DELLA CHAT (Stesso design premium dell'associazione) */}
      {isOpen && candidaturaId && userId && (
        <>
          {/* BACKDROP */}
<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9990] animate-in fade-in duration-300" />

{/* CONTENITORE MODAL */}
<div 
  className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
  onClick={() => setIsOpen(false)}
>
            {/* CARD BIANCA */}
            <div 
              className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] h-[600px] animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER DEL MODAL */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-md">
                    {associazioneNome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Chat con l'Associazione</h3>
                    <p className="text-sm font-medium text-slate-500">{associazioneNome}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* CONTENITORE CHAT CONDIVISA */}
              <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-50 flex flex-col relative">
                {/* Passiamo il candidaturaId appena generato (o quello vecchio) 
                  e lo userId del volontario. Il componente SharedChatWidget farà il resto! 
                */}
                <SharedChatWidget candidaturaId={candidaturaId} currentUserId={userId} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}