'use client'

import { useState } from 'react'
import Link from 'next/link'
import PosizioneCard from '@/components/PosizioneCard'
import { MapPin, Inbox, Sparkles, Compass } from 'lucide-react'

interface FeedSections {
  consigliate: any[]
  vicine: any[]
  ultime: any[]
  una_tantum: any[]
}

interface Props {
  nomeUtente: string
  cittaUtente: string | null
  sections: FeedSections
  hasAziendale?: boolean
}

export function VolontarioDashboard({ 
  nomeUtente, 
  cittaUtente, 
  sections = { consigliate: [], vicine: [], ultime: [], una_tantum: [] },
  hasAziendale = false
}: Props) {
  const [activeTab, setActiveTab] = useState<'ultime' | 'vicine' | 'una_tantum'>('ultime')

  const totalPositions = (sections.consigliate?.length || 0) + (sections.ultime?.length || 0)

  const activeItems = activeTab === 'vicine' 
    ? (sections.vicine || [])
    : activeTab === 'una_tantum' 
      ? (sections.una_tantum || [])
      : (sections.ultime || [])

  // 📦 COMPONENTE ROW INTELLIGENTE: Flex/Grid se pochi elementi, Slider se tanti
  const AdaptiveCardRow = ({ items }: { items: any[] }) => {
    if (!items || items.length === 0) {
      return (
        <div className="py-6">
          <div className="bg-white border border-slate-200/70 rounded-3xl p-8 text-center max-w-sm mx-auto shadow-xs">
            <p className="text-xs font-bold text-slate-400">Nessuna opportunità in questa categoria</p>
          </div>
        </div>
      )
    }

    // Se sono 3 o meno, usiamo un layout a blocchi fisso e bilanciato
    if (items.length <= 3) {
      return (
        <div className="flex flex-wrap gap-6 pt-1 pb-4">
          {items.map(pos => (
            <div 
              key={pos.id} 
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[380px]"
            >
              <PosizioneCard posizione={pos} />
            </div>
          ))}
        </div>
      )
    }

    // Se sono 4 o più, attiviamo lo slider orizzontale allineato
    return (
      <div className="flex overflow-x-auto gap-6 pb-6 pt-1 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {items.map(pos => (
          <div 
            key={pos.id} 
            className="w-[85vw] sm:w-[320px] md:w-[350px] snap-start shrink-0"
          >
            <PosizioneCard posizione={pos} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 md:pt-14 pb-28 font-sans">
      
      {/* 1. HEADER DI BENVENUTO */}
      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            {hasAziendale ? 'Volontariato Corporate' : 'Piattaforma Volontari'}
          </p>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Ciao, {nomeUtente}.<br />
          Ecco cosa c'è per te oggi.
        </h1>
      </div>

      {totalPositions === 0 ? (
        /* Empty State */
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto mt-12">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Nessuna opportunità attiva al momento
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le nuove posizioni pubblicate dagli enti appariranno qui automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* 2. TOP MATCH "PER TE" */}
          {sections.consigliate && sections.consigliate.length > 0 && (
            <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      In primo piano per te
                    </h2>
                    <p className="text-xs text-slate-400">
                      I migliori match calcolati in base ai tuoi interessi e abilità
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-400">
                  {sections.consigliate.length} {sections.consigliate.length === 1 ? 'suggerimento' : 'suggerimenti'}
                </span>
              </div>

              <AdaptiveCardRow items={sections.consigliate} />
            </section>
          )}

          {/* 3. BANNER MAPPA TERRITORIALE */}
          <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] group min-h-[180px] flex items-center">
              
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale invert opacity-[0.10] transition-transform duration-1000 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
              
              <div className="relative p-7 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-2.5">
                    <Compass className="w-3 h-3 text-blue-600" />
                    Vista Territorio
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {cittaUtente ? `Cosa succede a ${cittaUtente}?` : 'Trova le attività attorno a te'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualizza le sedi e le associazioni geolocalizzate nella mappa interattiva.
                  </p>
                </div>
                
                <Link 
                  href="/mappa" 
                  className="shrink-0 flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-black active:scale-95 transition-all text-xs tracking-wide shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Esplora Mappa</span>
                </Link>
              </div>
            </div>
          </section>

          {/* 4. ESPLORA CON TAB SWITCHER */}
          <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Altre opportunità
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seleziona una categoria per visualizzare gli annunci disponibili
                </p>
              </div>

              {/* Tab Pills */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('ultime')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'ultime'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ultime novità ({sections.ultime?.length || 0})
                </button>

                {cittaUtente && (
                  <button
                    onClick={() => setActiveTab('vicine')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'vicine'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    A {cittaUtente} ({sections.vicine?.length || 0})
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('una_tantum')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'una_tantum'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Weekend / 1 Giorno ({sections.una_tantum?.length || 0})
                </button>
              </div>
            </div>

            <AdaptiveCardRow items={activeItems} />
          </section>

        </div>
      )}

    </div>
  )
}

export default VolontarioDashboard