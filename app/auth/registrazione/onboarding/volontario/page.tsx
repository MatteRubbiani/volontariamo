'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '../actions'
import { getTagColor } from '@/lib/tagColors'

export default function VolontarioOnboarding() {
  const supabase = createClient()
  
  // Dati dal DB
  const [tags, setTags] = useState<any[]>([])
  const [competenze, setCompetenze] = useState<any[]>([])
  
  // Dati inseriti dall'utente
  const [nome, setNome] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCompetenze, setSelectedCompetenze] = useState<string[]>([])
  
  // Gestione UI
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Peschiamo in parallelo sia i tag che le competenze ufficiali
      const [tagsRes, compRes] = await Promise.all([
        supabase.from('tags').select('*').order('name'),
        supabase.from('competenze').select('*').eq('is_official', true).order('name')
      ])
      
      if (tagsRes.data) setTags(tagsRes.data)
      if (compRes.data) setCompetenze(compRes.data)
    }
    fetchData()
  }, [])

  const toggleTag = (id: string) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const toggleCompetenza = (id: string) => {
    setSelectedCompetenze(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function gestisciOnboarding(formData: FormData) {
    setIsLoading(true)
    try {
      await completeOnboarding(formData)
      window.location.assign('/app/volontario')
    } catch (error) {
      window.location.assign('/app/volontario')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      
      {/* BARRA DI PROGRESSO */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between mb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {step} di 3</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
            {step === 1 ? 'Identità' : step === 2 ? 'Interessi' : 'Superpoteri'}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form 
        action={gestisciOnboarding} 
        className="max-w-xl w-full bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100"
      >
        <input type="hidden" name="role" value="volontario" />
        {/* Usiamo input nascosti per conservare i dati dei passaggi precedenti */}
        <input type="hidden" name="nome" value={nome} />
        {selectedTags.map(id => <input key={`tag-${id}`} type="hidden" name="tags" value={id} />)}
        {selectedCompetenze.map(id => <input key={`comp-${id}`} type="hidden" name="competenze" value={id} />)}

        {/* ================= STEP 1: NOME ================= */}
        <div className={`space-y-8 transition-all ${step === 1 ? 'block' : 'hidden'}`}>
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Benvenuto! 👋</h1>
            <p className="text-slate-500 font-medium text-lg">Iniziamo dalle presentazioni. Come ti chiami?</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome Completo</label>
            <input 
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es: Mario Rossi" 
              className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-lg transition-all" 
              onKeyDown={(e) => { if (e.key === 'Enter' && nome.length > 1) { e.preventDefault(); setStep(2); } }}
            />
          </div>

          <button 
            type="button" 
            onClick={() => setStep(2)}
            disabled={nome.length < 2}
            className="w-full bg-slate-900 text-white disabled:bg-slate-300 font-black py-5 rounded-[2rem] transition-all text-lg active:scale-[0.98]"
          >
            Avanti
          </button>
        </div>

        {/* ================= STEP 2: TAG (IL CUORE) ================= */}
        <div className={`space-y-8 transition-all ${step === 2 ? 'block' : 'hidden'}`}>
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Il tuo cuore ❤️</h1>
            <p className="text-slate-500 font-medium text-lg">Seleziona almeno una causa che vuoi sostenere.</p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {tags.length > 0 ? tags.map(t => {
              const isSelected = selectedTags.includes(t.id)
              const activeColorClass = getTagColor(t.name)
              return (
                <button 
                  key={t.id} type="button" onClick={() => toggleTag(t.id)}
                  className={`px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 ${isSelected ? `${activeColorClass} shadow-lg scale-105` : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                >
                  #{t.name}
                </button>
              )
            }) : <p className="text-slate-400 animate-pulse">Caricamento interessi...</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-slate-100 text-slate-600 font-black py-5 rounded-[2rem] transition-all">
              Indietro
            </button>
            <button type="button" onClick={() => setStep(3)} disabled={selectedTags.length === 0} className="w-2/3 bg-slate-900 text-white disabled:bg-slate-300 font-black py-5 rounded-[2rem] transition-all active:scale-[0.98]">
              Avanti
            </button>
          </div>
        </div>

        {/* ================= STEP 3: COMPETENZE (LE MANI) ================= */}
        <div className={`space-y-8 transition-all ${step === 3 ? 'block' : 'hidden'}`}>
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Le tue mani 🔧</h1>
            <p className="text-slate-500 font-medium text-lg">Quali sono i tuoi superpoteri pratici? (Opzionale ma consigliato)</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center">
            {competenze.length > 0 ? competenze.map(c => {
              const isSelected = selectedCompetenze.includes(c.id)
              return (
                <button
                  key={c.id} type="button" onClick={() => toggleCompetenza(c.id)}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-300 flex items-center gap-2 ${isSelected ? 'bg-slate-800 text-slate-100 border-slate-800 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-70">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.15-.665-.118-.9l-2.276-1.989a.678.678 0 00-.923.116l-2.43 2.956m-1.75 1.75l-2.956 2.43a.678.678 0 01-.923-.116l-1.989-2.276c-.244-.268-.177-.667.04-.9l2.492-3.053m1.75-1.75l-2.43-2.956a.678.678 0 01.116-.923l2.276-1.989c.234-.205.597-.176.804.068l3.053 3.515m-1.75 1.75l3.053-2.492c.266-.217.665-.15.9-.118l1.989 2.276c.205.234.176.597-.068.804l-2.956 2.43" />
                  </svg>
                  {c.name}
                </button>
              )
            }) : <p className="text-slate-400 animate-pulse">Caricamento competenze...</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-slate-100 text-slate-600 font-black py-5 rounded-[2rem] transition-all">
              Indietro
            </button>
            <button type="submit" disabled={isLoading} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none font-black py-5 rounded-[2rem] transition-all active:scale-[0.98]">
              {isLoading ? 'Inizio... 🚀' : 'Inizia la Missione! 🚀'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}