'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function FiltriRicercaV2({ allTags = [] }: { allTags?: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // STATI ORIGINALI
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '')
  const [tagSelezionato, setTagSelezionato] = useState(searchParams.get('tag') || '')

  // NUOVI STATI GEOGRAFICI
  const [indirizzo, setIndirizzo] = useState(searchParams.get('indirizzo') || '')
  const [lat, setLat] = useState(searchParams.get('lat') || '')
  const [lng, setLng] = useState(searchParams.get('lng') || '')
  const [raggio, setRaggio] = useState(searchParams.get('raggio') || '15')

  const [isLoadingGps, setIsLoadingGps] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 1. INIZIALIZZAZIONE GOOGLE MAPS AUTOCOMPLETE
  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google
      if (google && inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'it' },
          fields: ['formatted_address', 'geometry']
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place && place.formatted_address && place.geometry?.location) {
            setIndirizzo(place.formatted_address)
            setLat(place.geometry.location.lat().toString())
            setLng(place.geometry.location.lng().toString())
          }
        })
      }
    }

    if ((window as any).google) initAutocomplete()
    else {
      const checkGoogle = setInterval(() => {
        if ((window as any).google) {
          initAutocomplete()
          clearInterval(checkGoogle)
        }
      }, 500)
      return () => clearInterval(checkGoogle)
    }
  }, [])

  // 2. FUNZIONE PER IL GPS DEL BROWSER
  const ottieniPosizioneGPS = () => {
    setIsLoadingGps(true)
    if (!navigator.geolocation) {
      alert("Il tuo browser non supporta la geolocalizzazione.")
      setIsLoadingGps(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toString())
        setLng(position.coords.longitude.toString())
        setIndirizzo("📍 Posizione Attuale (GPS)")
        setIsLoadingGps(false)
      },
      (error) => {
        alert("Non è stato possibile ottenere la posizione. Verifica i permessi.")
        setIsLoadingGps(false)
      }
    )
  }

  // 3. APPLICAZIONE DEI FILTRI (AGGIORNA L'URL)
  const applicaFiltri = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tipo) params.set('tipo', tipo)
    if (tagSelezionato) params.set('tag', tagSelezionato)
    
    // Parametri Geografici
    if (lat && lng) {
      params.set('lat', lat)
      params.set('lng', lng)
      params.set('raggio', raggio)
      if (indirizzo) params.set('indirizzo', indirizzo)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFiltri = () => {
    setQ(''); setTipo(''); setTagSelezionato(''); 
    setIndirizzo(''); setLat(''); setLng(''); setRaggio('15')
    if (inputRef.current) inputRef.current.value = ''
    router.push(pathname)
  }

  return (
    <form onSubmit={applicaFiltri} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
      
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Filtri Esplorazione</h2>
        {searchParams.toString() && (
          <button type="button" onClick={resetFiltri} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 px-4 py-2 rounded-full">
            Reset
          </button>
        )}
      </div>

      {/* SEZIONE 1: GEOGRAFIA (IL CUORE DELLA MAPPA) */}
      <div className="space-y-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-blue-800 ml-2">Dove vuoi aiutare?</label>
          <div className="flex flex-col xl:flex-row gap-2">
            <input 
              ref={inputRef}
              type="text" 
              value={indirizzo}
              onChange={(e) => {
                setIndirizzo(e.target.value)
                if(e.target.value === '') { setLat(''); setLng('') } // Reset se l'utente cancella tutto
              }}
              placeholder="Cerca una città o un indirizzo..." 
              className="flex-1 p-4 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl outline-none font-bold text-slate-700 transition-all"
            />
            <button 
              type="button"
              onClick={ottieniPosizioneGPS}
              disabled={isLoadingGps}
              className="px-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap flex justify-center items-center gap-2"
            >
              {isLoadingGps ? 'Cerco...' : '📍 Usa GPS'}
            </button>
          </div>
        </div>

        {/* SLIDER DEL RAGGIO (Visibile solo se c'è una coordinata) */}
        <div className={`transition-all duration-300 overflow-hidden ${lat && lng ? 'opacity-100 max-h-32' : 'opacity-50 max-h-32 grayscale pointer-events-none'}`}>
          <div className="flex justify-between items-center mb-2 mt-4">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Raggio di Ricerca</label>
            <span className="font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-xs">{raggio} km</span>
          </div>
          <input 
            type="range" 
            min="2" max="100" step="1"
            value={raggio} 
            onChange={(e) => setRaggio(e.target.value)}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 px-1">
            <span>2 km</span><span>50 km</span><span>100 km</span>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: FILTRI CLASSICI */}
      <div className="grid grid-cols-1 gap-4 pt-2">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Parola Chiave</label>
          <input 
            type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="es. Mensa, Bambini..." 
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Frequenza</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-xl outline-none font-bold text-slate-700 transition-all appearance-none">
              <option value="">Qualsiasi</option>
              <option value="una_tantum">Singoli</option>
              <option value="ricorrente">Ricorrenti</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoria</label>
            <select value={tagSelezionato} onChange={(e) => setTagSelezionato(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-xl outline-none font-bold text-slate-700 transition-all appearance-none">
              <option value="">Tutte</option>
              {allTags.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 text-lg">
        Applica e Cerca Sulla Mappa
      </button>

      <style jsx global>{`
        .pac-container { z-index: 99999 !important; border-radius: 1rem; border: none !important; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important; margin-top: 4px; }
      `}</style>
    </form>
  )
}