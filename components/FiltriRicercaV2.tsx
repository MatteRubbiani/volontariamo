'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// 🚨 IMPORTIAMO I TUOI BADGE UFFICIALI
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

export default function FiltriRicercaV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [dbTags, setDbTags] = useState<any[]>([])
  const [dbComp, setDbComp] = useState<any[]>([])

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [indirizzo, setIndirizzo] = useState(searchParams.get('indirizzo') || '')
  
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('tags')?.split(',').filter(Boolean) || [])
  const [selectedComp, setSelectedComp] = useState<string[]>(searchParams.get('competenze')?.split(',').filter(Boolean) || [])

  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: t } = await supabase.from('tags').select('*').order('name')
      const { data: c } = await supabase.from('competenze').select('*').order('name')
      if (t) setDbTags(t); if (c) setDbComp(c);
    }
    loadData()
  }, [])

  const handleTagToggle = (id: string) => {
    let newList = [...selectedTags]
    if (newList.includes(id)) newList = newList.filter(i => i !== id)
    else newList.push(id)
    setSelectedTags(newList)
    updateUrl({ tags: newList.length > 0 ? newList.join(',') : null })
  }

  const handleCompToggle = (id: string) => {
    let newList = [...selectedComp]
    if (newList.includes(id)) newList = newList.filter(i => i !== id)
    else newList.push(id)
    setSelectedComp(newList)
    updateUrl({ competenze: newList.length > 0 ? newList.join(',') : null })
  }

  const updateUrl = (newParams: any) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) params.set(key, newParams[key])
      else params.delete(key)
    })
    router.push(`?${params.toString()}`)
  }

  const handleSearch = async (e?: any) => {
    if (e) e.preventDefault()
    setIsSearching(true)
    
    const params = new URLSearchParams(searchParams.toString())
    if (query) params.set('q', query)
    else params.delete('q')
    
    if (indirizzo) params.set('indirizzo', indirizzo)
    else params.delete('indirizzo')

    if (indirizzo && indirizzo !== searchParams.get('indirizzo')) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indirizzo)}`)
        const data = await res.json()
        if (data && data.length > 0) {
          params.set('lat', data[0].lat)
          params.set('lng', data[0].lon)
        }
      } catch (err) {
        console.error("Geocoding error", err)
      }
    } else if (!indirizzo) {
      params.delete('lat'); params.delete('lng');
    }

    router.push(`?${params.toString()}`)
    setIsSearching(false)
  }

  return (
    <div className="flex flex-col gap-5 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        <input 
          type="text" 
          placeholder="Cosa vuoi fare?" 
          className="flex-grow bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Città o indirizzo..." 
          className="md:w-1/3 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          value={indirizzo}
          onChange={(e) => setIndirizzo(e.target.value)}
        />
        <button type="submit" disabled={isSearching} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
          {isSearching ? '...' : 'CERCA'}
        </button>
      </form>

      {/* AMBITI CON TAG BADGE */}
      <div className="flex flex-col gap-2 mt-1">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ambiti</span>
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar items-center">
          {dbTags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button 
                key={tag.id} 
                type="button" 
                onClick={() => handleTagToggle(tag.id)}
                className={`transition-all flex-shrink-0 rounded-xl outline-none ${
                  isSelected 
                    ? 'scale-105 ring-2 ring-blue-500 ring-offset-2 shadow-md opacity-100 z-10' 
                    : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                }`}
              >
                <TagBadge nome={tag.name} size="md" />
              </button>
            )
          })}
        </div>
      </div>

      {/* COMPETENZE CON COMPETENZA BADGE */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Competenze</span>
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar items-center">
          {dbComp.map(c => {
            const isSelected = selectedComp.includes(c.id);
            return (
              <button 
                key={c.id} 
                type="button" 
                onClick={() => handleCompToggle(c.id)}
                className={`transition-all flex-shrink-0 rounded-lg outline-none ${
                  isSelected 
                    ? 'scale-105 ring-2 ring-slate-800 ring-offset-2 shadow-md opacity-100 z-10' 
                    : 'opacity-50 hover:opacity-100 hover:scale-105'
                }`}
              >
                <CompetenzaBadge nome={c.name} />
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}