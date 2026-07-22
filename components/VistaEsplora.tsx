'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import PosizioneCard from '@/components/PosizioneCard'
import MappaWrapper from '@/components/MappaWrapper'
import SearchPill from '@/components/SearchPill'
import { X } from 'lucide-react'

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

function PosizioneCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 animate-pulse flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="w-1/3 h-3.5 bg-slate-200 rounded-full" />
          <div className="w-5/6 h-5 bg-slate-200 rounded-full" />
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
      </div>
      <div className="w-full h-14 bg-slate-100/70 rounded-2xl" />
      <div className="flex gap-2 pt-1">
        <div className="w-16 h-6 bg-slate-200/80 rounded-full" />
        <div className="w-20 h-6 bg-slate-200/80 rounded-full" />
      </div>
    </div>
  )
}

interface VistaEsploraProps {
  initialData?: any[];
}

export default function VistaEsplora({ initialData = [] }: VistaEsploraProps) {
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
  
  // STATI DRAWER E MOBILE
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStartY = useRef<number | null>(null)
  const wasDragging = useRef(false)
  const boundsRef = useRef<MapBounds | null>(null)
  const isFirstLoad = useRef(true)
  const debounceTimer = useRef<any>(null)

  const q = searchParams.get('q') || null
  const tipo = searchParams.get('tipo') || null
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  
  const tagsStr = searchParams.get('tags') || null
  const competenzeStr = searchParams.get('competenze') || null
  const filterData = searchParams.get('data') || null
  const giorniStr = searchParams.get('giorni') || null

  const filterTags = tagsStr ? tagsStr.split(',') : null
  const filterCompetenze = competenzeStr ? competenzeStr.split(',') : null
  const filterGiorni = giorniStr ? giorniStr.split(',') : null

  const selectedPos = posizioni.find(p => p.id === focusedId)

  // TOUCH & DRAG DRAWER
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
    const threshold = 40
    if (dragY < -threshold && !isDrawerOpen) setIsDrawerOpen(true)
    else if (dragY > threshold && isDrawerOpen) { setIsDrawerOpen(false); setFocusedId(null) }
    setDragY(0)
    pointerStartY.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

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
        slug: pos.slug || null, 
        associazioni: pos.associazione_denominazione ? {
          denominazione: pos.associazione_denominazione,
          slug: pos.associazione_slug || null
        } : null,
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
    }, 350); 
  }

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
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-3.5rem)] overflow-hidden relative bg-slate-50 lg:bg-white">
      <style dangerouslySetInnerHTML={{ __html: `.leaflet-popup-pane { display: none !important; }` }} />

      {/* 🚀 SIDEBAR DESKTOP */}
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[55%] h-full overflow-y-auto px-6 pt-8 pb-8 md:px-8 flex-col gap-6 order-2 lg:order-1 bg-white relative z-10">
        
        <div className="w-full max-w-[480px]">
          <SearchPill />
        </div>

        <div className="flex flex-col gap-1 mt-2 mb-2">
          <h1 className="text-[2rem] font-bold text-slate-900 tracking-tight leading-none">Risultati ricerca</h1>
          {loading ? (
            <p className="text-slate-400 font-medium animate-pulse">Aggiorno i risultati...</p>
          ) : (
            <p className="text-slate-500 font-medium">{posizioni.length} {posizioni.length === 1 ? 'attività trovata' : 'attività trovate'}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 pr-2">
          {loading ? (
            <>
              <PosizioneCardSkeleton />
              <PosizioneCardSkeleton />
              <PosizioneCardSkeleton />
              <PosizioneCardSkeleton />
            </>
          ) : posizioni.length === 0 ? (
            <div className="col-span-1 xl:col-span-2 py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              Nessun bando di volontariato trovato in questa zona.<br/>Trascina o muovi la mappa per cercare altrove!
            </div>
          ) : (
            posizioni.map((pos: any) => (
              <div key={pos.id} id={`card-${pos.id}`}>
                <PosizioneCard 
                  posizione={pos} 
                  isHovered={hoveredId === pos.id}
                  isFocused={focusedId === pos.id}
                  onMouseEnter={() => setHoveredId(pos.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🗺️ AREA MAPPA E MOBILE */}
      <div className="w-full h-full lg:w-[45%] xl:w-[45%] order-1 lg:order-2 z-20 relative bg-white lg:p-5 xl:p-6 lg:pl-0">
        
        {/* BARRA RICERCA MOBILE */}
        <div className={`lg:hidden absolute top-3 left-1/2 -translate-x-1/2 z-[1002] w-[92%] max-w-[400px] transition-all duration-300 ${
          isDrawerOpen ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}>
          <SearchPill />
        </div>

        {/* CONTENITORE MAPPA */}
        <div className="w-full h-full relative lg:rounded-3xl overflow-hidden lg:shadow-[0_8px_30px_rgba(0,0,0,0.08)] lg:border border-slate-200 bg-slate-100">
          
          {loading && (
            <div className="absolute top-20 lg:top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200/80 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                <span className="text-xs font-bold text-slate-800">Cerco nell'area...</span>
              </div>
            </div>
          )}

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

          {/* CARD SELEZIONATA SULLA MAPPA (FLUTTUANTE SOPRA LA BOTTOM NAV) */}
          {selectedPos && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-end gap-2.5 w-[92%] sm:w-[380px] pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isDrawerOpen ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-8'
              }`}
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
            >
              <button 
                onClick={() => setFocusedId(null)} 
                className="p-2 bg-slate-950 text-white shadow-2xl rounded-full pointer-events-auto hover:bg-black transition-transform active:scale-90 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden border border-slate-200/80 pointer-events-auto">
                <PosizioneCard posizione={selectedPos} layout="horizontal" />
              </div>
            </div>
          )}
        </div>

        {/* 📱 TENDINA DRAWER MOBILE (SOSPESA PERFETTAMENTE SOPRA LA BOTTOM NAV) */}
        <div 
          className={`lg:hidden fixed inset-x-0 bottom-0 z-[1000] bg-white rounded-t-[2.5rem] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] border-t border-slate-200/80 flex flex-col ${
            !isDragging ? 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''
          }`}
          style={{ 
            height: '82dvh',
            transform: selectedPos && !isDrawerOpen
                ? 'translateY(100%)' 
                : isDrawerOpen 
                    ? `translateY(${Math.max(0, dragY)}px)` 
                    : `translateY(calc(100% - 65px - env(safe-area-inset-bottom) - 4.5rem + ${Math.min(0, dragY)}px))`,
            touchAction: 'none'
          }}
        >
          {/* LINGUETTA HANDLER */}
          <div 
            className="w-full h-[60px] shrink-0 flex flex-col items-center justify-start pt-3 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => { 
               if (!wasDragging.current) setIsDrawerOpen(!isDrawerOpen); 
            }}
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mb-2" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {isDrawerOpen ? 'Tocca per chiudere' : `${posizioni.length} attività trovate`}
            </span>
          </div>

          {/* LISTA RISULTATI INTERNA */}
          <div className="px-4 pb-28 overflow-y-auto flex-grow flex flex-col gap-4 pt-1">
            {loading ? (
              <>
                <PosizioneCardSkeleton />
                <PosizioneCardSkeleton />
                <PosizioneCardSkeleton />
              </>
            ) : posizioni.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-xs font-semibold">
                Nessuna attività in questa zona.<br/>Sposta la mappa per esplorare altrove!
              </div>
            ) : (
              posizioni.map((pos: any) => (
                <div key={pos.id} onClick={() => { if (!wasDragging.current) { setFocusedId(pos.id); setIsDrawerOpen(false); } }}>
                  <PosizioneCard posizione={pos} isHovered={hoveredId === pos.id} isFocused={focusedId === pos.id} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}