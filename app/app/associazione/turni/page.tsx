'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Clock, 
  CalendarDays, 
  Plus, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  UserPlus, 
  Filter,
  MoreVertical
} from 'lucide-react'

// Mock dati turni per la demo
const initialShifts = [
  {
    id: 't-1',
    titolo: 'Distribuzione Pacchi Alimentari',
    dataLabel: 'Oggi, 29 Settembre',
    orarioInizio: '09:30',
    orarioFine: '12:30',
    sede: 'Sede Operativa Centrale - Via Emilia 14',
    volontariRichiesti: 3,
    volontariAssegnati: [
      { id: 'v-1', nome: 'Marco Rossi', avatar: 'M', colore: 'bg-blue-600' },
      { id: 'v-2', nome: 'Elena Bianchi', avatar: 'E', colore: 'bg-purple-600' },
    ],
    stato: 'incompleto', // 'completo' | 'incompleto'
    categoria: 'Logistica e Magazzino'
  },
  {
    id: 't-2',
    titolo: 'Doposcuola e Aiuto Compiti Elementari',
    dataLabel: 'Oggi, 29 Settembre',
    orarioInizio: '15:00',
    orarioFine: '18:00',
    sede: 'Centro Sociale Arcobaleno',
    volontariRichiesti: 2,
    volontariAssegnati: [
      { id: 'v-3', nome: 'Sofia Martini', avatar: 'S', colore: 'bg-amber-600' },
    ],
    stato: 'incompleto',
    categoria: 'Educazione'
  },
  {
    id: 't-3',
    titolo: 'Sportello di Ascolto e Accoglienza',
    dataLabel: 'Domani, 30 Settembre',
    orarioInizio: '10:00',
    orarioFine: '13:00',
    sede: 'Punto Informativo Stazione',
    volontariRichiesti: 2,
    volontariAssegnati: [
      { id: 'v-4', nome: 'Chiara Galli', avatar: 'C', colore: 'bg-emerald-600' },
      { id: 'v-5', nome: 'Davide Neri', avatar: 'D', colore: 'bg-indigo-600' },
    ],
    stato: 'completo',
    categoria: 'Segreteria'
  },
  {
    id: 't-4',
    titolo: 'Raccolta Alimentare Supermercato Coop',
    dataLabel: 'Giovedì, 1 Ottobre',
    orarioInizio: '08:30',
    orarioFine: '13:00',
    sede: 'Centro Commerciale I Gelsi',
    volontariRichiesti: 4,
    volontariAssegnati: [
      { id: 'v-6', nome: 'Paolo Ferri', avatar: 'P', colore: 'bg-rose-600' },
      { id: 'v-7', nome: 'Alessia Rinaldi', avatar: 'A', colore: 'bg-teal-600' },
      { id: 'v-8', nome: 'Simone Conti', avatar: 'S', colore: 'bg-violet-600' },
      { id: 'v-9', nome: 'Martina Serra', avatar: 'M', colore: 'bg-cyan-600' },
    ],
    stato: 'completo',
    categoria: 'Raccolta Fondi'
  }
]

