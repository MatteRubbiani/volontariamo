'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '../actions'
// Importiamo la funzione getTagColor invece dell'oggetto TAG_COLORS
import { getTagColor, DEFAULT_TAG_COLOR } from '@/lib/tagColors'

export default function VolontarioOnboarding() {
  const [tags, setTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from('tags').select('*').order('name')
      if (data) setTags(data)
    }
    fetchTags()
  }, [])

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    )
  }

  async function gestisciOnboarding(formData: FormData) {
    setIsLoading(true)
    try {
      await completeOnboarding(formData)
      window.location.assign('/dashboard/volontario')
    } catch (error) {
      window.location.assign('/dashboard/volontario')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <form 
        action={gestisciOnboarding} 
        className="max-w-xl w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Profilo Volontario 👤</h1>
          <p className="text-slate-500 font-medium">Dicci chi sei e cosa ti appassiona per iniziare.</p>
        </div>

        <input type="hidden" name="role" value="volontario" />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome Completo</label>
          <input 
            name="nome" 
            placeholder="Esempio: Mario Rossi" 
            className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-lg transition-all" 
            required 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">I tuoi interessi</label>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
              Selezionati: {selectedTags.length}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {tags.length > 0 ? (
              tags.map(t => {
                const isSelected = selectedTags.includes(t.id)
                // Usiamo la funzione a prova di bomba!
                const activeColorClass = getTagColor(t.name)

                return (
                  <button 
                    key={t.id}
                    type="button" 
                    onClick={() => toggleTag(t.id)}
                    className={`px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 ${
                      isSelected 
                        ? `${activeColorClass} shadow-lg scale-105` 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{t.name}
                  </button>
                )
              })
            ) : (
              <p className="text-sm text-slate-400 font-medium italic px-2">Caricamento categorie in corso...</p>
            )}
          </div>

          {selectedTags.map(tagId => (
            <input key={tagId} type="hidden" name="tags" value={tagId} />
          ))}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || selectedTags.length === 0}
          className={`w-full text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all text-xl ${
            isLoading || selectedTags.length === 0 
              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
          }`}
        >
          {isLoading ? 'Salvataggio in corso... ⏳' : 'Salva e Continua'}
        </button>
      </form>
    </div>
  )
}