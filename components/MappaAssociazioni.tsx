'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// ==========================================
// GLI EVENTI INTERNI ALLA MAPPA
// ==========================================
function MapEvents({ onBoundsChange, onMapReady, forcedLat, forcedLng, forcedZoom }: any) {
  const map = useMap()
  const didInit = useRef(false)
  const prevCoords = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  
  useEffect(() => {
    // Vola alla posizione solo se le coordinate cambiano esplicitamente via URL/Ricerca
    if (forcedLat && forcedLng) {
      if (prevCoords.current.lat !== forcedLat || prevCoords.current.lng !== forcedLng) {
        prevCoords.current = { lat: forcedLat, lng: forcedLng }
        map.flyTo([forcedLat, forcedLng], forcedZoom || 12, { animate: true, duration: 1.2 })
      }
    }
  }, [forcedLat, forcedLng, forcedZoom, map])

  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    }
  });

  useEffect(() => {
    if (!didInit.current) {
      const b = map.getBounds();
      onMapReady({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
      didInit.current = true;
    }
  }, [map, onMapReady]);

  return null;
}

// ==========================================
// PIN VERDI PER LE ASSOCIAZIONI (EMERALD)
// ==========================================
const createInstitutionIcon = (isActive: boolean) => {
  const bgColor = isActive ? 'bg-emerald-700' : 'bg-emerald-600';
  const shadow = isActive ? 'shadow-[0_10px_20px_rgba(16,185,129,0.4)]' : 'shadow-md';
  const scale = isActive ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110';
  const border = 'border-2 border-white';

  // Icona "Building/Istituzione"
  const svgContent = `<path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10zM12 11v10m-4-10v10m8-10v10" />`;

  const html = `
    <div class="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${scale}">
      <div class="flex items-center justify-center w-9 h-9 rounded-full ${bgColor} text-white ${shadow} ${border} transition-colors duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">${svgContent}</svg>
      </div>
    </div>
  `
  return L.divIcon({ html, className: 'custom-leaflet-marker', iconSize: [36, 36], iconAnchor: [18, 18] })
}

export default function MappaAssociazioni({ 
  associazioni = [], hoveredId, setHoveredId, focusedId, setFocusedId, onMapReady, onBoundsChange, forcedLat, forcedLng, forcedZoom 
}: any) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  useEffect(() => { setIsMounted(true) }, [])

  if (!isMounted) return <div className="w-full h-full bg-slate-100 animate-pulse"></div>

  // Coordinate di default pre-impostate su Modena
  const initialCenter: [number, number] = [forcedLat || 44.6471, forcedLng || 10.9252]
  const initialZoom = forcedZoom || 11

  return (
    <div className="relative h-full w-full bg-slate-100">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false} 
        ref={setMapInstance}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapEvents onMapReady={onMapReady} onBoundsChange={onBoundsChange} forcedLat={forcedLat} forcedLng={forcedLng} forcedZoom={forcedZoom} />

        {/* PIN DELLE ASSOCIAZIONI (SOLO QUELLE CON LAT/LNG) */}
        {associazioni.map((assoc: any) => {
          if (!assoc.lat || !assoc.lng) return null;
          const active = hoveredId === assoc.id || focusedId === assoc.id;
          return (
            <Marker 
              key={assoc.id} 
              position={[assoc.lat, assoc.lng]} 
              icon={createInstitutionIcon(active)}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={{
                mouseover: () => setHoveredId(assoc.id),
                mouseout: () => setHoveredId(null),
                click: () => {
                   setFocusedId(assoc.id);
                   // Pan automatico leggermente verso il basso per fare spazio alla card
                   if (mapInstance) mapInstance.panTo([assoc.lat + 0.003, assoc.lng], { animate: true });
                }
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}