export default function TurniPage() {
  const [filter, setFilter] = useState<'tutti' | 'incompleti' | 'completi'>('tutti')
  const [selectedDay, setSelectedDay] = useState<number>(2) // 2 = Oggi (Mar 29)

  // Giorni della settimana simulati
  const weekDays = [
    { dayNumber: 27, dayName: 'Dom', turniCount: 1, hasAlert: false },
    { dayNumber: 28, dayName: 'Lun', turniCount: 2, hasAlert: false },
    { dayNumber: 29, dayName: 'Mar', turniCount: 2, hasAlert: true }, // Oggi
    { dayNumber: 30, dayName: 'Mer', turniCount: 1, hasAlert: false },
    { dayNumber: 1, dayName: 'Gio', turniCount: 1, hasAlert: false },
    { dayNumber: 2, dayName: 'Ven', turniCount: 3, hasAlert: true },
    { dayNumber: 3, dayName: 'Sab', turniCount: 0, hasAlert: false },
  ]

  const filteredShifts = initialShifts.filter((s) => {
    if (filter === 'incompleti') return s.stato === 'incompleto'
    if (filter === 'completi') return s.stato === 'completo'
    return true
  })

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto py-2">
        {/* BANNER DEMO STRIPE STYLE */}
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
            Turni e fasce orarie simulate per la presentazione.
          </span>
        </div>
        <span className="text-[11px] text-amber-700/80 hidden md:inline font-semibold">
          Modalità Sandbox
        </span>
      </div>
      
      {/* =========================================================
          1. HEADER DELLA SEZIONE
         ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Calendario & Assegnazioni
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Gestione Turni
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pianifica le fasce orarie, monitora le presenze e copri i posti vacanti.
          </p>
        </div>

        {/* Azioni Rapide */}
        <div className="flex items-center gap-2">
          <Link
            href="/app/associazione/squadra"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Vedi Squadra</span>
            <span className="sm:hidden">Squadra</span>
          </Link>

          <button
            type="button"
            onClick={() => alert("Funzionalità di creazione turno in arrivo nella demo!")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Nuovo Turno</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. STRIP SETTIMANALE (NAVIGATORE A GIORNI)
         ========================================================= */}
      <div className="flex flex-col gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-900" />
            <span className="text-xs font-bold text-slate-900">Settimana 28 Set - 4 Ott</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottoni Giorni */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((d, idx) => {
            const isSelected = selectedDay === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDay(idx)}
                className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {d.dayName}
                </span>
                <span className="text-sm sm:text-base font-black leading-tight mt-0.5">
                  {d.dayNumber}
                </span>
                
                {/* Badge Turni */}
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    d.hasAlert ? 'bg-amber-500' : d.turniCount > 0 ? (isSelected ? 'bg-emerald-400' : 'bg-slate-400') : 'bg-transparent'
                  }`} />
                  <span className={`text-[9px] font-extrabold hidden sm:inline ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {d.turniCount}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================================
          3. BARRA FILTRI RAPIDI
         ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
          <button
            onClick={() => setFilter('tutti')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'tutti' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tutti ({initialShifts.length})
          </button>
          <button
            onClick={() => setFilter('incompleti')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'incompleti' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Da Coprire (2)</span>
          </button>
          <button
            onClick={() => setFilter('completi')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'completi' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Completi (2)
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Mostrando {filteredShifts.length} turni programmati
        </span>
      </div>

      {/* =========================================================
          4. LISTA DELLE SCHEDE TURNO
         ========================================================= */}
      <div className="flex flex-col gap-3.5">
        {filteredShifts.map((shift) => {
          const postiMancanti = shift.volontariRichiesti - shift.volontariAssegnati.length
          const isCompleto = postiMancanti <= 0

          return (
            <div
              key={shift.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Sinistra: Info Temporali & Dettagli Attività */}
              <div className="flex items-start gap-4">
                
                {/* Box Orario */}
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                  <span className="text-xs font-black text-slate-950 leading-none">
                    {shift.orarioInizio}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {shift.orarioFine}
                  </span>
                </div>

                {/* Testi Principali */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {shift.categoria}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {shift.dataLabel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 leading-tight">
                    {shift.titolo}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{shift.sede}</span>
                  </div>
                </div>
              </div>

              {/* Centro/Destra: Volontari e Stato Copertura */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                
                {/* Avatars Volontari Assegnati */}
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {shift.volontariAssegnati.map((v) => (
                      <div
                        key={v.id}
                        title={v.nome}
                        className={`w-8 h-8 rounded-full ${v.colore} text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs`}
                      >
                        {v.avatar}
                      </div>
                    ))}
                    {!isCompleto && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold flex items-center justify-center">
                        +{postiMancanti}
                      </div>
                    )}
                  </div>

                  {/* Testo Stato Copertura */}
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">
                      {shift.volontariAssegnati.length} / {shift.volontariRichiesti} Volontari
                    </div>
                    <div className="text-[11px] font-semibold">
                      {isCompleto ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Turno coperto
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Manca {postiMancanti} persona
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasto Azione */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCompleto ? (
                    <button
                      type="button"
                      onClick={() => alert(`Apertura selezione volontari per: ${shift.titolo}`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assegna</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`Dettagli turno: ${shift.titolo}`)}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Dettagli
                    </button>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}