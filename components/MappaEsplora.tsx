'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
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

// IL MIRINO GPS (Pulsante Fluttuante)
function LocateControl() {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const handleLocate = (e: any) => {
    e.preventDefault();
    if (!("geolocation" in navigator)) {
      alert("Il tuo browser non supporta la geolocalizzazione.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 13, { animate: true, duration: 1.5 });
        setLocating(false);
      },
      (err) => {
        console.error(err);
        alert("Impossibile trovare la posizione. Controlla i permessi del browser.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  return (
    <div className="leaflet-bottom leaflet-right z-[1000] absolute bottom-6 right-6 pointer-events-auto">
      <button 
        onClick={handleLocate}
        title="Trova la mia posizione"
        className="bg-white text-slate-800 w-12 h-12 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all border border-slate-100"
      >
        {locating ? (
           <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5A9 9 0 0 1 16.5 7.5M12 3v3m0 12v3m9-9h-3M6 12H3m9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
        )}
      </button>
    </div>
  )
}

function MapEvents({ onBoundsChange, onMapReady, forcedLat, forcedLng, forcedZoom }: any) {
  const map = useMap()
  const didInit = useRef(false)
  
  useEffect(() => {
    if (forcedLat && forcedLng) {
      map.flyTo([forcedLat, forcedLng], forcedZoom, { animate: true, duration: 1.5 })
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

const createPositionIcon = (tipo: string, isActive: boolean) => {
  const isUnaTantum = tipo === 'una_tantum';
  const color = isActive ? '#ea580c' : (isUnaTantum ? '#334155' : '#2563eb');
  const scale = isActive ? 'scale-125 -translate-y-2' : 'hover:scale-110';

  const svgContent = isUnaTantum 
    ? `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />`
    : `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />`;

  const html = `
    <div class="flex flex-col items-center transition-all duration-300 ${scale}">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg flex-shrink-0" style="background-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
           ${svgContent}
        </svg>
      </div>
      <div class="w-3 h-3 rotate-45 -mt-2 shadow-sm border-r-[2px] border-b-[2px] border-white flex-shrink-0" style="background-color: ${color}"></div>
    </div>
  `
  return L.divIcon({ html, className: '', iconSize: [40, 48], iconAnchor: [20, 48], popupAnchor: [0, -45] })
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
      {/* ZOOM 6 E CENTRO ITALIA COME VISTA INIZIALE DA EFFETTO WOW */}
      <MapContainer center={[41.8719, 12.5674]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        <LocateControl />

        <MapEvents 
          onMapReady={onMapReady}
          onBoundsChange={onBoundsChange} 
          forcedLat={forcedLat} 
          forcedLng={forcedLng} 
          forcedZoom={forcedZoom} 
        />

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
                   <a href={`/posizione/${pos.id}`} className="block w-full text-center bg-slate-900 text-white text-[10px] font-black py-2 rounded-xl hover:bg-slate-800 transition-colors">DETTAGLI</a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}