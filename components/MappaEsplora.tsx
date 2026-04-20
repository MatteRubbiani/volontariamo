'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// ==========================================
// GLI EVENTI INTERNI ALLA MAPPA (Non toccare!)
// ==========================================
function MapEvents({ onBoundsChange, onMapReady, forcedLat, forcedLng, forcedZoom }: any) {
  const map = useMap()
  const didInit = useRef(false)
  
  // Vola dove l'URL gli dice di volare
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

// ==========================================
// FUNZIONE PER CREARE I PIN "PREMIUM" (PILLOLE SOSPESE)
// ==========================================
const createPositionIcon = (tipo: string, isActive: boolean) => {
  const isUnaTantum = tipo === 'una_tantum';
  
  // Airbnb Style: Pin inattivi sono bianchi con icona nera/grigia e bordo sottile. 
  // Pin attivi invertono diventando neri con icona bianca e crescono.
  
  const bgColor = isActive ? 'bg-slate-900' : 'bg-white';
  const textColor = isActive ? 'text-white' : 'text-slate-800';
  const shadow = isActive ? 'shadow-[0_10px_20px_rgba(0,0,0,0.2)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.1)]';
  const scale = isActive ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110';
  const border = isActive ? 'border border-slate-900' : 'border border-slate-200';

  const svgContent = isUnaTantum 
    ? `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />`
    : `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />`;

  const html = `
    <div class="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${scale}">
      <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgColor} ${textColor} ${shadow} ${border} transition-colors duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
           ${svgContent}
        </svg>
      </div>
    </div>
  `
  // Sostituiamo il divIcon nativo. Togliamo la codina e centriamo esattamente il cerchio.
  return L.divIcon({ 
      html, 
      className: 'custom-leaflet-marker', // Va disattivato in CSS globale se ha background
      iconSize: [32, 32], 
      iconAnchor: [16, 16] // Il centro del pin coincide con le coordinate esatte
  })
}

// ==========================================
// COMPONENTE PRINCIPALE DELLA MAPPA
// ==========================================
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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  
  // Stati per il mirino
  const router = useRouter()
  const searchParams = useSearchParams()
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 🎯 LA LOGICA DEL MIRINO
  const handleLocate = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!("geolocation" in navigator)) {
      alert("Ops! 🧭 Il tuo dispositivo non sembra supportare la geolocalizzazione. Prova a inserire la città a mano nella barra di ricerca.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          
          const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.municipality || "La tua posizione";

          const params = new URLSearchParams(searchParams.toString());
          params.set('lat', latitude.toString());
          params.set('lng', longitude.toString());
          params.set('indirizzo', city);
          router.push(`?${params.toString()}`);
          
          if (mapInstance) {
            mapInstance.flyTo([latitude, longitude], 13, { animate: true, duration: 1.5 });
          }
        } catch (error) {
           console.error("Errore recupero nome città:", error);
           const params = new URLSearchParams(searchParams.toString());
           params.set('lat', latitude.toString());
           params.set('lng', longitude.toString());
           params.set('indirizzo', "La tua posizione");
           router.push(`?${params.toString()}`);
           
           if (mapInstance) mapInstance.flyTo([latitude, longitude], 13, { animate: true });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
           alert("Accesso alla posizione bloccato 🛑.\n\nSe usi Safari o iPhone, assicurati di aver attivato la Localizzazione nelle Impostazioni di Sistema (Privacy > Localizzazione). In alternativa, scrivi la tua città nella barra di ricerca!");
        } else {
           alert("Non riusciamo a rilevare la tua posizione esatta 🌍. Il segnale GPS potrebbe essere debole in questo momento. Prova a scriverla manualmente.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isMounted) return <div className="w-full h-full bg-slate-100 animate-pulse"></div>

  return (
    <div className="relative h-full w-full z-0 bg-slate-100">
      {/* MAP CONTAINER */}
      <MapContainer 
        center={[41.8719, 12.5674]} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
        ref={setMapInstance}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        <MapEvents 
          onMapReady={onMapReady}
          onBoundsChange={onBoundsChange} 
          forcedLat={forcedLat} 
          forcedLng={forcedLng} 
          forcedZoom={forcedZoom} 
        />

        {posizioni.map((pos: any) => {
          if (!pos.lat || !pos.lng) return null;
          const lat = pos.lat;
          const lng = pos.lng;
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
                // Al click settiamo il focus e facciamo scivolare la mappa per centrare meglio il pin,
                // il Popup nativo rimosso perché gestiamo la Card custom!
                click: () => {
                   setFocusedId(pos.id);
                   if (mapInstance) {
                      // Pan "furbo": alza leggermente il centro così la tua card fluttuante non copre il pin cliccato!
                      mapInstance.panTo([lat + 0.005, lng], { animate: true });
                   }
                }
              }}
            />
          )
        })}
      </MapContainer>

      {/* 🚨 IL MIRINO OUTSIDE! */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button 
          onClick={handleLocate}
          title="Trova la mia posizione"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:scale-110 active:scale-95 border border-slate-100"
        >
          {locating ? (
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-transparent"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6 transition-transform group-hover:scale-90">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25v4.5m0 10.5v4.5m-9.75-9.75h4.5m10.5 0h4.5m-14.25 0a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* IMPORTANTE: Nel tuo `globals.css` ricordati di avere:
          .custom-leaflet-marker { background: none; border: none; }
      */}

    </div>
  )
}