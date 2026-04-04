'use client'

import { useState } from 'react'

export default function CompetenzaSelector({ 
  allCompetenze, 
  competenzeIniziali 
}: { 
  allCompetenze: any[], 
  competenzeIniziali: string[] 
}) {
  const [selezionate, setSelezionate] = useState<string[]>(competenzeIniziali)

  const toggleCompetenza = (id: string) => {
    setSelezionate(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        {allCompetenze.map(c => {
          const isSelected = selezionate.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCompetenza(c.id)}
              className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-800 text-slate-100 border-slate-800 shadow-md scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.15-.665-.118-.9l-2.276-1.989a.678.678 0 00-.923.116l-2.43 2.956m-1.75 1.75l-2.956 2.43a.678.678 0 01-.923-.116l-1.989-2.276c-.244-.268-.177-.667.04-.9l2.492-3.053m1.75-1.75l-2.43-2.956a.678.678 0 01.116-.923l2.276-1.989c.234-.205.597-.176.804.068l3.053 3.515m-1.75 1.75l3.053-2.492c.266-.217.665-.15.9-.118l1.989 2.276c.205.234.176.597-.068.804l-2.956 2.43" />
              </svg>
              {c.name}
            </button>
          )
        })}
      </div>
      
      {/* Input nascosti per inviare le competenze selezionate alla Server Action */}
      {selezionate.map(id => (
        <input key={`comp-${id}`} type="hidden" name="competenze" value={id} />
      ))}
    </div>
  )
}