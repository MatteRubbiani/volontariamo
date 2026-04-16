'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// --- 1. PIN POSIZIONE UTENTE (EFFETTO PULSE) ---
const userIconHtml = `
  <div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div>
    <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
  </div>
`
const customUserIcon = L.divIcon({
  html: userIconHtml,
  className: '', // Rimuove gli stili di default di Leaflet
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// --- 2. PIN OPPORTUNITÀ (LOOK PREMIUM) ---
const createPositionIcon = (tipo: string) => {
  const isUnaTantum = tipo === 'una_tantum';
  
  // Colori: Slate scuro per Evento Singolo, Blu acceso per Ricorrente
  const bgColor = isUnaTantum ? '#334155' : '#2563eb'; 
  
  // Selezioniamo l'SVG corretto in base al tipo (convertito in HTML standard)
  const svgPath = isUnaTantum
    ? '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />'
    : '<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />';

  const html = `
    <div class="group relative flex flex-col items-center drop-shadow-xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 z-10" 
           style="background-color: ${bgColor}; border: 2.5px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
          ${svgPath}
        </svg>
      </div>
      <div class="w-3 h-3 rotate-45 -mt-2 z-0" 
           style="background-color: ${bgColor}; border-right: 2.5px solid white; border-bottom: 2.5px solid white;">
      </div>
    </div>
  `
  
  return L.divIcon({
    html: html,
    className: '', // Fondamentale per resettare gli stili base di Leaflet
    iconSize: [40, 48], // Dimensioni totali del blocco
    iconAnchor: [20, 48], // Punto esatto che tocca le coordinate (il centro in basso)
    popupAnchor: [0, -50] // Dove far apparire il fumetto
  })
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 })
  }, [center, zoom, map])
  return null
}

export default function MappaEsplora({ posizioni = [], userLat, userLng, raggioKm = 15 }: any) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="w-full h-[550px] bg-slate-100 animate-pulse rounded-[2.5rem]"></div>

  const center: [number, number] = (userLat && userLng) ? [userLat, userLng] : [41.9028, 12.4964]
  const zoom = (userLat && userLng) ? (raggioKm > 50 ? 8 : raggioKm > 20 ? 10 : 12) : 6

  return (
    <div className="w-full h-[550px] rounded-[3rem] overflow-hidden border-[12px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-0 relative">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        
        {/* TEMA PREMIUM: CartoDB Positron */}
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        <MapUpdater center={center} zoom={zoom} />

        {userLat && userLng && (
          <>
            <Marker position={[userLat, userLng]} icon={customUserIcon} />
            <Circle 
              center={[userLat, userLng]} 
              radius={raggioKm * 1000} 
              pathOptions={{ 
                fillColor: '#3b82f6', 
                color: '#3b82f6', 
                weight: 1, 
                opacity: 0.2, 
                fillOpacity: 0.05,
                dashArray: '5, 10' // Linea del cerchio tratteggiata per un tocco tech
              }} 
            />
          </>
        )}

        {posizioni.map((pos: any) => {
          if (!pos.coords) return null;
          let lat, lng;
          
          try {
            if (typeof pos.coords === 'string') {
              const match = pos.coords.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) { lng = parseFloat(match[1]); lat = parseFloat(match[2]); }
            } else if (typeof pos.coords === 'object') {
              lng = pos.coords.coordinates[0]; lat = pos.coords.coordinates[1];
            }
          } catch (e) { return null; }

          if (!lat || !lng) return null;

          return (
            <Marker key={pos.id} position={[lat, lng]} icon={createPositionIcon(pos.tipo)}>
              <Popup className="premium-popup">
                <div className="p-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                    {pos.tipo === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}
                  </span>
                  <h3 className="font-black text-slate-800 text-base mb-1">{pos.titolo}</h3>
                  <div className="flex items-center gap-1 text-slate-500 mb-3">
                    <span className="text-xs font-bold">{pos.dove}</span>
                  </div>
                  <a href={`/posizione/${pos.id}`} className="block w-full text-center bg-slate-900 text-white text-xs font-black py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                    DETTAGLI
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* STILE POPUP PERSONALIZZATO */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 1.5rem !important;
          padding: 8px !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-popup-tip {
          display: none !important; /* Rimuove la freccetta sotto il popup per un look più pulito */
        }
        .premium-popup .leaflet-popup-content {
          margin: 12px !important;
          width: 200px !important;
        }
      `}</style>
    </div>
  )
}