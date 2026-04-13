'use client'

import { useState } from 'react'

export default function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  
  // Generiamo il link dinamicamente in base a dove si trova l'app
  const link = typeof window !== 'undefined' 
    ? `${window.location.origin}/accetta-invito?token=${token}` 
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Errore durante la copia:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all ${
        copied 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700'
      }`}
    >
      {copied ? '✓ Copiato' : '🔗 Copia Link'}
    </button>
  )
}