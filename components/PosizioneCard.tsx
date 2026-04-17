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
}

export default function PosizioneCard({ 
  posizione, 
  ruolo = 'volontario',
  competenzeVolontario = [],
  isHovered = false,
  isFocused = false,
  onMouseEnter,
  onMouseLeave
}: PosizioneCardProps) { 
  
  const pathname = usePathname()
  const isAssociazione = ruolo === 'associazione'

  const formattaOra = (ora: string | null) => {
    if (!ora) return '--:--'
    return ora.substring(0, 5)
  }

  // 🎯 LOGICA INTELLIGENTE PER L'URL
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

  // Estrazione Immagine
  const imgUrl = posizione.media_associazioni?.url || posizione.immagine?.url || posizione.immagine_url || null;

  // Lettera iniziale per la Default Cover
  const iniziale = posizione.titolo ? posizione.titolo.charAt(0).toUpperCase() : 'V';

  return (
    <Link 
      href={urlDestinazione} 
      className="block group h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`rounded-3xl shadow-sm border transition-all duration-300 h-full flex flex-col overflow-hidden ${
        isAttiva 
          ? 'bg-blue-50/30 border-blue-500 shadow-xl ring-4 ring-blue-500/10 -translate-y-2' 
          : 'bg-white border-slate-100 transform group-hover:-translate-y-1 hover:shadow-xl'
      }`}>
        
        {/* 📸 HEADER VISIVO (SEMPRE PRESENTE: Coerenza assoluta e altezza fissa ridotta!) */}
        <div className="relative w-full h-28 sm:h-32 shrink-0 overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center">
          {imgUrl ? (
            <img 
              src={imgUrl} 
              alt={posizione.titolo || 'Copertina'} 
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            // DEFAULT COVER: Mostrata se non c'è foto. Mantiene la card identica alle altre.
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-blue-50 group-hover:to-slate-50 transition-colors duration-500">
              <span className="text-slate-200 group-hover:text-blue-100 text-5xl font-black transition-colors duration-500">
                {iniziale}
              </span>
            </div>
          )}
          {/* Micro-gradiente estetico unificato */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>

        {/* 📝 SEZIONE CONTENUTO (Padding compattato e layout ottimizzato) */}
        <div className="p-5 md:p-6 flex flex-col flex-grow">
          
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-start mb-3 gap-2">
              {posizione.tipo === 'una_tantum' ? (
                <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Evento Singolo
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Ricorrente
                </span>
              )}

              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black transition-colors flex-shrink-0 text-sm ${
                isAttiva ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                {iconaAzione}
              </div>
            </div>

            <h3 className={`text-lg md:text-xl font-black mb-1.5 leading-tight transition-colors ${isAttiva ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
              {posizione.titolo || 'Senza Titolo'}
            </h3>
            
            {/* Limitato a 2 righe (line-clamp-2) per compattare ulteriormente l'altezza */}
            <p className="text-slate-500 text-sm mb-3 line-clamp-2 font-medium leading-relaxed flex-grow">
              {posizione.descrizione || 'Nessuna descrizione presente.'}
            </p>
          </div>

          <div className="mt-auto">
            {competenzeRichieste.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 w-full overflow-hidden">
                {competenzeRichieste.slice(0, 2).map((comp: any, i: number) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200"
                  >
                    <span className="truncate">{comp.name || comp}</span>
                  </span>
                ))}
              </div>
            )}

            {/* FOOTER ORIZZONTALE: Luogo e Ora sulla stessa riga! */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
                <span className="mr-1.5 text-sm flex-shrink-0">📍</span> 
                <span className="truncate max-w-[130px] md:max-w-[150px]">{posizione.dove || 'Da definire'}</span>
              </div>
              <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
                <span className="mr-1.5 text-sm flex-shrink-0">⏰</span> 
                <span className="flex-shrink-0">{formattaOra(posizione.ora_inizio)} - {formattaOra(posizione.ora_fine)}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Link>
  )
}