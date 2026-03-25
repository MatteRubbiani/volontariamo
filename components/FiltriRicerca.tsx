'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function FiltriRicerca({ allTags }: { allTags: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Inizializziamo i campi leggendo l'URL attuale (così se ricarichi la pagina, i filtri restano)
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [dove, setDove] = useState(searchParams.get('dove') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '')
  const [tagSelezionato, setTagSelezionato] = useState(searchParams.get('tag') || '')

  const applicaFiltri = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Costruiamo il nuovo URL con i parametri
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (dove) params.set('dove', dove)
    if (tipo) params.set('tipo', tipo)
    if (tagSelezionato) params.set('tag', tagSelezionato)

    // Aggiorniamo la pagina senza ricaricarla davvero (magia di Next.js)
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFiltri = () => {
    setQ('')
    setDove('')
    setTipo('')
    setTagSelezionato('')
    router.push(pathname) // Torna all'URL pulito
  }

  return (
    <form 
      onSubmit={applicaFiltri} 
      className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-10 space-y-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">🔍 Ricerca Avanzata</h2>
        {/* Mostriamo il tasto Reset solo se c'è almeno un filtro attivo nell'URL */}
        {searchParams.toString() && (
          <button 
            type="button" 
            onClick={resetFiltri}
            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 px-4 py-2 rounded-full"
          >
            Rimuovi Filtri
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cerca nel Testo */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Parola Chiave</label>
          <input 
            type="text" 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            placeholder="es. Mensa, Bambini..." 
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
          />
        </div>

        {/* Cerca Luogo */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Città o Zona</label>
          <input 
            type="text" 
            value={dove} 
            onChange={(e) => setDove(e.target.value)}
            placeholder="es. Roma, Milano..." 
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
          />
        </div>

        {/* Filtro Tipo */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Frequenza</label>
          <select 
            value={tipo} 
            onChange={(e) => setTipo(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="">Qualsiasi</option>
            <option value="una_tantum">Solo Eventi Singoli</option>
            <option value="ricorrente">Solo Ricorrenti</option>
          </select>
        </div>

        {/* Filtro Categorie (Tags) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoria</label>
          <select 
            value={tagSelezionato} 
            onChange={(e) => setTagSelezionato(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tutte le categorie</option>
            {allTags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>

      <button 
        type="submit" 
        className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
      >
        Trova Posizioni
      </button>

    </form>
  )
}