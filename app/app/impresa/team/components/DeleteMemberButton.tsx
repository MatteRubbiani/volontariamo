'use client'

import { useState } from 'react'
import { eliminaInvito, rimuoviDipendente } from '../actions'

interface Props {
  id: string
  tipo: 'invitato' | 'attivo'
}

export default function DeleteMemberButton({ id, tipo }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true)
      // Reset dopo 3 secondi se non clicca di nuovo
      setTimeout(() => setConfirm(false), 3000)
      return
    }

    setLoading(true)
    try {
      if (tipo === 'invitato') {
        await eliminaInvito(id)
      } else {
        await rimuoviDipendente(id)
      }
    } catch (err) {
      alert("Errore durante l'operazione")
      setConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all border-2 ${
        confirm 
          ? 'bg-red-500 border-red-500 text-white animate-pulse' 
          : 'bg-transparent border-slate-100 text-slate-400 hover:border-red-100 hover:text-red-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? '...' : confirm ? 'Sicuro?' : tipo === 'invitato' ? 'Annulla Invito' : 'Rimuovi'}
    </button>
  )
}