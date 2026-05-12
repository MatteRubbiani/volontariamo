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
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 pb-24 animate-in fade-in duration-500 font-sans">
      
      {/* 🌟 BARRA DI AZIONE SUPERIORE */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <Link 
          href="/app/associazione" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Torna alla Dashboard
        </Link>

        <Link 
          href="/profilo/modifica" 
          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200/80 transition-all shadow-2xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
          Modifica Profilo
        </Link>
      </div>

      {/* 🏛️ HERO CARD INTEGRATA (Identità Globale) */}
      <div className="relative bg-white rounded-[2.5rem] border border-slate-100/80 shadow-xs pt-16 pb-10 px-6 sm:px-12 mb-10 overflow-hidden">
        {/* Sfondo Astratto Top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-emerald-50/50 via-slate-50 to-white border-b border-slate-50" />

        {/* LOGO OVERLAPPING */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-24 mb-6">
          <div className="w-32 h-32 rounded-[1.75rem] bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
            {safeData.logo_url ? (
              <img src={safeData.logo_url} className="w-full h-full object-cover" alt="Logo Ente" />
            ) : (
              <span className="text-4xl font-black text-slate-300 tracking-tighter">{iniziali}</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-slate-900 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-md tracking-wider">
                {safeData.forma_giuridica || 'Ente ETS'}
              </span>
              
              {safeData.is_verificata ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verificato RUNTS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  In fase di accreditamento
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              {nomeGrezzo}
            </h1>
          </div>
        </div>

        {/* QUICK INFO BAR */}
        <div className="relative z-10 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Codice Fiscale</span>
            <span className="font-mono font-semibold text-slate-700">{safeData.codice_fiscale || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Sede Operativa Principale</span>
            <span className="font-medium text-slate-700 truncate block">
              {sedePrincipale.comune ? `${sedePrincipale.comune} (${sedePrincipale.provincia})` : 'Sede non specificata'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Contatto Istituzionale</span>
            <span className="font-medium text-slate-700 truncate block">{safeData.email_associazione || email}</span>
          </div>
        </div>
      </div>

      {/* 📊 SEZIONE CENTRALE: CONTENUTI E METRICHE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA SINISTRA: Informazioni e Governance (4 Colonne) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD GOVERNANCE */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xs space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Struttura Organizzativa</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-50/60 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Legale Rappresentante</span>
                <span className="font-black text-slate-800 text-sm block">
                  {formatFullName(trasparenza.legale_rappresentante_nome, trasparenza.legale_rappresentante_cognome)}
                </span>
              </div>

              <div className="p-3 bg-slate-50/60 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Referente Principale</span>
                <span className="font-black text-slate-800 text-sm block">
                  {formatFullName(trasparenza.referente_progetto_nome, trasparenza.referente_progetto_cognome)}
                </span>
                {trasparenza.referente_progetto_ruolo && (
                  <span className="text-[10px] font-bold text-emerald-600 block pt-0.5">
                    {trasparenza.referente_progetto_ruolo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CARD SEDE DETTAGLIATA */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recapiti e Sede</h3>
            
            <div className="text-xs space-y-2 pt-1 text-slate-600">
              <p className="font-bold text-slate-800 text-sm leading-snug">
                {sedePrincipale.indirizzo || 'Indirizzo non inserito'}
              </p>
              <p className="font-medium text-slate-500">
                {sedePrincipale.cap} {sedePrincipale.comune} {sedePrincipale.provincia ? `(${sedePrincipale.provincia})` : ''}
              </p>
              
              {safeData.telefono && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400">Telefono:</span>
                  <span className="font-semibold text-slate-800">{safeData.telefono}</span>
                </div>
              )}
            </div>
          </div>

          {/* CARD TRASPARENZA */}
          {trasparenza.is_iscritto_runts && (
            <div className="bg-gradient-to-br from-blue-50/40 to-slate-50 p-6 rounded-[2rem] border border-blue-100/60 space-y-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600 shrink-0">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Dati RUNTS</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-blue-700/70 block font-semibold uppercase">Numero Repertorio</span>
                  <span className="font-mono font-bold text-slate-800">{trasparenza.runts_repertorio || '—'}</span>
                </div>
                {trasparenza.pec && (
                  <div>
                    <span className="text-[10px] text-blue-700/70 block font-semibold uppercase">PEC Registrata</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">{trasparenza.pec}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLONNA DESTRA: Missione, Metriche e Ambiti (8 Colonne) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BANNER IMPATTO (Layout Moderno a 3 Moduli) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 text-white shadow-sm border border-slate-700/40">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-6 text-center sm:text-left">
              Le Forze in Campo
            </span>

            <div className="grid grid-cols-3 gap-4 divide-x divide-slate-700/60 text-center">
              <div>
                <span className="text-3xl sm:text-4xl font-black block tracking-tight text-white mb-1">
                  {trasparenza.num_soci || 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Soci Aderenti
                </span>
              </div>

              <div>
                <span className="text-3xl sm:text-4xl font-black block tracking-tight text-emerald-400 mb-1">
                  {trasparenza.num_volontari_attivi || 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Volontari Attivi
                </span>
              </div>

              <div>
                <span className="text-3xl sm:text-4xl font-black block tracking-tight text-white mb-1">
                  {trasparenza.num_dipendenti || 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Staff Stabile
                </span>
              </div>
            </div>
          </div>

          {/* MISSIONE DELL'ENTE */}
          <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-2xs space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">La nostra Missione</h2>
            <p className="text-slate-600 leading-relaxed font-medium text-sm whitespace-pre-wrap">
              {safeData.descrizione || "La narrazione istituzionale dell'ente non è stata ancora configurata."}
            </p>
          </div>

          {/* SETTORI DI INTERVENTO (Art. 5) */}
          <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-2xs space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Aree di Intervento</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Classificazione conforme all'Articolo 5 del Codice del Terzo Settore
              </p>
            </div>

            {Object.keys(tagsRaggruppati).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
                  <div key={categoria} className="space-y-3 pt-2 first:pt-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {categoria}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {tagsInCat.map((t: any) => (
                        <TagBadge 
                          key={t.id} 
                          nome={t.name} 
                          categoria={t.categoria} 
                          descrizione={t.description} 
                          size="md" 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs">Nessun ambito di attività configurato per questo profilo.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}