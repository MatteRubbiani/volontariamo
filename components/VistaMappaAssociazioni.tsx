'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import dynamic from 'next/dynamic'
import { Search, Building2, MapPin, ShieldCheck, ArrowRight, SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/supabase'

// Dynamic import per Leaflet
const MappaAssociazioni = dynamic(() => import('@/components/MappaAssociazioni'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 font-medium text-xs tracking-wider uppercase">
      Caricamento mappa...
    </div>
  )
})

interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

// 📦 CARD COMPATTA STILE AIRBNB (ENTE REGISTRATO)
function CardAssociazioneRegistrata({ item, isHovered, isFocused, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-2xl p-4 border transition-all duration-300 ${
        isFocused 
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-lg' 
          : isHovered 
            ? 'border-slate-300 shadow-md translate-y-[-2px]' 
            : 'border-slate-100 hover:border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3.5">
        {item.logo_url ? (
          <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 shadow-sm bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.logo_url} alt={item.denominazione} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-bold text-emerald-700 tracking-tight">
              {item.sezione_runts || 'Ente Registrato'}
            </span>
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate group-hover:text-emerald-700 transition-colors">
            {item.denominazione}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-300" />
            <span className="truncate">{item.comune || 'Sede in aggiornamento'}</span>
          </p>
        </div>
        <Link 
          href={`/associazione/${item.slug || '#'}`}
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// 🏛️ CARD ENTE RUNTS NON ANCORA RISCATTATO
function CardAssociazioneUnclaimed({ item, onClaim }: any) {
  return (
    <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/80 hover:bg-white transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            {item.sezione_runts || 'Iscritto al RUNTS'}
          </span>
          <h4 className="font-semibold text-slate-800 text-xs truncate">{item.denominazione}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.comune || 'Sede in aggiornamento'}</p>
        </div>
      </div>
      <button
        onClick={() => onClaim(item)}
        className="w-full mt-3 bg-slate-900 hover:bg-black text-white text-xs font-medium py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
      >
        <span>Rivendica scheda</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function VistaMappaAssociazioni({ initialData = [] }: { initialData?: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const resolveImageUrl = useCallback((path: string | null) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from('posizioni').getPublicUrl(path)
    return data?.publicUrl || null
  }, [supabase])

  // Normalizza i dati iniziali per garantire le proprietà attese dalle card
  const formattedInitialData = useMemo(() => {
    return initialData.map((item) => ({
      ...item,
      is_registrata: true,
      comune: item.comune || item.comune_legale || '',
      lat: item.lat || item.lat_legale || null,
      lng: item.lng || item.lng_legale || null,
      logo_url: item.logo_url || resolveImageUrl(item.logo_path)
    }))
  }, [initialData, resolveImageUrl])

  const [associazioniMappa, setAssociazioniMappa] = useState<any[]>(formattedInitialData)
  const [risultatiDirectory, setRisultatiDirectory] = useState<any[]>(formattedInitialData)
  const [loading, setLoading] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const boundsRef = useRef<MapBounds | null>(null)
  const isFirstLoad = useRef(true)

  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const q = searchParams.get('q') || null

  const selectedAssoc = associazioniMappa.find(a => a.id === focusedId)

  // 🚀 GESTIONE RIVENDICAZIONE CON ID SICURO
  const handleClaim = async (item: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    const claimId = item.id || ''
    const targetOnboardingUrl = `/app/onboarding/associazione?claim_id=${encodeURIComponent(claimId)}`

    if (session) {
      router.push(targetOnboardingUrl)
    } else {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(targetOnboardingUrl)}`)
    }
  }

  // Debounce ricerca (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput.trim()) params.set('q', searchInput.trim())
      else params.delete('q')
      router.push(`?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ⚡ QUERY DIRETTA SUL NUOVO SCHEMA (associazioni + runts_import)
  const eseguiRicerca = useCallback(async (searchQuery: string | null) => {
    setLoading(true)
    try {
      const clean = searchQuery?.trim() || ''

      // 1. Ricerca enti già registrati
      let queryAssoc = supabase
        .from('associazioni')
        .select(`
          id,
          denominazione,
          codice_fiscale,
          comune_legale,
          provincia_legale,
          indirizzo_legale,
          lat_legale,
          lng_legale,
          logo_path,
          slug,
          sezione_runts,
          is_verificata
        `)
        .limit(30)

      if (clean) {
        queryAssoc = queryAssoc.or(`denominazione.ilike.%${clean}%,comune_legale.ilike.%${clean}%`)
      }

      // 2. Ricerca anagrafiche ministeriali RUNTS non ancora iscritte
      let queryRunts = supabase
        .from('runts_import')
        .select(`
          id,
          denominazione,
          codice_fiscale,
          comune,
          provincia,
          indirizzo,
          sezione_runts
        `)
        .limit(30)

      if (clean) {
        queryRunts = queryRunts.or(`denominazione.ilike.%${clean}%,comune.ilike.%${clean}%`)
      }

      const [resAssoc, resRunts] = await Promise.all([queryAssoc, queryRunts])

      const registrati = (resAssoc.data || []).map((a) => ({
        id: a.id,
        denominazione: a.denominazione,
        codice_fiscale: a.codice_fiscale,
        comune: a.comune_legale,
        provincia: a.provincia_legale,
        indirizzo: a.indirizzo_legale,
        lat: a.lat_legale,
        lng: a.lng_legale,
        logo_url: resolveImageUrl(a.logo_path),
        slug: a.slug,
        sezione_runts: a.sezione_runts,
        is_registrata: true,
        is_verificata: a.is_verificata,
      }))

      const codiciFiscaliRegistrati = new Set(registrati.map(a => a.codice_fiscale))

      // Escludi da RUNTS gli enti che risultano già a bordo
      const unclaimed = (resRunts.data || [])
        .filter(r => !codiciFiscaliRegistrati.has(r.codice_fiscale))
        .map((r) => ({
          id: r.id,
          denominazione: r.denominazione,
          codice_fiscale: r.codice_fiscale,
          comune: r.comune,
          provincia: r.provincia,
          indirizzo: r.indirizzo,
          lat: null,
          lng: null,
          logo_url: null,
          slug: null,
          sezione_runts: r.sezione_runts,
          is_registrata: false,
        }))

      const combined = [...registrati, ...unclaimed]
      setRisultatiDirectory(combined)

      // I pin sulla mappa appartengono solo agli enti geolocalizzati
      const mappabili = registrati.filter(item => item.lat && item.lng)
      setAssociazioniMappa(mappabili)
    } catch (error) {
      console.error("Errore ricerca directory associazioni:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, resolveImageUrl])

  const handleBoundsChange = (b: MapBounds) => { boundsRef.current = b }

  const handleMapReady = useCallback((initialBounds: MapBounds) => {
    boundsRef.current = initialBounds
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      eseguiRicerca(q)
    }
  }, [q, eseguiRicerca])

  useEffect(() => {
    if (!isFirstLoad.current) eseguiRicerca(q)
  }, [q, eseguiRicerca])

  return (
    <div className="flex w-full h-[calc(100dvh-3.5rem)] overflow-hidden relative bg-slate-100 font-sans">
      
      {/* 🗺️ MAPPA FULL SCREEN CON AUTO-ZOOM SU MODENA */}
      <div className="absolute inset-0 z-10">
        <MappaAssociazioni 
          associazioni={associazioniMappa} 
          hoveredId={hoveredId} 
          setHoveredId={setHoveredId} 
          focusedId={focusedId} 
          setFocusedId={(id: string) => { 
            setFocusedId(id); 
            if (id) setIsPanelOpen(false); 
          }}
          onMapReady={handleMapReady} 
          onBoundsChange={handleBoundsChange}
          forcedLat={lat || 44.6471}
          forcedLng={lng || 10.9252}
          forcedZoom={lat && lng ? 14 : 12}
        />
      </div>

      {/* 🔍 SEARCHBAR SOSPESA IN ALTO (AIRBNB STYLE) */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[540px]">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 p-1.5 flex items-center transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)]">
          
          <div className="pl-4 pr-2 text-slate-400">
            <Search className="w-4 h-4 text-slate-700" />
          </div>
          
          <input 
            type="text" 
            placeholder="Cerca un'associazione o un comune..." 
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              if (!isPanelOpen) setIsPanelOpen(true)
            }}
            onFocus={() => setIsPanelOpen(true)}
            className="w-full bg-transparent text-base sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none pr-2"
          />

          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
              isPanelOpen 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPanelOpen ? 'Mappa' : 'Lista'}</span>
            {risultatiDirectory.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isPanelOpen ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                {risultatiDirectory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 📋 PANNELLO OVERLAY LATERALE */}
      {isPanelOpen && (
        <div className="absolute top-20 left-4 right-4 sm:right-auto sm:left-6 sm:w-[420px] bottom-20 sm:bottom-6 z-20 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header del Pannello */}
          <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Directory Associazioni</h2>
              <p className="text-[11px] text-slate-400">
                {loading ? 'Ricerca in corso...' : `${risultatiDirectory.length} risultati trovati`}
              </p>
            </div>
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Risultati */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse font-medium">
                Sincronizzazione archivio RUNTS...
              </div>
            ) : risultatiDirectory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">Nessuna associazione trovata</p>
              </div>
            ) : (
              risultatiDirectory.map((item: any) => (
                <div key={item.id}>
                  {item.is_registrata ? (
                    <CardAssociazioneRegistrata 
                      item={item} 
                      isHovered={hoveredId === item.id} 
                      isFocused={focusedId === item.id}
                      onClick={() => setFocusedId(item.id)}
                    />
                  ) : (
                    <CardAssociazioneUnclaimed 
                      item={item} 
                      onClaim={handleClaim} 
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🎯 SCHEDA POPUP QUANDO SI CLICCA UN PIN SULLA MAPPA */}
      {selectedAssoc && !isPanelOpen && (
        <div className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[380px] animate-in slide-in-from-bottom-6 duration-300">
          <div className="relative bg-white rounded-3xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100">
            <button 
              onClick={() => setFocusedId(null)} 
              className="absolute -top-3 -right-3 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-black transition-transform active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <CardAssociazioneRegistrata item={selectedAssoc} isFocused={true} />
          </div>
        </div>
      )}

    </div>
  )
}