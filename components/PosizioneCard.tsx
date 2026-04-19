'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PosizioneCardProps {
  posizione: any;
  ruolo?: 'volontario' | 'associazione';
  competenzeVolontario?: string[];
  isHovered?: boolean;
  isFocused?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  layout?: 'vertical' | 'horizontal'; // 🚨 NUOVA PROP PREMIUM
}

export default function PosizioneCard({ 
  posizione, 
  ruolo = 'volontario',
  competenzeVolontario = [],
  isHovered = false,
  isFocused = false,
  onMouseEnter,
  onMouseLeave,
  layout = 'vertical' // Di default rimane verticale per liste e dashboard
}: PosizioneCardProps) { 
  
  const pathname = usePathname()
  const isAssociazione = ruolo === 'associazione'
  const isHorizontal = layout === 'horizontal' // Flag per il layout

  const formattaOra = (ora: string | null) => {
    if (!ora) return '--:--'
    return ora.substring(0, 5)
  }

  let urlDestinazione = isAssociazione
    ? `/app/associazione/posizione/${posizione.id}/modifica`
    : `/posizione/${posizione.id}`

  if (!isAssociazione && (pathname?.includes('/esplora') || pathname?.includes('/mappa'))) {
    urlDestinazione += '?from=mappa'
  }

  const iconaAzione = isAssociazione ? '✏️' : '→'
  
  const estraiCompetenze = () => {
    if (posizione.competenze_nomi) return posizione.competenze_nomi.map((n: string) => ({ name: n }));
    if (posizione.competenze) return posizione.competenze;
    return [];
  }
  
  const competenzeRichieste = estraiCompetenze()
  const isAttiva = isHovered || isFocused;

  const imgUrl = posizione.media_associazioni?.url || posizione.immagine?.url || posizione.immagine_url || null;
  const iniziale = posizione.titolo ? posizione.titolo.charAt(0).toUpperCase() : 'V';

  return (
    <Link 
      href={urlDestinazione} 
      className="block group h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden bg-white ${
        isAttiva 
          ? 'border-slate-300 shadow-xl ring-4 ring-slate-900/5 -translate-y-1' 
          : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'
      } ${
        // 🚨 CAMBIO STRUTTURA IN BASE AL LAYOUT
        isHorizontal ? 'flex flex-row h-28 sm:h-32 w-full' : 'flex flex-col h-full'
      }`}>
        
        {/* 📸 HEADER VISIVO */}
        <div className={`relative shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center ${
          isHorizontal ? 'w-28 sm:w-32 h-full border-r border-slate-100' : 'w-full h-28 sm:h-32 border-b border-slate-100'
        }`}>
          {imgUrl ? (
            <img 
              src={imgUrl} 
              alt={posizione.titolo || 'Copertina'} 
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-slate-200 transition-colors duration-500">
              <span className={`text-slate-300 font-black transition-colors duration-500 ${isHorizontal ? 'text-4xl' : 'text-5xl'}`}>
                {iniziale}
              </span>
            </div>
          )}
        </div>

        {/* 📝 SEZIONE CONTENUTO */}
        <div className={`flex flex-col flex-grow min-w-0 ${isHorizontal ? 'p-3.5 sm:p-4 justify-center' : 'p-5 md:p-6'}`}>
          
          {/* LAYOUT ORIZZONTALE (COMPATTO PER MAPPA) */}
          {isHorizontal ? (
            <>
              <div className="flex justify-between items-center mb-0.5 gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {posizione.tipo === 'una_tantum' ? 'Singolo' : 'Ricorrente'}
                </span>
              </div>

              <h3 className={`text-sm sm:text-base font-bold mb-0.5 truncate transition-colors ${isAttiva ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
                {posizione.titolo || 'Senza Titolo'}
              </h3>
              
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mb-auto">
                {posizione.dove || 'Da definire'}
              </p>

              <div className="flex items-center text-[10px] sm:text-[11px] font-bold text-slate-700 mt-2 truncate">
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{posizione.quando}</span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span className="flex-shrink-0">{formattaOra(posizione.ora_inizio)}</span>
              </div>
            </>
          ) : (
            
            /* LAYOUT VERTICALE (ORIGINALE PER LISTE) */
            <>
              <div className="flex flex-col mb-3">
                <div className="flex justify-between items-start mb-3 gap-2">
                  {posizione.tipo === 'una_tantum' ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Evento Singolo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span> Ricorrente
                    </span>
                  )}

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black transition-colors flex-shrink-0 text-sm ${
                    isAttiva ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
                    {iconaAzione}
                  </div>
                </div>

                <h3 className={`text-lg md:text-xl font-bold mb-1.5 leading-tight transition-colors ${isAttiva ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
                  {posizione.titolo || 'Senza Titolo'}
                </h3>
                
                <p className="text-slate-500 text-sm mb-3 line-clamp-2 font-medium leading-relaxed flex-grow">
                  {posizione.descrizione || 'Nessuna descrizione presente.'}
                </p>
              </div>

              <div className="mt-auto">
                {competenzeRichieste.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4 w-full overflow-hidden">
                    {competenzeRichieste.slice(0, 2).map((comp: any, i: number) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200"
                      >
                        <span className="truncate">{comp.name || comp}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center text-xs font-bold text-slate-700 min-w-0">
                    <span className="mr-2 text-sm flex-shrink-0 text-slate-400">📍</span> 
                    <span className="truncate">{posizione.dove || 'Da definire'}</span>
                  </div>
                  <div className="flex items-center text-xs font-bold text-slate-700 min-w-0">
                    <span className="mr-2 text-sm flex-shrink-0 text-slate-400">🕒</span> 
                    <span className="flex-shrink-0">{posizione.quando} · {formattaOra(posizione.ora_inizio)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
        </div>
      </div>
    </Link>
  )
}