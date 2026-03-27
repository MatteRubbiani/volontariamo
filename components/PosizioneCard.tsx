import Link from 'next/link'

export default function PosizioneCard({ 
  posizione, 
  ruolo = 'volontario' 
}: { 
  posizione: any
  ruolo?: 'volontario' | 'associazione'
}) {
  const formattaOra = (ora: string | null) => {
    if (!ora) return '--:--'
    return ora.substring(0, 5)
  }

  // ECCO IL NUOVO PATH PULITO PER L'ASSOCIAZIONE
  const urlDestinazione = ruolo === 'associazione'
    ? `/dashboard/associazione/posizione/${posizione.id}/modifica`
    : `/dashboard/volontario/posizione/${posizione.id}`

  const iconaAzione = ruolo === 'associazione' ? '✏️' : '→'

  return (
    <Link href={urlDestinazione} className="block group">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-2xl border border-slate-100 transition-all duration-300 transform group-hover:-translate-y-2 h-full flex flex-col">
        
        <div className="flex justify-between items-start mb-4 gap-2">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
            posizione.tipo === 'una_tantum' 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            {posizione.tipo === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
          {posizione.titolo || 'Senza Titolo'}
        </h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-grow font-medium">
          {posizione.descrizione || 'Nessuna descrizione presente.'}
        </p>

        <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-2xl">
          <div className="flex items-center text-sm text-slate-600 font-bold">
            <span className="mr-2">📍</span> {posizione.dove || 'Luogo da definire'}
          </div>
          <div className="flex items-center text-sm text-slate-600 font-bold">
            <span className="mr-2">⏰</span> 
            {formattaOra(posizione.ora_inizio)} - {formattaOra(posizione.ora_fine)}
          </div>
          <div className="flex items-center text-sm text-slate-600 font-bold">
            <span className="mr-2">📅</span> {posizione.quando || 'Data non specificata'}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-1">
            {posizione.tags && posizione.tags.length > 0 ? (
              <>
                {posizione.tags.slice(0, 2).map((tag: any) => (
                  <span key={tag.id} className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    #{tag.name}
                  </span>
                ))}
                {posizione.tags.length > 2 && (
                  <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    +{posizione.tags.length - 2}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-slate-300 italic">Nessun tag</span>
            )}
          </div>
          
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {iconaAzione}
          </div>
        </div>

      </div>
    </Link>
  )
}