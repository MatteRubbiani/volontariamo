'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  CalendarDays, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  FlaskConical,
  X
} from 'lucide-react'

export default function OggiPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showDemoToast = (actionName: string) => {
    setToastMessage(`[DEMO] Azione simulata: "${actionName}". In produzione aprirà il drawer dedicato.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const todayFormatted = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto py-2 relative">
      
      {/* =========================================================
          BANNER SANDBOX / DEMO
         ========================================================= */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-black uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
            Preview Demo
          </span>
          <span className="font-medium text-amber-900">
            Dati e metriche di simulazione per la presentazione.
          </span>
        </div>
        <span className="text-[11px] text-amber-700/80 hidden md:inline font-semibold">
          Ambiente non collegato al database di produzione
        </span>
      </div>

      {/* =========================================================
          NOTIFICA TOAST INTERATTIVA (Per i click durante la demo)
         ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-50 max-w-sm p-3.5 rounded-2xl bg-slate-950 text-white text-xs font-medium shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-slate-800 rounded-lg">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* =========================================================
          1. HEADER DELLA GIORNATA
         ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 capitalize">
              {todayFormatted}
            </p>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              Mock Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Panoramica di Oggi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tieni d&apos;occhio i turni attivi, i volontari presenti e le richieste urgenti.
          </p>
        </div>

        {/* Pulsanti Rapidi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showDemoToast("Pianificazione Nuovo Turno")}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Nuovo Turno</span>
          </button>
          <button
            type="button"
            onClick={() => showDemoToast("Creazione Nuova Posizione")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Crea Posizione</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. METRICHE CHIAVE RAPIDE (3 KPI con badge DEMO)
         ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* KPI 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <span className="absolute top-2 right-2 text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">
            Simulato
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Turno Oggi</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">4</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 2 turni coperti regolarmente
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => showDemoToast("Visualizzazione Candidature in arrivo")}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 cursor-pointer group relative overflow-hidden"
        >
          <span className="absolute top-2 right-2 text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">
            Simulato
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuove Candidature</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 group-hover:text-blue-600 transition-colors">3</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              In attesa di revisione <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <Link 
          href="/app/associazione/messaggi" 
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
        >
          <span className="absolute top-2 right-2 text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">
            Simulato
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Messaggi</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 group-hover:text-amber-600 transition-colors">2</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              Conversazioni non lette <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </p>
          </div>
        </Link>

      </div>

      {/* =========================================================
          3. GRIGLIA PRINCIPALE
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNA SINISTRA: TURNI */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-900" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Attività e Turni Odierni
              </h2>
            </div>
            <Link 
              href="/app/associazione/turni" 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Vedi calendario</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {/* Turno 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex flex-col items-center justify-center font-bold shrink-0">
                  <span className="text-[10px] uppercase text-slate-500 font-extrabold">Ore</span>
                  <span className="text-xs leading-none">09:30</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Distribuzione Pacchi Alimentari</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">In corso</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Sede Operativa • Fino alle 12:30</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">M</div>
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">E</div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Marco Rossi, Elena Bianchi</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="text-xs font-bold text-slate-500">2 / 2 Volontari</span>
                <span className="text-[11px] font-semibold text-emerald-600">Completo</span>
              </div>
            </div>

            {/* Turno 2 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex flex-col items-center justify-center font-bold shrink-0">
                  <span className="text-[10px] uppercase text-slate-500 font-extrabold">Ore</span>
                  <span className="text-xs leading-none">15:00</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Doposcuola e Supporto Compiti</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">Pomeriggio</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Centro Giovani • 15:00 - 18:00</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">S</div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Sofia Martini</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 1 / 2 Volontari
                </span>
                <span className="text-[11px] font-medium text-slate-400">Serve 1 persona</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DA FARE SUBITO */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Da Fare Subito
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  Candidatura Demo
                </span>
                <span className="text-[11px] text-slate-400 font-medium">10m fa</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Luca Moretti si è candidato</p>
                <p className="text-xs text-slate-500 mt-0.5">Per: Accoglienza e Segreteria</p>
              </div>
              <button
                type="button"
                onClick={() => showDemoToast("Revisione Candidato Luca Moretti")}
                className="w-full text-center py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-black transition-colors"
              >
                Esamina Profilo
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200/60 bg-amber-50/20 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Turno Incompleto
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">Oggi 15:00</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Manca 1 volontario per il Doposcuola</p>
                <p className="text-xs text-slate-500 mt-0.5">Invita un volontario dalla tua squadra.</p>
              </div>
              <Link
                href="/app/associazione/squadra"
                className="block text-center py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors"
              >
                Cerca tra i Volontari
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}