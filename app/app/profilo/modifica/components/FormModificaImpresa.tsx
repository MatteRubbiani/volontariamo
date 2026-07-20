// src/app/profilo/modifica/components/FormModificaImpresa.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FormModificaImpresa({ profilo, salvaAction }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('role', 'impresa')
    try {
      const result = await salvaAction(formData)
      if (result?.error) { setError(result.error); setLoading(false); } 
      else { router.push('/profilo'); router.refresh(); }
    } catch (err) { setError("Errore di salvataggio"); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 pb-32 max-w-4xl mx-auto px-4 md:px-0 mt-6">
      {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold">{error}</div>}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-900">Anagrafica Aziendale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Ragione Sociale *</label>
            <input type="text" name="ragione_sociale" defaultValue={profilo.ragione_sociale} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" required />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Partita IVA / C.F. *</label>
            <input type="text" name="partita_iva" defaultValue={profilo.partita_iva} className="w-full bg-slate-100 rounded-2xl px-6 py-4 font-mono font-bold border-none" readOnly />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Settore Industriale</label>
            <input type="text" name="settore" defaultValue={profilo.settore} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" placeholder="es. Manifatturiero, IT..." />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-900">Sede e Contatti</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Indirizzo Sede Legale</label>
            <input type="text" name="indirizzo" defaultValue={profilo.indirizzo} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Città</label>
            <input type="text" name="citta" defaultValue={profilo.citta} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Email di Riferimento</label>
            <input type="email" name="email_contatto" defaultValue={profilo.email_contatto} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Telefono</label>
            <input type="tel" name="telefono" defaultValue={profilo.telefono} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Sito Web</label>
            <input type="url" name="sito_web" defaultValue={profilo.sito_web} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-900">Referente CSR / HR</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Nome e Cognome Referente</label>
            <input type="text" name="referente_nome" defaultValue={profilo.referente_nome} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Ruolo Aziendale</label>
            <input type="text" name="referente_ruolo" defaultValue={profilo.referente_ruolo} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" placeholder="es. HR Manager" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-6 z-50">
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-lg">
          {loading ? 'Salvataggio in corso...' : 'Salva Profilo Aziendale'}
        </button>
      </div>
    </form>
  )
}