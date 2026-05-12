// src/app/profilo/modifica/components/FormModificaVolontario.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TagBadge from '@/components/TagBadge'

export default function FormModificaVolontario({ 
  profilo, 
  allTags, 
  tagsIniziali, 
  salvaAction 
}: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])

  const handleToggleTag = (id: string) => {
    setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('tags_selezionati', JSON.stringify(tags))
    formData.append('role', 'volontario')
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
        <h2 className="text-xl font-black text-slate-900">Dati Anagrafici</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Nome</label>
            <input type="text" name="nome" defaultValue={profilo.nome} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" required />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Cognome</label>
            <input type="text" name="cognome" defaultValue={profilo.cognome} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" required />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Codice Fiscale</label>
            <input type="text" name="codice_fiscale" defaultValue={profilo.codice_fiscale} className="w-full bg-slate-100 rounded-2xl px-6 py-4 font-mono font-bold border-none" readOnly />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-900">Aree di Interesse</h2>
        <p className="text-xs text-slate-400 font-medium">Seleziona le cause per cui vorresti fare volontariato.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {allTags?.map((tag: any) => {
            const active = tags.includes(tag.id)
            return (
              <button key={tag.id} type="button" onClick={() => handleToggleTag(tag.id)} className={`transition-all rounded-xl ${active ? 'ring-2 ring-emerald-600 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                <TagBadge nome={tag.name} categoria={tag.categoria} size="md" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-900">Su di te</h2>
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Biografia / Note</label>
          <textarea name="bio" defaultValue={profilo.bio} rows={5} className="w-full bg-slate-50 rounded-[2rem] px-8 py-6 font-medium border-none outline-none resize-none" placeholder="Racconta qualcosa sulle tue motivazioni..." />
        </div>
      </div>

      <div className="sticky bottom-6 z-50">
        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50 text-lg">
          {loading ? 'Salvataggio in corso...' : 'Conferma Modifiche'}
        </button>
      </div>
    </form>
  )
}