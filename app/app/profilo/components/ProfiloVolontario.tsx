'use client'

import Link from 'next/link'

interface ProfiloVolontarioProps {
  data: any
  email: string
  percentage: number
  suggerimento: string // 🟢 Ereditata dall'algoritmo dinamico server-side
}

export default function ProfiloVolontario({ data, email, percentage, suggerimento }: ProfiloVolontarioProps) {
  if (!data) return <div className="p-20 text-center text-sm font-medium text-slate-400">Caricamento in corso...</div>

  const safeData = data || {}
  const iniziali = `${safeData.nome?.charAt(0) || ''}${safeData.cognome?.charAt(0) || 'V'}`.toUpperCase()
  
  const tags = safeData.tags?.map((t: any) => t.tag) || []
  const competenze = safeData.competenze?.map((c: any) => c.competenza) || []

  // Calcolo per l'anello progressivo SVG
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="max-w-[800px] mx-auto py-12 px-6 pb-24 font-sans antialiased selection:bg-slate-100 animate-in fade-in duration-500">
      
      {/* 🌟 CONTROLLI SUPERIORI */}
      <div className="flex items-center justify-between gap-4 mb-12 shrink-0">
        <Link 
          href="/app/volontario" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Torna alla Dashboard
        </Link>

        <Link 
          href="/app/profilo/modifica" 
          className="inline-flex items-center gap-2 bg-slate-950 text-white hover:bg-black px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-[0.98]"
        >
          Modifica informazioni
        </Link>
      </div>

      {/* ========================================================
          📊 BLOCCO PERCENTUALE COMPUTATA CON DIALOGO CONTESTUALE REALE
         ======================================================== */}
      <div className="mb-14 border border-slate-100 bg-slate-50/40 p-6 rounded-3xl flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="3.5" fill="transparent" />
              <circle 
                cx="24" cy="28" r={radius} stroke="#0f172a" strokeWidth="3.5" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-950">{percentage}%</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-slate-900">Completamento profilo</h4>
            <p className="text-[11px] text-slate-500 font-normal leading-normal animate-in fade-in duration-300">
              {suggerimento} {/* 🟢 Mostra l'azione reale mancante elaborata dal server */}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Stato Account</span>
          <span className="text-xs font-semibold text-slate-900 block mt-0.5 flex items-center gap-1.5 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            Membro attivo
          </span>
        </div>
      </div>

      {/* ========================================================
          👤 SEZIONE INTESTAZIONE EDITORIALE (FOTO / AVATAR)
         ======================================================== */}
      <div className="border-b border-slate-100 pb-10 flex items-start gap-6 mb-10">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden font-semibold text-sm text-slate-400 shrink-0 select-none">
          {safeData.foto_profilo_url ? (
            <img src={safeData.foto_profilo_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-xl font-black text-slate-300 tracking-tighter">{iniziali}</span>
          )}
        </div>
        <div className="space-y-1.5 min-w-0">
          <span className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md inline-block">
            Volontario
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 leading-tight">
            {safeData.nome || safeData.cognome ? `${safeData.nome || ''} ${safeData.cognome || ''}` : 'Cittadino'}
          </h1>
        </div>
      </div>

      {/* ========================================================
          📄 DETTAGLI CORPO PROFILO
         ======================================================== */}
      <div className="flex flex-col gap-10">
        
        {/* PRESENTAZIONE / BIO */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presentazione</h3>
          {safeData.bio ? (
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap">
              {safeData.bio}
            </p>
          ) : (
            <p className="text-slate-400 italic text-sm">Nessuna biografia configurata nel profilo.</p>
          )}
        </div>

        {/* SCHEDA CONTATTI E LOCALIZZAZIONE COMPATTA */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Informazioni Personali</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Località</span>
              <span className="font-medium text-slate-800">
                {safeData.citta_residenza ? `${safeData.citta_residenza} ${safeData.cap ? `(${safeData.cap})` : ''}` : 'Non inserito'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Email di Contatto</span>
              <span className="font-medium text-slate-800 truncate block">{safeData.email_contatto || email}</span>
            </div>
            {safeData.telefono && (
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Recapito Telefonico</span>
                <span className="font-medium text-slate-800">{safeData.telefono}</span>
              </div>
            )}
            {safeData.grado_istruzione && (
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Grado di Istruzione</span>
                <span className="font-medium text-slate-800">{safeData.grado_istruzione}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            🏷️ CARD COMPETENZE AGGIORNATA (TESTO PREMIUM)
           ======================================================== */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Competenze Speciali</h3>
            <p className="text-[10px] text-slate-400 font-normal">I tuoi punti di forza che metti a disposizione degli enti</p>
          </div>

          {competenze.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {competenze.map((c: any) => (
                <span 
                  key={c.id} 
                  className="bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl select-none"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-xs">Nessuna competenza speciale configurata.</p>
          )}
        </div>

        {/* ========================================================
            🏷️ CARD CAUSE AGGIORNATA (TESTO PREMIUM)
           ======================================================== */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cause Supportate</h3>
            <p className="text-[10px] text-slate-400 font-normal">Gli ambiti e le cause sociali che ti stanno più a cuore</p>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t: any) => (
                <span 
                  key={t.id} 
                  className="bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl select-none"
                >
                  {t.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-xs">Nessuna causa sociale configurata.</p>
          )}
        </div>

      </div>
    </div>
  )
}