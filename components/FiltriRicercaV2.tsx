'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

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
  const [raggio, setRaggio] = useState(searchParams.get('raggio') || '15')
  
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
    
    params.set('raggio', raggio)

    // Geocoding gratuito
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
    <div className="flex flex-col gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        <input 
          type="text" 
          placeholder="Cosa vuoi fare?" 
          className="flex-grow bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Città..." 
          className="md:w-1/4 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
          value={indirizzo}
          onChange={(e) => setIndirizzo(e.target.value)}
        />
        <select 
          className="md:w-32 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          value={raggio}
          onChange={(e) => setRaggio(e.target.value)}
        >
          <option value="5">+5 km</option>
          <option value="15">+15 km</option>
          <option value="50">+50 km</option>
        </select>
        <button type="submit" disabled={isSearching} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
          {isSearching ? '...' : 'CERCA'}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ambiti</span>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {dbTags.map(tag => (
            <button key={tag.id} type="button" onClick={() => handleTagToggle(tag.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedTags.includes(tag.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'
              }`}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Competenze</span>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {dbComp.map(c => (
            <button key={c.id} type="button" onClick={() => handleCompToggle(c.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedComp.includes(c.id) ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}