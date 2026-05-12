'use client'

import Link from 'next/link'
import TagBadge from '@/components/TagBadge'

export default function ProfiloAssociazione({ data, email }: { data: any, email: string }) {
  // 🛡️ PROTEZIONE TOTALE ANTI-CRASH
  if (!data) return <div className="p-20 text-center font-bold text-slate-400">Caricamento dati in corso...</div>
  const safeData = data || {}

  // 📦 ESTRAZIONE RELAZIONI
  const trasparenza = Array.isArray(safeData.associazioni_trasparenza) 
    ? (safeData.associazioni_trasparenza[0] || {}) 
    : (safeData.associazioni_trasparenza || {})

  const rawSedi = safeData.associazioni_sedi
  let sedePrincipale: any = {}
  if (Array.isArray(rawSedi)) {
    sedePrincipale = rawSedi.find((s: any) => s.is_principale) || rawSedi[0] || {}
  } else if (rawSedi && typeof rawSedi === 'object') {
    sedePrincipale = rawSedi
  }
  
  // 🏷️ ESTRAZIONE E RAGGRUPPAMENTO TAGS
  const tagsRaw = safeData.associazione_tags || safeData.tags || []
  const tagsList = Array.isArray(tagsRaw) 
    ? tagsRaw.map((item: any) => item.tag).filter(Boolean)
    : []

  // Raggruppamento per categoria (Stessa logica del form modifica)
  const tagsRaggruppati = tagsList.reduce((acc: any, tag: any) => {
    const cat = tag.categoria || 'Altro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const nomeGrezzo = safeData.denominazione || safeData.nome || 'Ente'
  const iniziali = nomeGrezzo.substring(0, 2).toUpperCase()

  const formatFullName = (nome: string, cognome: string) => {
    if (!nome && !cognome) return '—'
    return `${nome || ''} ${cognome || ''}`.trim()
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24 animate-in fade-in duration-500">
      
      {/* 🚀 HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{nomeGrezzo}</h1>
            {safeData.is_verificata && (
              <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg" title="Ente Verificato">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.24Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
              {safeData.forma_giuridica || 'Ente ETS'}
            </span>
            {!safeData.is_verificata ? (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                Verifica RUNTS in corso
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                Conforme D.Lgs 117/2017
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/profilo/modifica" className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
            Modifica Profilo
          </Link>
          <Link href="/app/associazione" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT SIDEBAR (Invariata) --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
             <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden mb-6 flex items-center justify-center">
                {safeData.logo_url ? <img src={safeData.logo_url} className="w-full h-full object-cover" alt="Logo" /> : <span className="text-4xl font-black text-slate-300">{iniziali}</span>}
             </div>
             <div className="w-full space-y-4 text-left pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Codice Fiscale</span>
                   <span className="font-mono font-bold text-slate-800 break-all">{safeData.codice_fiscale || '—'}</span>
                </div>
                <div className="px-2 space-y-3">
                   <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Email Istituzionale</span>
                      <span className="font-bold text-slate-800 text-sm truncate block">{safeData.email_associazione || email}</span>
                   </div>
                   <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Recapito Telefonico</span>
                      <span className="font-bold text-slate-800 text-sm block">{safeData.telefono || '—'}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* DASHBOARD IMPATTO */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-wrap justify-around gap-8 relative overflow-hidden">
             <div className="text-center z-10"><span className="text-4xl font-black block mb-1">{trasparenza.num_soci || 0}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Soci</span></div>
             <div className="text-center z-10"><span className="text-4xl font-black block mb-1 text-emerald-400">{trasparenza.num_volontari_attivi || 0}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Volontari</span></div>
             <div className="text-center z-10"><span className="text-4xl font-black block mb-1">{trasparenza.num_dipendenti || 0}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Dipendenti</span></div>
          </div>

          {/* MISSION */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-emerald-500 rounded-full" />La nostra Missione</h3>
             <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{safeData.descrizione || "Nessuna missione inserita."}</p>
          </div>

          {/* 🎯 AMBITI ARTICOLO 5 (Raggruppati con Colori e Tooltip) */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Settori di Intervento (Art. 5)</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Riferimento Registro Unico Terzo Settore</p>
             </div>
             
             {Object.keys(tagsRaggruppati).length > 0 ? (
                <div className="space-y-8">
                   {Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
                      <div key={categoria} className="space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{categoria}</span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {tagsInCat.map((t: any) => (
                               <TagBadge 
                                 key={t.id} 
                                 nome={t.name} 
                                 categoria={t.categoria} 
                                 descrizione={t.description} // Tooltip Art. 5 attivo!
                                 size="md" 
                               />
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <p className="text-slate-400 italic text-sm">Nessun settore configurato.</p>
             )}
          </div>

          {/* GOVERNANCE & SEDE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block">Sede Principale</span>
                <div className="space-y-1">
                   <p className="font-black text-slate-800">{sedePrincipale.indirizzo || 'Indirizzo non inserito'}</p>
                   <p className="font-bold text-slate-500 text-sm">{sedePrincipale.cap} {sedePrincipale.comune} ({sedePrincipale.provincia})</p>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block">Figure di Riferimento</span>
                <div className="space-y-4">
                   <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Legale Rappresentante</span>
                      <span className="font-black text-slate-800 text-sm">{formatFullName(trasparenza.legale_rappresentante_nome, trasparenza.legale_rappresentante_cognome)}</span>
                   </div>
                   <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Referente Progetto</span>
                      <span className="font-black text-slate-800 text-sm">{formatFullName(trasparenza.referente_progetto_nome, trasparenza.referente_progetto_cognome)}</span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}