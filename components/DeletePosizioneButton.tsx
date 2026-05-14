// src/components/DeletePosizioneButton.tsx
'use client'

import { useState, useTransition } from 'react'

export default function DeletePosizioneButton({ 
  deleteAction 
}: { 
  deleteAction: () => Promise<void> 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction()
      } catch (error) {
        console.error("Errore durante l'eliminazione:", error)
        setIsOpen(false)
      }
    })
  }

  return (
    <>
      {/* BOTTONE PREMIUM: Minimal, elegante e perfettamente allineato al layout */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M8.25 9l.568 9.5a2.25 2.25 0 0 0 2.25 2.25h3.864a2.25 2.25 0 0 0 2.25-2.25L15.75 9m-7.5 0h7.5m-7.5 0a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3m-7.5 0H2.25m15 0h4.5" />
        </svg>
        <span>Elimina Annuncio</span>
      </button>

      {/* MODALE PREMIUM OVERLAY CON Z-INDEX ASSOLUTO (z-[99999]) */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Evita chiusure se si clicca dentro la card
          >
            
            {/* Icona d'avviso */}
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Eliminare annuncio?
            </h3>
            
            <p className="text-slate-500 text-sm font-medium mt-2 mb-6">
              Questa azione è definitiva. Rimuoverai l'annuncio e tutte le candidature associate in modo irreversibile.
            </p>

            {/* Azioni Modale */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-sm transition-all duration-200"
              >
                Annulla
              </button>
              
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  "Conferma"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}