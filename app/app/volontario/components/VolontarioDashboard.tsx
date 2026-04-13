'use client'

import { useWorkspace } from '@/lib/context/WorkspaceContext'
import PosizioneCard from '@/components/PosizioneCard'
import FiltriRicerca from '@/components/FiltriRicerca'
import { useEffect } from 'react'

// Mock dati per dashboard privata
const mockOreVolate = 24
const mockProssimiEventi = [
  { id: 1, titolo: 'Esplora cause', descrizione: 'Scopri le associazioni che supportano le tue cause' },
  { id: 2, titolo: 'Gestisci competenze', descrizione: 'Aggiorna le tue competenze e interessi' }
]

// Mock dati per dashboard aziendale
const mockOreAziendale = 16
const mockImpactMetrics = [
  { label: 'Ore Donate', value: '16h', icon: '⏱️', color: 'violet' },
  { label: 'Prossimi Eventi', value: '3', icon: '📅', color: 'purple' },
  { label: 'Impact Score', value: '8.5/10', icon: '🎯', color: 'blue' }
]

interface VolontarioDashboardProps {
  posizioniGrezze: any[]
  allTags: any[]
  userTagIds: string[]
  isSearching: boolean
}

export function VolontarioDashboard({
  posizioniGrezze,
  allTags,
  userTagIds,
  isSearching
}: VolontarioDashboardProps) {
  const { workspace, setWorkspace, hasAziendale } = useWorkspace()

  // Se è la prima volta e ha un'azienda, facciamo settare il context
useEffect(() => {
    if (hasAziendale && !workspace) {
      setWorkspace('privato')
    }
  }, [hasAziendale, workspace, setWorkspace])

  // ===== DASHBOARD PRIVATA =====
  if (workspace === 'privato') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50 transition-colors duration-500 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          {/* HERO SECTION */}
          <section className="mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
                Esplora Opportunità
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                Scopri le associazioni che fanno la differenza. Scegli la causa che ti appassiona e inizia a fare volontariato.
              </p>
            </div>

            {/* STAT PRIVATA */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Le Tue Ore di Volontariato</p>
                <p className="text-4xl font-black text-slate-900">{mockOreVolate}h</p>
                <p className="text-sm text-slate-500 mt-1">nella tua realtà privata</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Prossimi Step</p>
                <p className="text-2xl font-black text-slate-900">Candidati</p>
                <p className="text-sm text-slate-500 mt-1">a nuove posizioni</p>
              </div>
            </div>
          </section>

          {/* FILTRI E POSIZIONI */}
          <FiltriRicerca allTags={allTags} />

          {isSearching ? (
            <section className="mt-12">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Risultati Ricerca</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posizioniGrezze.map((posizione) => (
                  <PosizioneCard key={posizione.id} posizione={posizione} ruolo="volontario" />
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-12">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Opportunità Consigliate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posizioniGrezze.slice(0, 6).map((posizione) => (
                  <PosizioneCard key={posizione.id} posizione={posizione} ruolo="volontario" />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    )
  }

  // ===== DASHBOARD AZIENDALE =====
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-colors duration-500 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HERO SECTION - TEMA CORPORATE */}
        <section className="mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              Area Team ESG
            </h1>
            <p className="text-lg text-purple-100 max-w-2xl">
              Monitora il tuo impatto aziendale, collabora con il team e partecipa alle iniziative ESG.
            </p>
          </div>

          {/* METRIC GRID AZIENDALE */}
          <div className="grid gap-4 md:grid-cols-3">
            {mockImpactMetrics.map((metric, idx) => {
              const colorMap = {
                violet: 'from-violet-500 to-violet-600',
                purple: 'from-purple-500 to-purple-600',
                blue: 'from-blue-500 to-blue-600'
              }
              const bgColor = colorMap[metric.color as keyof typeof colorMap]

              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${bgColor} rounded-2xl p-6 shadow-lg text-white transform hover:scale-105 transition-all duration-300`}
                >
                  <p className="text-3xl mb-2">{metric.icon}</p>
                  <p className="text-sm font-bold opacity-90 mb-1">{metric.label}</p>
                  <p className="text-3xl font-black">{metric.value}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-20 rounded-3xl p-8 text-white hover:bg-opacity-20 transition-all duration-300">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-black mb-2">Collaborazione Team</h3>
            <p className="text-purple-100 text-sm mb-4">
              Connettiti con i tuoi colleghi e condividi le vostre esperienze di volontariato.
            </p>
            <button className="text-sm font-bold bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors">
              Accedi al Forum
            </button>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-20 rounded-3xl p-8 text-white hover:bg-opacity-20 transition-all duration-300">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-xl font-black mb-2">Formazione CSR</h3>
            <p className="text-purple-100 text-sm mb-4">
              Partecipa a webinar sulla responsabilità sociale e sviluppa le tue competenze ESG.
            </p>
            <button className="text-sm font-bold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              Vedi Webinar
            </button>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-20 rounded-3xl p-8 text-white hover:bg-opacity-20 transition-all duration-300">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-black mb-2">Traccia Impatto</h3>
            <p className="text-purple-100 text-sm mb-4">
              Monitora le ore donate e vedi il tuo contributo all'impatto aziendale.
            </p>
            <button className="text-sm font-bold bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors">
              Visualizza Report
            </button>
          </div>
        </section>

        {/* PROSSIME CANDIDATURE AZIENDALI */}
        <section className="mt-12">
          <h2 className="text-2xl font-black text-white mb-6">Posizioni Aziendali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posizioniGrezze.slice(0, 3).map((posizione) => (
              <PosizioneCard key={posizione.id} posizione={posizione} ruolo="volontario" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}