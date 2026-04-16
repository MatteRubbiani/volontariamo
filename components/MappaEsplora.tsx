'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

const userIconHtml = `
  <div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div>
    <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
  </div>
`
const customUserIcon = L.divIcon({ html: userIconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })

function MapEvents({ onBoundsChange, onMapReady, forcedLat, forcedLng, forcedZoom }: any) {
  const map = useMap()
  const didInit = useRef(false)
  
  // Volo alla città cercata
  useEffect(() => {
    if (forcedLat && forcedLng) {
      map.flyTo([forcedLat, forcedLng], forcedZoom, { animate: true, duration: 1.5 })
    }
  }, [forcedLat, forcedLng, forcedZoom, map])

  // Aggiornamento bordi silenzioso
  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    }
  });

  // Init iniziale
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

const createPositionIcon = (tipo: string, isActive: boolean) => {
  const isUnaTantum = tipo === 'una_tantum';
  const color = isActive ? '#ea580c' : (isUnaTantum ? '#334155' : '#2563eb');
  const scale = isActive ? 'scale-125 -translate-y-2 shadow-xl z-[1000]' : 'hover:scale-110';

  const html = `
    <div class="flex flex-col items-center transition-all duration-300 ${scale}">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg" style="background-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
           ${isUnaTantum 
             ? '<path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5" />' 
             : '<path d="M16.023 9.348h4.992v-.001" />'}
        </svg>
      </div>
      <div class="w-3 h-3 rotate-45 -mt-2 shadow-sm border-r-[2px] border-b-[2px] border-white" style="background-color: ${color}"></div>
    </div>
  `
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20] })
}

export default function MappaEsplora({ 
  posizioni = [], 
  hoveredId, 
  setHoveredId, 
  focusedId, 
  setFocusedId, 
  onMapReady,
  onBoundsChange, 
  forcedLat, 
  forcedLng, 
  forcedRaggio, 
  forcedZoom 
}: any) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    fixLeafletIcons()
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="w-full h-full bg-slate-100 animate-pulse"></div>

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={[41.8719, 12.5674]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        <MapEvents 
          onMapReady={onMapReady}
          onBoundsChange={onBoundsChange} 
          forcedLat={forcedLat} 
          forcedLng={forcedLng} 
          forcedZoom={forcedZoom} 
        />

        {forcedLat && forcedLng && (
          <>
            <Marker position={[forcedLat, forcedLng]} icon={customUserIcon} />
            <Circle 
              center={[forcedLat, forcedLng]} 
              radius={forcedRaggio * 1000} 
              pathOptions={{ 
                fillColor: '#3b82f6', 
                color: '#3b82f6', 
                weight: 1, 
                opacity: 0.2, 
                fillOpacity: 0.05,
                dashArray: '5, 10' 
              }} 
            />
          </>
        )}

        {posizioni.map((pos: any) => {
          if (!pos.coords) return null;
          const match = pos.coords.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (!match) return null;
          const lat = parseFloat(match[2]), lng = parseFloat(match[1]);
          const active = hoveredId === pos.id || focusedId === pos.id;

          return (
            <Marker 
              key={pos.id} 
              position={[lat, lng]} 
              icon={createPositionIcon(pos.tipo, active)}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={{
                mouseover: () => setHoveredId(pos.id),
                mouseout: () => setHoveredId(null),
                click: () => setFocusedId(pos.id)
              }}
            >
              <Popup className="premium-popup">
                <div className="p-1">
                   <h3 className="font-black text-slate-800 text-sm mb-2 leading-tight">{pos.titolo}</h3>
                   <a href={`/posizione/${pos.id}`} className="block w-full text-center bg-slate-900 text-white text-[10px] font-black py-2 rounded-xl">DETTAGLI</a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}