'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

export default function MappaVetrinaPubblica({
  lat,
  lng,
  nome,
  comune,
  provincia,
  indirizzo
}: {
  lat?: number | null
  lng?: number | null
  nome?: string
  comune?: string
  provincia?: string
  indirizzo?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return

    let isMounted = true

    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // 🗺️ MAPPA CON ZOOM 12 E CARTO LIGHT_ALL
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: false,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      // Marker Custom Nero con effetto Halo
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-slate-900/20 animate-ping"></span>
            <div class="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

      if (nome) {
        marker.bindPopup(`
          <div class="p-1 font-sans text-center">
            <p class="font-bold text-slate-900 text-xs">${nome}</p>
            ${indirizzo ? `<p class="text-[11px] text-slate-500 mt-0.5">${indirizzo}</p>` : ''}
          </div>
        `, { closeButton: false })
      }
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, nome, indirizzo])

  if (!lat || !lng) return null

  return (
    <div className="relative w-full h-56 md:h-72 rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-xs group/map">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Overlay info e tasto indicazioni Google Maps */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{indirizzo || `${comune || ''} ${provincia ? `(${provincia})` : ''}`.trim() || 'Sede Ufficiale'}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate">{comune && provincia ? `${comune} (${provincia})` : 'Geolocalizzato sulla Mappa'}</p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-xl transition-all shrink-0 active:scale-95 shadow-xs flex items-center gap-1"
        >
          <span>Indicazioni</span>
          <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  )
}