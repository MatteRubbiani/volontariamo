'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import TagBadge from '@/components/TagBadge'

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

  // Se la card viene renderizzata dentro la pagina esplora (mappa), aggiunge il parametro!
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

  return (
    <Link 
      href={urlDestinazione} 
      className="block group h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`p-6 md:p-8 rounded-[2rem] shadow-sm border transition-all duration-300 h-full flex flex-col overflow-hidden ${
        isAttiva 
          ? 'bg-blue-50/30 border-blue-500 shadow-xl ring-4 ring-blue-500/10 -translate-y-2' 
          : 'bg-white border-slate-100 transform group-hover:-translate-y-1 hover:shadow-xl'
      }`}>
        
        <div className="flex flex-col mb-4">
          <div className="flex justify-between items-start mb-5 gap-2">
            {posizione.tipo === 'una_tantum' ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 tracking-wide">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Evento Singolo
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 tracking-wide">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Ricorrente
              </span>
            )}

            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors flex-shrink-0 ${
              isAttiva ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
            }`}>
              {iconaAzione}
            </div>
          </div>

          <h3 className={`text-xl font-black mb-2 leading-tight transition-colors ${isAttiva ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
            {posizione.titolo || 'Senza Titolo'}
          </h3>
          
          <p className="text-slate-500 text-sm mb-4 line-clamp-3 font-medium leading-relaxed flex-grow">
            {posizione.descrizione || 'Nessuna descrizione presente.'}
          </p>
        </div>

        <div className="mt-auto">
          {competenzeRichieste.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 w-full overflow-hidden">
              {competenzeRichieste.slice(0, 2).map((comp: any, i: number) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200"
                >
                  <span className="truncate">{comp.name || comp}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 py-5 border-t border-slate-100">
            <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
              <span className="w-5 text-center mr-2 text-base flex-shrink-0">📍</span> 
              <span className="truncate">{posizione.dove || 'Luogo da definire'}</span>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
              <span className="w-5 text-center mr-2 text-base flex-shrink-0">⏰</span> 
              <span className="flex-shrink-0">{formattaOra(posizione.ora_inizio)} - {formattaOra(posizione.ora_fine)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}