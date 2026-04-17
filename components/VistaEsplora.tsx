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
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const boundsRef = useRef<MapBounds | null>(null)
  const isFirstLoad = useRef(true)
  const checkedCap = useRef(false)

  const q = searchParams.get('q') || null
  const tipo = searchParams.get('tipo') || null
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const tagsStr = searchParams.get('tags')
  const competenzeStr = searchParams.get('competenze')
  const filterTags = tagsStr ? tagsStr.split(',') : null
  const filterCompetenze = competenzeStr ? competenzeStr.split(',') : null

  const selectedPos = posizioni.find(p => p.id === focusedId)

  // 📱 GESTIONE SWIPE PER LA TENDINA
  const [touchStartY, setTouchStartY] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartY) return
    const touchEndY = e.changedTouches[0].clientY
    const distance = touchEndY - touchStartY

    if (distance > 40) {
      // Scorri in GIÙ (Chiude la tendina)
      setIsDrawerOpen(false)
      setFocusedId(null)
    } else if (distance < -40) {
      // Scorri in SU (Apre la tendina)
      setIsDrawerOpen(true)
    }
    setTouchStartY(null)
  }

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
        } catch (err) {
          console.error("Errore autolocalizzazione CAP:", err)
        }
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
    } catch (error) {
      console.error("Errore fetch:", error)
    } finally {
      setLoading(false)
    }
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
    } else if (boundsRef.current) {
      fetchPosizioni(boundsRef.current);
    }
  }, [q, tipo, tagsStr, competenzeStr, lat, lng])

  useEffect(() => {
    if (focusedId && window.innerWidth >= 1024) {
      const cardElement = document.getElementById(`card-${focusedId}`)
      if (cardElement) cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusedId])

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden relative bg-white">
      
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[50%] h-full overflow-y-auto p-6 md:p-8 lg:p-10 flex-col gap-6 order-2 lg:order-1 bg-slate-50 scroll-smooth relative z-10">
        <div className="flex justify-between items-end border-b border-slate-200 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Esplora</h1>
          <div className="text-right">
            <span className="text-3xl font-black text-blue-600 leading-none">{posizioni.length}</span>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Trovate</p>
          </div>
        </div>

        <div className="-mx-2">
            <FiltriRicercaV2 /> 
        </div>

        {posizioni.length === 0 && !loading ? (
          <div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-slate-200 my-10 shadow-sm">
            <span className="text-5xl block mb-4">🌍</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">Nessun risultato in questa zona</h3>
            <p className="text-slate-500 font-medium italic text-sm">Sposta la mappa o usa il mirino per trovare altro.</p>
          </div>
        ) : (
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
        )}
      </div>

      <div className="w-full h-full lg:w-[45%] xl:w-[50%] order-1 lg:order-2 lg:border-l border-slate-200 z-20 relative overflow-hidden">
        
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (boundsRef.current) fetchPosizioni(boundsRef.current);
            }}
            disabled={loading}
            className="group flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 transition-all hover:scale-105 hover:bg-white hover:text-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] active:scale-95 disabled:pointer-events-none disabled:opacity-80"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            {loading ? 'Ricerca in corso...' : "Cerca in quest'area"}
          </button>
        </div>

        <MappaWrapper 
          posizioni={posizioni} 
          hoveredId={hoveredId}    
          setHoveredId={setHoveredId} 
          focusedId={focusedId}    
          setFocusedId={(id: string) => {
            setFocusedId(id);
            if (id) setIsDrawerOpen(false); 
          }}
          onMapReady={handleMapReady}
          onBoundsChange={(b: any) => { boundsRef.current = b }} 
          forcedLat={lat}
          forcedLng={lng}
          forcedZoom={12} 
        />

       {/* 📱 MOBILE: LA CARD FLUTTUANTE (Esce quando clicchi un Pin) */}
        {selectedPos && !isDrawerOpen && (
          <div className="lg:hidden absolute bottom-8 left-4 right-4 z-[1001] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out pointer-events-none">
            
            {/* TASTO CHIUDI ESTERNO: Niente più sovrapposizioni! */}
            <button 
              onClick={() => setFocusedId(null)}
              className="p-2.5 bg-white/90 backdrop-blur-md hover:bg-slate-100 rounded-full text-slate-700 shadow-[0_8px_20px_rgba(0,0,0,0.15)] border border-slate-100 transition-colors pointer-events-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* LA CARD */}
            <div className="w-full bg-white rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100 pointer-events-auto">
              <PosizioneCard posizione={selectedPos} />
            </div>

          </div>
        )}

        <div 
          className={`lg:hidden absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-t border-slate-100 flex flex-col ${
            isDrawerOpen ? 'translate-y-0 h-[85vh]' : 'translate-y-[calc(100%-80px)] h-[85vh]'
          }`}
        >
          {/* 🚨 AREA MANIGLIA (ORA SUPPORTA LO SWIPE IN SU E IN GIÙ!) */}
          <div 
            className="w-full h-[80px] flex-shrink-0 flex flex-col items-center justify-start pt-4 cursor-pointer"
            onClick={() => {
              setIsDrawerOpen(!isDrawerOpen);
              if (!isDrawerOpen) setFocusedId(null);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isDrawerOpen ? 'Scorri per chiudere' : `Vedi ${posizioni.length} posizioni`}
            </span>
          </div>

          <div className="px-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-6">
            <FiltriRicercaV2 />
            
            {posizioni.length === 0 && !loading ? (
              <div className="bg-slate-50 p-8 rounded-3xl text-center border border-dashed border-slate-200 shadow-sm">
                <span className="text-4xl block mb-4">🌍</span>
                <h3 className="text-lg font-black text-slate-800 mb-2">Nessun risultato</h3>
                <p className="text-slate-500 font-medium italic text-xs">Sposta la mappa o usa il mirino.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posizioni.map((pos: any) => (
                  <div key={pos.id} onClick={() => { setFocusedId(pos.id); setIsDrawerOpen(false); }}>
                    <PosizioneCard 
                      posizione={pos} 
                      isHovered={hoveredId === pos.id}
                      isFocused={focusedId === pos.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}