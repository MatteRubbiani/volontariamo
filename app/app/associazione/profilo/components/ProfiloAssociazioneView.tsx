'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Edit3, 
  ShieldCheck, 
  Users, 
  Store,
  ExternalLink
} from 'lucide-react'
import { logout } from '@/app/auth/actions'

interface ProfiloAssociazioneViewProps {
  data: any
  email: string
  percentage: number
  suggerimento: string
}

export default function ProfiloAssociazioneView({
  data,
  email,
  percentage,
  suggerimento,
}: ProfiloAssociazioneViewProps) {
  const safeData = data || {}

  // Estrazione relazioni e sedi operative
  const trasparenza = Array.isArray(safeData.associazioni_trasparenza)
    ? safeData.associazioni_trasparenza[0] || {}
    : safeData.associazioni_trasparenza || {}

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
    const cat = tag.categoria || 'Generale'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tag)
    return acc
  }, {})

  const nomeGrezzo = safeData.denominazione || safeData.nome || 'Organizzazione'
  const iniziali = nomeGrezzo.substring(0, 2).toUpperCase()
  const logoEffettivo = safeData.logo_url || safeData.logo_url_vetrina || ''

  // Cerchio percentuale completamento SVG
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="max-w-5xl mx-auto py-2 flex flex-col gap-6 sm:gap-8 font-sans">
      
      {/* =========================================================
          1. CONTROLLI SUPERIORI & BREADCRUMB
         ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/associazione/oggi"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Torna alla panoramica"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Impostazioni Istituzionali
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Ente
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Anagrafica & Informazioni
            </h1>
          </div>
        </div>

        {/* Tasti Rapidi Azioni */}
        <div className="flex items-center gap-2">
          <Link
            href="/app/associazione/personalizza"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Vetrina Pubblica</span>
          </Link>

          <button
            type="button"
            onClick={() => alert("Apertura modulo modifica dati (in arrivo)")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-white" />
            <span>Modifica Dati</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. STATO RUNTS & PROGRESSO COMPLETAMENTO
         ========================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="#0f172a"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-950">{percentage}%</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Completamento Profilo</h4>
            <p className="text-xs text-slate-500 font-medium">
              {suggerimento}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:border-l md:border-slate-100 md:pl-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stato Registro</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${safeData.is_verificata ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-xs font-bold text-slate-900">
                {safeData.is_verificata ? 'Iscritto RUNTS' : 'In attesa di verifica'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. SCHEDA PRINCIPALE ENTE
         ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-8">
        
        {/* Intestazione Brand / Denominazione */}
        <div className="flex items-start gap-5 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {logoEffettivo ? (
              <img src={logoEffettivo} alt="Logo Ente" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-slate-400 tracking-tighter">{iniziali}</span>
            )}
          </div>
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-extrabold uppercase tracking-wider">
              {safeData.forma_giuridica || 'ETS'}
            </span>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-tight">
              {nomeGrezzo}
            </h2>
          </div>
        </div>

        {/* Missione / Descrizione */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            La Nostra Missione
          </h3>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
            {safeData.descrizione || 'Nessuna presentazione o mission configurata per questo ente.'}
          </p>
        </div>

        {/* Informazioni Fiscali & Sede */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Dati Fiscali & Recapiti Istituzionali
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Codice Fiscale / P.IVA</span>
              <span className="font-mono font-bold text-slate-900">{safeData.codice_fiscale || '—'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Sede Principale</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {sedePrincipale.indirizzo ? `${sedePrincipale.indirizzo}, ${sedePrincipale.comune || ''}` : 'Sede non specificata'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Email Istituzionale</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {safeData.email_associazione || email}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Recapito Telefonico</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {safeData.telefono || 'Non specificato'}
              </span>
            </div>
          </div>
        </div>

        {/* Trasparenza & Referente */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Referente Responsabile</span>
            <span className="font-bold text-slate-900 text-sm block">
              {trasparenza.referente_progetto_nome
                ? `${trasparenza.referente_progetto_nome} ${trasparenza.referente_progetto_cognome || ''}`
                : 'Referente non inserito'}
            </span>
            {trasparenza.referente_progetto_ruolo && (
              <span className="text-xs text-slate-500 font-medium block">
                {trasparenza.referente_progetto_ruolo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left sm:text-right">
              <span className="text-xl font-black text-slate-900 block leading-none">
                {trasparenza.num_volontari_attivi || 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1 block">
                Volontari Attivi
              </span>
            </div>
            <div className="pl-6 border-l border-slate-100 text-left sm:text-right">
              <span className="text-xl font-black text-slate-900 block leading-none">
                {trasparenza.num_soci || 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1 block">
                Soci Iscritti
              </span>
            </div>
          </div>
        </div>

        {/* Ambiti d'Intervento / Tag */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ambiti di Intervento
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Settori accreditati in cui opera l&apos;organizzazione
            </p>
          </div>

          {Object.keys(tagsRaggruppati).length > 0 ? (
            <div className="flex flex-col gap-3">
              {Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
                <div key={categoria} className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    {categoria}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tagsInCat.map((t: any) => (
                      <span
                        key={t.id}
                        className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl select-none"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Nessun ambito inserito.</p>
          )}
        </div>

        {/* Disconnessione */}
        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <form action={logout}>
            <button
              type="submit"
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            >
              Disconnetti Account Ente
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}