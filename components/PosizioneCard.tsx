import React from 'react'

// Definiamo la struttura dei dati che la Card si aspetta di ricevere
interface Tag {
  id: string;
  name: string;
}

interface Posizione {
  id: string;
  titolo: string;
  descrizione: string;
  tipo: 'una_tantum' | 'ricorrente';
  dove: string;
  ora_inizio: string;
  ora_fine: string;
  quando: string;
  tags?: Tag[];
  // Se in futuro aggiungiamo il nome dell'associazione alla query:
  nome_associazione?: string; 
}

export default function PosizioneCard({ posizione }: { posizione: Posizione }) {
  const isUnaTantum = posizione.tipo === 'una_tantum';

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      
      {/* INTESTAZIONE: Tipo e (opzionale) Associazione */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
          isUnaTantum 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isUnaTantum ? 'Evento Singolo' : 'Ricorrente'}
        </span>
        
        {posizione.nome_associazione && (
          <span className="text-xs font-bold text-slate-400">
            {posizione.nome_associazione}
          </span>
        )}
      </div>

      {/* TITOLO E DESCRIZIONE */}
      <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
        {posizione.titolo}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
        {posizione.descrizione}
      </p>

      {/* DETTAGLI LOGISTICI (Quando, Orari, Dove) */}
      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <span className="text-xl">📅</span>
          <span className="capitalize">{posizione.quando}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <span className="text-xl">⏳</span>
          <span>{posizione.ora_inizio} - {posizione.ora_fine}</span>
        </div>

        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <span className="text-xl">📍</span>
          <span className="truncate" title={posizione.dove}>{posizione.dove}</span>
        </div>
      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100">
        {posizione.tags && posizione.tags.length > 0 ? (
          posizione.tags.map(tag => (
            <span 
              key={tag.id} 
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold"
            >
              #{tag.name}
            </span>
          ))
        ) : (
          <span className="text-xs font-bold text-slate-300 italic">Nessun tag specificato</span>
        )}
      </div>
      
      {/* AZIONE (Da implementare in futuro, es. "Candidati" o "Modifica") */}
      {/* <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
        Dettagli
      </button> */}
    </div>
  )
}