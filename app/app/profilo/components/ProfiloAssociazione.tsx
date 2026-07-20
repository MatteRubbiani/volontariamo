'use client'

import Link from 'next/link'

interface ProfiloAssociazioneProps {
  data: any
  email: string
  percentage: number
  suggerimento: string
}

export default function ProfiloAssociazione({ data, email, percentage, suggerimento }: ProfiloAssociazioneProps) {
  if (!data) return <div className="p-20 text-center text-sm font-medium text-slate-400">Caricamento in corso...</div>
  
  const safeData = data || {}

  // Estrazione relazioni e sedi operative
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

  // 🟢 LOGO MASTER CON FALLBACK SULLA VETRINA
  const logoEffettivo = safeData.logo_url || safeData.logo_url_vetrina || ''

  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="max-w-[800px] mx-auto py-12 px-6 pb-24 font-sans antialiased selection:bg-slate-100 animate-in fade-in duration-500">
      
      {/* 🌟 CONTROLLI SUPERIORI */}
      <div className="flex items-center justify-between gap-4 mb-12">
        <Link href="/app/associazione" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Torna alla Dashboard
        </Link>
        <Link href="/app/profilo/modifica" className="inline-flex items-center gap-2 bg-slate-950 text-white hover:bg-black px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-[0.98]">
          Modifica informazioni
        </Link>
      </div>

      {/* 📊 BLOCCO STATO & PROGRESSO */}
      <div className="mb-14 border border-slate-100 bg-slate-50/40 p-6 rounded-3xl flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="3.5" fill="transparent" />
              <circle cx="24" cy="28" r={radius} stroke="#0f172a" strokeWidth="3.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-950">{percentage}%</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-slate-900">Completamento profilo</h4>
            <p className="text-[11px] text-slate-500 font-normal leading-normal animate-in fade-in duration-300">
              {suggerimento}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Verifica Registro</span>
          <span className="text-xs font-semibold text-slate-900 block mt-0.5 flex items-center gap-1.5 justify-end">
            <span className={`w-1.5 h-1.5 rounded-full ${safeData.is_verificata ? 'bg-slate-900' : 'bg-slate-300 animate-pulse'}`} />
            {safeData.is_verificata ? 'RUNTS Attivo' : 'In verifica'}
          </span>
        </div>
      </div>

      {/* 🏛️ SEZIONE INTESTAZIONE (LOGO RIEMPITIVO PREMIUM) */}
<div className="border-b border-slate-100 pb-10 flex items-start gap-6 mb-10">
  <div className="w-16 h-16 bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-center overflow-hidden font-semibold text-sm text-slate-400 shrink-0 select-none shadow-xs">
    {logoEffettivo ? (
      <img 
        src={logoEffettivo} 
        className="w-full h-full object-cover" 
        alt="Logo Ente" 
      />
    ) : (
      <span className="text-xl font-black text-slate-300 tracking-tighter">{iniziali}</span>
    )}
  </div>
  <div className="space-y-1.5 min-w-0">
    <span className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md inline-block">
      {safeData.forma_giuridica || 'ETS'}
    </span>
    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 leading-tight">
      {nomeGrezzo}
    </h1>
  </div>
</div>

      {/* 📄 DETTAGLI CORPO PROFILO */}
      <div className="flex flex-col gap-10">
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">La nostra Missione</h3>
          <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap">
            {safeData.descrizione || "Nessuna presentazione configurata."}
          </p>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Informazioni & Recapiti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
            <div className="space-y-0.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Codice Fiscale</span><span className="font-mono font-medium text-slate-800">{safeData.codice_fiscale || '—'}</span></div>
            <div className="space-y-0.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Indirizzo Sede</span><span className="font-medium text-slate-800 truncate block">{sedePrincipale.indirizzo ? `${sedePrincipale.indirizzo}, ${sedePrincipale.comune}` : 'Non inserito'}</span></div>
            <div className="space-y-0.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Email Istituzionale</span><span className="font-medium text-slate-800 truncate block">{safeData.email_associazione || email}</span></div>
            {safeData.telefono && <div className="space-y-0.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Contatto Telefonico</span><span className="font-medium text-slate-800">{safeData.telefono}</span></div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Referente Responsabile</span>
            <span className="font-medium text-slate-900 text-sm block">{trasparenza.referente_progetto_nome ? `${trasparenza.referente_progetto_nome} ${trasparenza.referente_progetto_cognome || ''}` : '—'}</span>
            {trasparenza.referente_progetto_ruolo && <span className="text-xs text-slate-400 font-normal block">{trasparenza.referente_progetto_ruolo}</span>}
          </div>
          <div className="flex gap-8 items-center justify-end text-right">
            <div><span className="text-lg font-semibold text-slate-900 block leading-none">{trasparenza.num_volontari_attivi || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mt-1">Volontari attivi</span></div>
            <div className="pl-4 border-l border-slate-100"><span className="text-lg font-semibold text-slate-900 block leading-none">{trasparenza.num_soci || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mt-1">Soci totali</span></div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ambiti istituzionali</h3>
            <p className="text-[10px] text-slate-400 font-normal">I settori di intervento registrati in cui opera l'organizzazione</p>
          </div>
          {Object.keys(tagsRaggruppati).length > 0 ? (
            <div className="flex flex-col gap-4">
              {Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
                <div key={categoria} className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">{categoria}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsInCat.map((t: any) => <span key={t.id} className="bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl select-none">{t.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400 italic text-xs">Nessun ambito impostato.</p>}
        </div>

      </div>
    </div>
  )
}