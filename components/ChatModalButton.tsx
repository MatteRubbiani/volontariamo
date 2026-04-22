'use client'

import { useState } from 'react'
import SharedChatWidget from '@/components/SharedChatWidget'

interface ChatModalButtonProps {
  candidaturaId: string
  associazioneId: string
  titoloPosizione: string
}

export default function ChatModalButton({ candidaturaId, associazioneId, titoloPosizione }: ChatModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* IL BOTTONE ORIGINALE */}
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-200 transition-all text-center flex-1 lg:flex-none"
      >
        Chatta 💬
      </button>

      {/* IL MODAL CHE SI APRE AL CLICK */}
      {isOpen && (
        <>
          {/* BACKDROP */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300" />

          {/* CONTENITORE MODAL */}
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsOpen(false)}
          >
            {/* CARD */}
            <div 
              className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Chat Volontario</h3>
                  <p className="text-sm font-medium text-slate-500">Rif: {titoloPosizione}</p>
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
              <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-50 flex flex-col">
                <SharedChatWidget candidaturaId={candidaturaId} currentUserId={associazioneId} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}