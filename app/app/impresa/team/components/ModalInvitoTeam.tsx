'use client'

import { useState, useActionState } from 'react'
import { creaInvito } from '@/app/app/impresa/team/actions'

export default function ModalInvitoTeam() {
  const [isOpen, setIsOpen] = useState(false)
  
  // useActionState è l'hook di React 19 per gestire form asincroni (ex useFormState)
  const [state, formAction, isPending] = useActionState(creaInvito, null)

  // Generiamo il magic link completo per facilitare i test
  const magicLink = state?.token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/accetta-invito?token=${state.token}` : ''

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-violet-600 hover:bg-violet-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
      >
        + Invita Dipendenti
      </button>
    )
  }

  return (
    <>
      {/* Sfondo scuro */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      
      {/* Modale */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-100 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800">Invita nel Team</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
        </div>

        {state?.success ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <div>
              <p className="font-bold text-slate-800 text-lg">Invito generato!</p>
              <p className="text-sm text-slate-500 mt-2">Condividi questo link con il dipendente per farlo unire alla tua azienda:</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 break-all">
              <code className="text-xs text-violet-600 font-bold">{magicLink}</code>
            </div>
            <button onClick={() => { setIsOpen(false); /* Reset state ideally */ }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 rounded-2xl transition-all">
              Chiudi
            </button>
          </div>
        ) : (
          <form action={formAction} className="space-y-6">
            <p className="text-sm text-slate-600 font-medium">
              Inserisci l'indirizzo email aziendale del dipendente che vuoi invitare nel programma ESG.
            </p>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Email Dipendente</label>
              <input 
                type="email" 
                name="email"
                required
                placeholder="mario.rossi@azienda.com" 
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-medium outline-none focus:border-violet-500 focus:bg-white transition-all" 
              />
            </div>

            {state?.error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                {state.error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all ${isPending ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'}`}
            >
              {isPending ? 'Generazione...' : 'Genera Invito'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}