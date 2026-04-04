import Link from 'next/link'
import TagBadge from '@/components/TagBadge'

interface PosizioneCardProps {
  posizione: any;
  ruolo?: 'volontario' | 'associazione';
  competenzeVolontario?: string[];
}

export default function PosizioneCard({ 
  posizione, 
  ruolo = 'volontario',
  competenzeVolontario = [] 
}: PosizioneCardProps) { 
  
  // Creiamo un booleano pulito all'inizio così TypeScript non si confonde mai
  const isAssociazione = ruolo === 'associazione'

  const formattaOra = (ora: string | null) => {
    if (!ora) return '--:--'
    return ora.substring(0, 5)
  }

  const urlDestinazione = isAssociazione
    ? `/dashboard/associazione/posizione/${posizione.id}/modifica`
    : `/dashboard/volontario/posizione/${posizione.id}`

  const iconaAzione = isAssociazione ? '✏️' : '→'
  
  const estraiCompetenze = () => {
    if (posizione.competenze) return posizione.competenze; 
    if (posizione.posizione_competenze) {
      return posizione.posizione_competenze.map((pc: any) => pc.competenze).filter(Boolean);
    }
    return [];
  }
  
  const competenzeRichieste = estraiCompetenze()

  return (
    <Link href={urlDestinazione} className="block group h-full">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-2xl border border-slate-100 transition-all duration-300 transform group-hover:-translate-y-1 h-full flex flex-col overflow-hidden">
        
        {/* PARTE ALTA (Fluida) */}
        <div className="flex flex-col mb-4">
          
          {/* 1. HEADER: TIPO EVENTO */}
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

            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
              {iconaAzione}
            </div>
          </div>

          {/* TITOLO E DESCRIZIONE */}
          <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
            {posizione.titolo || 'Senza Titolo'}
          </h3>
          
          <p className="text-slate-500 text-sm mb-4 line-clamp-3 font-medium leading-relaxed flex-grow">
            {posizione.descrizione || 'Nessuna descrizione presente.'}
          </p>

        </div>

        {/* PARTE BASSA (Ancorata al fondo grazie a mt-auto) */}
        <div className="mt-auto">
          
          {/* 3. COMPETENZE */}
          {competenzeRichieste.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 w-full overflow-hidden">
              {competenzeRichieste.slice(0, 2).map((comp: any) => {
                const isMatch = isAssociazione || competenzeVolontario.includes(comp.id)
                
                return (
                  <span 
                    key={comp.id} 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all min-w-0 ${
                      isAssociazione 
                        ? 'bg-slate-800 text-slate-100 border-slate-700'
                        : isMatch 
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {/* TS ORA È FELICE: Usiamo solo isMatch per calcolare lo spessore dell'icona! */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isMatch ? 2.5 : 1.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.15-.665-.118-.9l-2.276-1.989a.678.678 0 00-.923.116l-2.43 2.956m-1.75 1.75l-2.956 2.43a.678.678 0 01-.923-.116l-1.989-2.276c-.244-.268-.177-.667.04-.9l2.492-3.053m1.75-1.75l-2.43-2.956a.678.678 0 01.116-.923l2.276-1.989c.234-.205.597-.176.804.068l3.053 3.515m-1.75 1.75l3.053-2.492c.266-.217.665-.15.9-.118l1.989 2.276c.205.234.176.597-.068.804l-2.956 2.43" />
                    </svg>
                    <span className="truncate">{comp.name}</span>
                  </span>
                )
              })}
              
              {/* BADGE "+X" */}
              {competenzeRichieste.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 flex-shrink-0">
                  +{competenzeRichieste.length - 2}
                </span>
              )}
            </div>
          )}

          {/* 4. INFO PRATICHE */}
          <div className="flex flex-col gap-3 py-5 border-t border-slate-100">
            <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
              <span className="w-5 text-center mr-2 text-base flex-shrink-0">📍</span> 
              <span className="truncate">{posizione.dove || 'Luogo da definire'}</span>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-500 min-w-0">
              <span className="w-5 text-center mr-2 text-base flex-shrink-0">⏰</span> 
              <span className="flex-shrink-0">{formattaOra(posizione.ora_inizio)} - {formattaOra(posizione.ora_fine)}</span>
              <span className="mx-2 text-slate-300 flex-shrink-0">•</span>
              <span className="truncate">{posizione.quando || 'Data N/D'}</span>
            </div>
          </div>

          {/* FOOTER: TAGS */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100 w-full overflow-hidden">
            <div className="flex items-center gap-1.5 w-full">
              {posizione.tags && posizione.tags.length > 0 ? (
                <>
                  {posizione.tags.slice(0, 2).map((tag: any) => (
                    <div key={tag.tag?.id || tag.id} className="min-w-0">
                      <TagBadge nome={tag.tag?.name || tag.name} size="sm" />
                    </div>
                  ))}
                  {posizione.tags.length > 2 && (
                    <span className="inline-flex items-center font-bold border shadow-sm rounded-xl transition-all px-2 py-0.5 text-[10px] bg-slate-50 text-slate-500 border-slate-200 flex-shrink-0">
                      +{posizione.tags.length - 2}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nessun ambito</span>
              )}
            </div>
          </div>
          
        </div>

      </div>
    </Link>
  )
}