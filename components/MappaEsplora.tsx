'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
// FUNZIONE PER CREARE I PIN BELLISSIMI
// ==========================================
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
    fixLeafletIcons()
    setIsMounted(true)
  }, [])

  // 🎯 LA LOGICA DEL MIRINO (Elegante e a prova di errore)
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
      
      {/* 🚨 IL FIX PER IL MOBILE: Spegne i popup nativi solo su schermi piccoli (<1024px) */}
      <style>{`
        @media (max-width: 1023px) {
          .leaflet-popup-pane { display: none !important; }
        }
      `}</style>

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
                   {/* 🚨 AGGIUNTO IL PARAMETRO ?from=mappa QUI SOTTO */}
                   <a href={`/posizione/${pos.id}?from=mappa`} className="block w-full text-center bg-slate-900 text-white text-[10px] font-black py-2 rounded-xl hover:bg-slate-800 transition-colors">DETTAGLI</a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* 🚨 IL MIRINO OUTSIDE! */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button 
          onClick={handleLocate}
          title="Trova la mia posizione"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all hover:scale-110 hover:bg-blue-50 active:scale-95 border border-slate-100"
        >
          {locating ? (
             <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-7 w-7 transition-transform group-hover:scale-90">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25v4.5m0 10.5v4.5m-9.75-9.75h4.5m10.5 0h4.5m-14.25 0a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
            </svg>
          )}
        </button>
      </div>

    </div>
  )
}