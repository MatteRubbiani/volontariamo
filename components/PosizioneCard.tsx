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
  layout?: 'vertical' | 'horizontal';
  coloreBrand?: string | null;
}

export default function PosizioneCard({ 
  posizione, 
  ruolo = 'volontario',
  competenzeVolontario = [],
  isHovered = false,
  isFocused = false,
  onMouseEnter,
  onMouseLeave,
  layout = 'vertical',
  coloreBrand
}: PosizioneCardProps) { 
  
  const pathname = usePathname()
  const isAssociazione = ruolo === 'associazione'
  const isHorizontal = layout === 'horizontal' 
  
  const themeTextHover = isAssociazione ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600'
  const themeTextActive = isAssociazione ? 'text-emerald-700' : 'text-blue-700'

  const formattaOra = (ora: string | null) => {
    if (!ora) return '--:--'
    return ora.substring(0, 5)
  }

  // Logica Temporale & Stati Premium
  const odierna = new Date().toISOString().split('T')[0]
  const isBozza = posizione.stato === 'bozza'
  const isArchiviata = posizione.stato === 'archiviata'
  const isConclusa = posizione.tipo === 'una_tantum' && posizione.data_esatta && posizione.data_esatta < odierna

  // La freccina premium minimale (→) viene condivisa per indicare l'azione di approfondimento
  const IconaAzione = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
  
  const competenzeRichieste = posizione.competenze_nomi 
    ? posizione.competenze_nomi.map((n: string) => ({ name: n })) 
    : (posizione.competenze || [])
    
  const isAttiva = isHovered || isFocused

  const imgUrl = posizione.media_associazioni?.url || posizione.immagine?.url || posizione.immagine_url || null
  const iniziale = posizione.titolo ? String(posizione.titolo).charAt(0).toUpperCase() : 'V'

  const titleClassesVertical = coloreBrand 
    ? "text-lg font-bold mb-1.5 leading-tight transition-colors line-clamp-2 text-slate-900 group-hover:text-[var(--brand-color)]"
    : `text-lg font-bold mb-1.5 leading-tight transition-colors line-clamp-2 ${isAttiva ? themeTextActive : `text-slate-900 ${themeTextHover}`}`

  const titleClassesHorizontal = coloreBrand
    ? "text-sm sm:text-base font-bold leading-tight line-clamp-2 transition-colors text-slate-900 group-hover:text-[var(--brand-color)]"
    : `text-sm sm:text-base font-bold leading-tight line-clamp-2 transition-colors ${isAttiva ? themeTextActive : `text-slate-900 ${themeTextHover}`}`

  const iconClasses = coloreBrand
    ? "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 bg-slate-50 text-slate-400 group-hover:bg-[var(--brand-color)] group-hover:text-white"
    : `w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${isAttiva ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`

  const renderStatoBadge = () => {
    if (isBozza) return (
      <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Bozza Privata
      </span>
    )
    if (isArchiviata) return (
      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Archiviata
      </span>
    )
    if (isConclusa) return (
      <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Conclusa
      </span>
    )
    return posizione.tipo === 'una_tantum' ? (
      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Evento Singolo
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ricorrente
      </span>
    )
  }

  // CONTENITORE GEOMETRICO UNIFICATO
  const CardSkeleton = (
    <div className={`rounded-3xl border transition-all duration-300 overflow-hidden bg-white ${
      isAttiva 
        ? 'border-slate-300 shadow-sm ring-4 ring-slate-900/5' 
        : 'border-slate-100'
    } ${
      isHorizontal ? 'flex flex-row h-32 w-full' : 'flex flex-col h-full'
    } ${isConclusa || isArchiviata ? 'opacity-75 hover:opacity-100' : ''}`}>
      
      {/* 📸 COPERTINA */}
      <div className={`relative shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center ${
        isHorizontal ? 'w-28 sm:w-36 h-full border-r border-slate-100' : 'w-full h-32 md:h-40 border-b border-slate-100'
      }`}>
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={posizione.titolo || 'Copertina'} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <span className={`text-slate-300 font-black ${isHorizontal ? 'text-4xl' : 'text-5xl'}`}>
              {iniziale}
            </span>
          </div>
        )}
      </div>

      {/* 📝 CONTENUTI RIGIDI */}
      <div className={`flex flex-col flex-grow min-w-0 ${isHorizontal ? 'p-4' : 'p-5 md:p-6'}`}>
        {isHorizontal ? (
          <div className="flex h-full items-center gap-3">
            <div className="flex flex-col min-w-0 flex-grow h-full justify-center">
              <div className="mb-1">{renderStatoBadge()}</div>
              <h3 className={titleClassesHorizontal}>{posizione.titolo || 'Senza Titolo'}</h3>
              <div className="flex items-center gap-1.5 mt-auto pt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <p className="text-[11px] text-slate-500 font-medium truncate">{posizione.dove || 'Da definire'}</p>
              </div>
            </div>
            <div className={iconClasses}>{IconaAzione}</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-start mb-3 gap-2">
                {renderStatoBadge()}
                <div className={iconClasses}>{IconaAzione}</div>
              </div>
              <h3 className={titleClassesVertical}>{posizione.titolo || 'Senza Titolo'}</h3>
              <p className="text-slate-500 text-sm mb-3 line-clamp-2 font-medium leading-relaxed flex-grow">
                {posizione.descrizione || 'Nessuna descrizione presente.'}
              </p>
            </div>

            <div className="mt-auto">
              {competenzeRichieste.length > 0 && (
                <div className="flex items-center gap-1.5 mb-4 w-full overflow-hidden">
                  {competenzeRichieste.slice(0, 2).map((comp: any, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200">
                      <span className="truncate">{comp.name || comp}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <div className="flex items-center text-xs font-bold text-slate-700 min-w-0 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  <span className="truncate">{posizione.dove || 'Da definire'}</span>
                </div>
                <div className="flex items-center text-xs font-bold text-slate-700 min-w-0 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="flex-shrink-0">
                    {posizione.tipo === 'una_tantum' && posizione.data_esatta ? posizione.data_esatta : posizione.quando} · {formattaOra(posizione.ora_inizio)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ✨ IL FIX: Se l'utente è l'associazione disattiviamo il tag <Link> nativo interno della card
  if (isAssociazione) {
    return (
      <div 
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave}
        style={coloreBrand ? { '--brand-color': coloreBrand } as React.CSSProperties : undefined}
        className="w-full h-full"
      >
        {CardSkeleton}
      </div>
    )
  }

  // Altrimenti, per il volontario lasciamo attiva la navigazione classica sul profilo pubblico
  let urlVolontario = `/posizione/${posizione.id}`
  if (pathname?.includes('/esplora') || pathname?.includes('/mappa')) {
    urlVolontario += '?from=mappa'
  }

  return (
    <Link 
      href={urlVolontario} 
      className="block group h-full cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={coloreBrand ? { '--brand-color': coloreBrand } as React.CSSProperties : undefined}
    >
      {CardSkeleton}
    </Link>
  )
}