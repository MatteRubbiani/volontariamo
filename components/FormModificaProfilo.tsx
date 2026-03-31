'use client'

import { useState } from 'react'
import { getTagColor } from '@/lib/tagColors'

export default function FormModificaProfilo({
  isVolontario,
  profilo,
  allTags = [],
  tagsIniziali = [],
  salvaAction
}: {
  isVolontario: boolean
  profilo: any
  allTags?: any[]
  tagsIniziali?: string[]
  salvaAction: (formData: FormData) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await salvaAction(formData)
      // Hard reload per aggiornare Navbar e Profilo
      window.location.assign('/profilo')
    } catch (error) {
      window.location.assign('/profilo')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
      <input type="hidden" name="role" value={isVolontario ? 'volontario' : 'associazione'} />
      
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
          Nome {isVolontario ? 'Completo' : 'Associazione'}
        </label>
        <input 
          name="nome" 
          defaultValue={isVolontario ? profilo.nome_completo : profilo.nome} 
          className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-lg transition-all" 
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
          {isVolontario ? 'Bio' : 'Descrizione'}
        </label>
        <textarea 
          name="bio" 
          defaultValue={isVolontario ? profilo.bio : profilo.descrizione} 
          className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium h-32 transition-all" 
        />
      </div>

      {isVolontario && (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest block">
            I tuoi Interessi (Clicca per selezionare)
          </label>
          <div className="flex flex-wrap gap-3">
            {allTags.map(t => {
              const isSelected = tagSelezionati.includes(t.id)
              const activeColorClass = getTagColor(t.name)

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 block ${
                    isSelected
                      ? `${activeColorClass} shadow-lg scale-105`
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  #{t.name}
                </button>
              )
            })}
          </div>
          
          {/* Input nascosti per i tag in modo che arrivino al server */}
          {tagSelezionati.map(id => (
            <input key={id} type="hidden" name="tags" value={id} />
          ))}
        </div>
      )}

      <div className="flex gap-4 pt-8 border-t border-slate-100">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`flex-1 font-black text-lg py-5 rounded-[2rem] shadow-xl transition-all active:scale-[0.98] ${
            isSubmitting 
              ? 'bg-slate-400 text-white shadow-none cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}
        >
          {isSubmitting ? 'SALVATAGGIO...' : 'SALVA MODIFICHE'}
        </button>
        <a href="/profilo" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-center flex items-center justify-center font-black text-lg py-5 rounded-[2rem] transition-all">
          ANNULLA
        </a>
      </div>
    </form>
  )
}