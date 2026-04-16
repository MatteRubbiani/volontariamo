'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// --- FIX ICONE ---
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

const UserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// --- HELPER ANIMAZIONE ---
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 })
  }, [center, zoom, map])
  return null
}

// --- IL COMPONENTE MAPPA "STUPIDO" E VELOCE ---
export default function MappaEsplora({ 
  posizioni = [], 
  userLat, 
  userLng, 
  raggioKm = 15 
}: { 
  posizioni?: any[], 
  userLat?: number, 
  userLng?: number, 
  raggioKm?: number 
}) {
  console.log("🕵️ DEBUG DATI MAPPA:", posizioni);
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    fixLeafletIcons()
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="w-full h-[500px] bg-slate-100 animate-pulse rounded-[2rem]"></div>

  const center: [number, number] = (userLat && userLng) ? [userLat, userLng] : [41.9028, 12.4964]
  const zoom = (userLat && userLng) ? (raggioKm > 50 ? 8 : raggioKm > 20 ? 10 : 12) : 6

  return (
    <div className="w-full h-[500px] rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl z-0 relative">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapUpdater center={center} zoom={zoom} />

        {/* 1. SE C'È LA POSIZIONE UTENTE, DISEGNA PIN VERDE E CERCHIO */}
        {userLat && userLng && (
          <>
            <Marker position={[userLat, userLng]} icon={UserIcon}>
              <Popup>La tua ricerca parte da qui</Popup>
            </Marker>
            <Circle 
              center={[userLat, userLng]} 
              radius={raggioKm * 1000} 
              pathOptions={{ fillColor: '#3b82f6', color: '#3b82f6', weight: 2, opacity: 0.5, fillOpacity: 0.1 }} 
            />
          </>
        )}

        {/* 2. STAMPA TUTTE LE POSIZIONI RICEVUTE DAL SERVER */}
        {posizioni.map((pos) => {
          if (!pos.coords) return null;

          let lat, lng;

          // Gestiamo entrambi i formati che Supabase potrebbe mandarci
          try {
            if (typeof pos.coords === 'string') {
              // Formato 1: "POINT(lng lat)"
              const match = pos.coords.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) {
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
              }
            } else if (typeof pos.coords === 'object' && pos.coords.coordinates) {
              // Formato 2: GeoJSON { type: "Point", coordinates: [lng, lat] }
              lng = pos.coords.coordinates[0];
              lat = pos.coords.coordinates[1];
            }
          } catch (e) {
            console.error("Errore lettura coordinate per", pos.id);
            return null;
          }

          // Se per qualche motivo lat/lng sono nulli, saltiamo il pin
          if (!lat || !lng) return null;

          return (
            <Marker key={pos.id} position={[lat, lng]}>
              <Popup className="rounded-xl">
                <div className="min-w-[150px]">
                  <h3 className="font-black text-base leading-tight mb-1">{pos.titolo}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-2">{pos.dove}</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg">
                    {pos.tipo}
                  </span>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}