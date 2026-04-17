'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import PosizioneCard from '@/components/PosizioneCard'
import MappaWrapper from '@/components/MappaWrapper'
import FiltriRicercaV2 from '@/components/FiltriRicercaV2'

interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

function getBoundsFromCenter(lat: number, lng: number): MapBounds {
  const raggioKm = 15; 
  const latOffset = raggioKm / 111.32;
  const lngOffset = raggioKm / (111.32 * Math.cos(lat * (Math.PI / 180)));
  return {
    sw: { lat: lat - latOffset, lng: lng - lngOffset },
    ne: { lat: lat + latOffset, lng: lng + lngOffset }
  };
}

export default function VistaEsplora() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [posizioni, setPosizioni] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  
  // 📱 STATI PER IL DRAGGING PREMIUM
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0) 
  const pointerStartY = useRef<number | null>(null)
  const wasDragging = useRef(false) // 🚨 Impedisce al click di invertire il drag
  
  const boundsRef = useRef<MapBounds | null>(null)
  const isFirstLoad = useRef(true)
  const checkedCap = useRef(false)

  useEffect(() => {
    setScreenHeight(window.innerHeight)
    const handleResize = () => setScreenHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const q = searchParams.get('q') || null
  const tipo = searchParams.get('tipo') || null
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const tagsStr = searchParams.get('tags')
  const competenzeStr = searchParams.get('competenze')
  const filterTags = tagsStr ? tagsStr.split(',') : null
  const filterCompetenze = competenzeStr ? competenzeStr.split(',') : null

  const selectedPos = posizioni.find(p => p.id === focusedId)

  // 📱 LOGICA DI TRASCINAMENTO (POINTER EVENTS)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerStartY.current = e.clientY
    setIsDragging(true)
    wasDragging.current = false
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pointerStartY.current === null) return
    const currentY = e.clientY
    const deltaY = currentY - pointerStartY.current

    // Se muovo di più di 5px, considero che sto trascinando (non è un click)
    if (Math.abs(deltaY) > 5) wasDragging.current = true

    if (isDrawerOpen) {
      setDragY(Math.max(0, deltaY)) // Da aperta può solo scendere
    } else {
      setDragY(Math.min(0, deltaY)) // Da chiusa può solo salire
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)

    // SOGLIA DI AGGANCIO (50px per un feeling reattivo)
    const threshold = 50
    if (dragY < -threshold && !isDrawerOpen) {
      setIsDrawerOpen(true)
    } else if (dragY > threshold && isDrawerOpen) {
      setIsDrawerOpen(false)
      setFocusedId(null)
    }

    setDragY(0)
    pointerStartY.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // LOGICA AUTOCENTER & FETCH
  useEffect(() => {
    async function autoCenterUser() {
      if (checkedCap.current) return
      checkedCap.current = true
      if (searchParams.get('lat') || searchParams.get('indirizzo')) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: vol } = await supabase.from('volontari').select('cap, citta_residenza').eq('id', user.id).single()
      if (vol?.cap) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${vol.cap}&country=italy&format=json`)
          const data = await res.json()
          if (data && data.length > 0) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('lat', data[0].lat)
            params.set('lng', data[0].lon)
            params.set('indirizzo', vol.citta_residenza || vol.cap) 
            router.replace(`?${params.toString()}`)
          }
        } catch (err) { console.error(err) }
      }
    }
    autoCenterUser()
  }, [searchParams, router, supabase])

  const fetchPosizioni = async (targetBounds: MapBounds) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('ricerca_avanzata_posizioni', {
        min_lat: targetBounds.sw.lat,
        min_lng: targetBounds.sw.lng,
        max_lat: targetBounds.ne.lat,
        max_lng: targetBounds.ne.lng,
        search_q: q,
        filter_tipo: tipo,
        filter_tags: filterTags,
        filter_competenze: filterCompetenze
      })
      if (error) throw error
      const formattedData = (data || []).map((pos: any) => ({
        ...pos,
        tags: pos.tags ? pos.tags.map((t: string) => ({ id: t, name: t })) : [],
        competenze: pos.competenze ? pos.competenze.map((c: string) => ({ id: c, name: c })) : []
      }))
      setPosizioni(formattedData)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleMapReady = useCallback((initialBounds: MapBounds) => {
    boundsRef.current = initialBounds;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (!lat || !lng) fetchPosizioni(initialBounds);
    }
  }, [lat, lng, q, tipo, tagsStr, competenzeStr])

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (lat && lng) {
      const calcBounds = getBoundsFromCenter(lat, lng);
      boundsRef.current = calcBounds; 
      fetchPosizioni(calcBounds);
    } else if (boundsRef.current) fetchPosizioni(boundsRef.current);
  }, [q, tipo, tagsStr, competenzeStr, lat, lng])

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-76px)] overflow-hidden relative bg-white">
      
      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[50%] h-full overflow-y-auto p-6 md:p-8 lg:p-10 flex-col gap-6 order-2 lg:order-1 bg-slate-50 relative z-10">
        <div className="flex justify-between items-end border-b border-slate-200 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Esplora</h1>
          <div className="text-right">
            <span className="text-3xl font-black text-blue-600 leading-none">{posizioni.length}</span>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Trovate</p>
          </div>
        </div>
        <div className="-mx-2"><FiltriRicercaV2 /></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
          {posizioni.map((pos: any) => (
            <div key={pos.id} id={`card-${pos.id}`}>
              <PosizioneCard 
                posizione={pos} 
                isHovered={hoveredId === pos.id}
                isFocused={focusedId === pos.id}
                onMouseEnter={() => setHoveredId(pos.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AREA MAPPA / MOBILE */}
      <div className="w-full h-full lg:w-[45%] xl:w-[50%] order-1 lg:order-2 z-20 relative overflow-hidden">
        
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[999]">
          <button 
            onClick={() => boundsRef.current && fetchPosizioni(boundsRef.current)}
            disabled={loading}
            className="group flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-slate-700 shadow-lg ring-1 ring-slate-900/5 hover:scale-105 active:scale-95 transition-all"
          >
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
            {loading ? 'Ricerca...' : "Cerca qui"}
          </button>
        </div>

        <MappaWrapper 
          posizioni={posizioni} 
          hoveredId={hoveredId}    
          setHoveredId={setHoveredId} 
          focusedId={focusedId}    
          setFocusedId={(id: string) => { setFocusedId(id); if (id) setIsDrawerOpen(false); }}
          onMapReady={handleMapReady}
          onBoundsChange={(b: any) => { boundsRef.current = b }} 
          forcedLat={lat} forcedLng={lng} forcedZoom={12} 
        />

        {/* CARD FLUTTUANTE MOBILE */}
        {selectedPos && !isDrawerOpen && (
          <div className="lg:hidden absolute bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-4 right-4 z-[1001] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 pointer-events-none">
            <button onClick={() => setFocusedId(null)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-full text-slate-700 shadow-lg pointer-events-auto transition-colors active:bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 pointer-events-auto">
              <PosizioneCard posizione={selectedPos} />
            </div>
          </div>
        )}

        {/* 📱 TENDINA DRAWER PREMIUM */}
        <div 
          className={`lg:hidden absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border-t border-slate-100 flex flex-col ${!isDragging ? 'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}`}
          style={{ 
            height: '85dvh',
            transform: `translateY(${
              isDrawerOpen 
                ? Math.max(0, dragY) 
                : Math.min(0, dragY) + (screenHeight ? (screenHeight * 0.85 - 100) : 600)
            }px)`,
            touchAction: 'none'
          }}
        >
          {/* AREA MANIGLIA */}
          <div 
            className="w-full h-[100px] flex-shrink-0 flex flex-col items-center justify-start pt-4 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => { 
               // Solo se non stavo trascinando, permetto il toggle al click
               if (!wasDragging.current) setIsDrawerOpen(!isDrawerOpen); 
            }}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">
              {isDrawerOpen ? 'Scorri per chiudere' : `Vedi ${posizioni.length} posizioni`}
            </span>
          </div>

          <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] overflow-y-auto flex-grow flex flex-col gap-6">
            <FiltriRicercaV2 />
            <div className="flex flex-col gap-4">
              {posizioni.map((pos: any) => (
                <div key={pos.id} onClick={() => { if (!wasDragging.current) { setFocusedId(pos.id); setIsDrawerOpen(false); } }}>
                  <PosizioneCard posizione={pos} isHovered={hoveredId === pos.id} isFocused={focusedId === pos.id} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}