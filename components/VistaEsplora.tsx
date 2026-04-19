'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import PosizioneCard from '@/components/PosizioneCard'
import MappaWrapper from '@/components/MappaWrapper'
import SearchPill from '@/components/SearchPill'

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
  
  // 📱 STATI PER IL DRAGGING E MAPPA
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStartY = useRef<number | null>(null)
  const wasDragging = useRef(false)
  const boundsRef = useRef<MapBounds | null>(null)
  const isFirstLoad = useRef(true)
  const checkedCap = useRef(false)
  const debounceTimer = useRef<any>(null)

  // 🚨 ESTRAZIONE PARAMETRI (Con fix per il loop infinito)
  const q = searchParams.get('q') || null
  const tipo = searchParams.get('tipo') || null
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  
  const tagsStr = searchParams.get('tags') || null
  const competenzeStr = searchParams.get('competenze') || null
  const filterData = searchParams.get('data') || null
  const giorniStr = searchParams.get('giorni') || null // <- Usiamo la stringa per le dipendenze!

  const filterTags = tagsStr ? tagsStr.split(',') : null
  const filterCompetenze = competenzeStr ? competenzeStr.split(',') : null
  const filterGiorni = giorniStr ? giorniStr.split(',') : null

  const selectedPos = posizioni.find(p => p.id === focusedId)

  // --- LOGICA DI DRAGGING MAPPA ---
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
    if (Math.abs(deltaY) > 5) wasDragging.current = true
    if (isDrawerOpen) setDragY(Math.max(0, deltaY)) 
    else setDragY(Math.min(0, deltaY)) 
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 50
    if (dragY < -threshold && !isDrawerOpen) setIsDrawerOpen(true)
    else if (dragY > threshold && isDrawerOpen) { setIsDrawerOpen(false); setFocusedId(null) }
    setDragY(0)
    pointerStartY.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // --- AUTO CENTER ---
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

  // --- FETCH DATI ---
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
        filter_competenze: filterCompetenze,
        filter_data: filterData,
        filter_giorni: filterGiorni
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

  const handleBoundsChange = (b: MapBounds) => {
    boundsRef.current = b;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPosizioni(b);
    }, 700); 
  }

  // 🚨 GESTIONE DIPENDENZE (No Array, solo Stringhe!)
  const handleMapReady = useCallback((initialBounds: MapBounds) => {
    boundsRef.current = initialBounds;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (!lat || !lng) fetchPosizioni(initialBounds);
    }
  }, [lat, lng, q, tipo, tagsStr, competenzeStr, filterData, giorniStr])

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (lat && lng) {
      const calcBounds = getBoundsFromCenter(lat, lng);
      boundsRef.current = calcBounds; 
      fetchPosizioni(calcBounds);
    } else if (boundsRef.current) fetchPosizioni(boundsRef.current);
  }, [q, tipo, tagsStr, competenzeStr, lat, lng, filterData, giorniStr])

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-76px)] overflow-hidden relative bg-slate-50 lg:bg-white">
      <style dangerouslySetInnerHTML={{ __html: `.leaflet-popup-pane { display: none !important; }` }} />

      {/* 🚀 SIDEBAR DESKTOP */}
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[55%] h-full overflow-y-auto px-6 pt-8 pb-8 md:px-8 flex-col gap-6 order-2 lg:order-1 bg-white relative z-10">
        
        <div className="w-full max-w-[480px]">
          <SearchPill />
        </div>

        <div className="flex flex-col gap-1 mt-2 mb-2">
          <h1 className="text-[2rem] font-bold text-slate-900 tracking-tight leading-none">Risultati ricerca</h1>
          <p className="text-slate-500 font-medium">{posizioni.length} {posizioni.length === 1 ? 'attività trovata' : 'attività trovate'}</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 pr-2">
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

      {/* 🗺️ AREA MAPPA E MOBILE */}
      <div className="w-full h-full lg:w-[45%] xl:w-[45%] order-1 lg:order-2 z-20 relative bg-white lg:p-5 xl:p-6 lg:pl-0">
        
        {/* PILLOLA MOBILE */}
        <div className={`lg:hidden absolute top-4 left-1/2 -translate-x-1/2 z-[1002] w-[92%] max-w-[400px] transition-all duration-300 ${isDrawerOpen ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <SearchPill />
        </div>

        {/* LA CORNICE MAPPA */}
        <div className="w-full h-full relative lg:rounded-3xl overflow-hidden lg:shadow-[0_8px_30px_rgba(0,0,0,0.08)] lg:border border-slate-200 bg-slate-100">
          
          {loading && (
            <div className="absolute top-24 lg:top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                <span className="text-xs font-bold text-slate-800">Cerco nell'area...</span>
              </div>
            </div>
          )}

          {/* 🚨 MAGIA: LA "KEY" FORZA IL RE-CENTERING DELLA MAPPA */}
          <MappaWrapper 
            key={`map-${lat}-${lng}`}
            posizioni={posizioni} 
            hoveredId={hoveredId}    
            setHoveredId={setHoveredId} 
            focusedId={focusedId}    
            setFocusedId={(id: string) => { setFocusedId(id); if (id) setIsDrawerOpen(false); }}
            onMapReady={handleMapReady}
            onBoundsChange={handleBoundsChange}
            forcedLat={lat} forcedLng={lng} forcedZoom={12} 
          />

          {/* CARD FLUTTUANTE SULLA MAPPA */}
          {selectedPos && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-end gap-3 w-[92%] sm:w-[380px] pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isDrawerOpen ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-8'
              }`}
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
            >
              <button onClick={() => setFocusedId(null)} className="p-2.5 bg-white shadow-xl rounded-full text-slate-900 pointer-events-auto hover:bg-slate-100 transition-colors border border-slate-200 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 pointer-events-auto">
                <PosizioneCard posizione={selectedPos} layout="horizontal" />
              </div>
            </div>
          )}
        </div>

        {/* 📱 TENDINA DRAWER MOBILE */}
        <div 
          className={`lg:hidden absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.12)] border-t border-slate-100 flex flex-col ${!isDragging ? 'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}`}
          style={{ 
            height: '85dvh',
            transform: selectedPos && !isDrawerOpen
                ? 'translateY(100%)' 
                : isDrawerOpen 
                    ? `translateY(${Math.max(0, dragY)}px)` 
                    : `translateY(calc(100% - 85px - env(safe-area-inset-bottom) + ${Math.min(0, dragY)}px))`,
            touchAction: 'none'
          }}
        >
          <div 
            className="w-full h-[85px] flex-shrink-0 flex flex-col items-center justify-start pt-5 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => { 
               if (!wasDragging.current) setIsDrawerOpen(!isDrawerOpen); 
            }}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 select-none">
              {isDrawerOpen ? 'Scorri in basso per chiudere' : `Mostra ${posizioni.length} attività`}
            </span>
          </div>

          <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] overflow-y-auto flex-grow flex flex-col gap-5 pt-2">
            {posizioni.map((pos: any) => (
              <div key={pos.id} onClick={() => { if (!wasDragging.current) { setFocusedId(pos.id); setIsDrawerOpen(false); } }}>
                <PosizioneCard posizione={pos} isHovered={hoveredId === pos.id} isFocused={focusedId === pos.id} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}