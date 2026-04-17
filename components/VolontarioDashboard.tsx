'use client'

import Link from 'next/link'
import PosizioneCard from '@/components/PosizioneCard'

interface Props {
  nomeUtente: string;
  cittaUtente: string | null;
  posizioni: any[];
  userTagIds: string[];
  userCompIds: string[];
}

export function VolontarioDashboard({ nomeUtente, cittaUtente, posizioni, userTagIds, userCompIds }: Props) {
  
  // 🧠 LOGICA DEI MATCH (Stile Netflix)
  const ultimeNovita = posizioni.slice(0, 10)

  const matchPerfetti = posizioni.filter(pos => {
    const hasMatchingComp = pos.competenze?.some((c: any) => userCompIds.includes(c.id))
    const hasMatchingTag = pos.tags?.some((t: any) => userTagIds.includes(t.id))
    return hasMatchingComp || hasMatchingTag
  }).slice(0, 10)

  const eventiSingoli = posizioni.filter(p => p.tipo === 'una_tantum').slice(0, 10)

  // 🚨 SOTTO-COMPONENTE SLIDER FIXATO (Margini indistruttibili)
  const SliderRow = ({ titolo, emoji, items }: { titolo: string, emoji: string, items: any[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 px-6 md:px-10 max-w-7xl mx-auto">
          <span>{emoji}</span> {titolo}
        </h2>
        {/* TOLTO IL PADDING (px-6 px-10) dal contenitore. Aggiunto scroll-pl per lo snap perfetto */}
        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {/* SPACER SINISTRO (Invisibile, forza il browser a creare il margine di 24px/40px) */}
          <div className="w-2 md:w-4 shrink-0"></div>

          {items.map(pos => (
            <div key={pos.id} className="w-[75vw] sm:w-[300px] md:w-[340px] snap-start shrink-0">
              <PosizioneCard posizione={pos} />
            </div>
          ))}
          
          {/* SPACER DESTRO (Evita che l'ultima card sbatta sul bordo destro alla fine dello scroll) */}
          <div className="w-[20px] md:w-[40px] shrink-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 md:pt-12 pb-20">
      
      {/* 1. HEADER DI BENVENUTO */}
      <div className="px-6 md:px-10 max-w-7xl mx-auto mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-blue-600 mb-2">Bentornato</p>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">
          Ciao, {nomeUtente}.<br/>Pronto a fare la differenza?
        </h1>
      </div>

      {/* 2. 🗺️ IL BANNER MAPPA */}
      <div className="px-6 md:px-10 max-w-7xl mx-auto mb-16">
        <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-white border-2 border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.05)] group min-h-[200px] flex items-center">
          
          {/* Sfondo finto mappa grigia chiara */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale invert opacity-[0.15] transition-transform duration-1000 ease-out group-hover:scale-105"></div>
          
          {/* Gradienti per leggibilità */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
          
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 w-full">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                La tua area
              </span>
              <h3 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">
                Esplora le opportunità<br/>{cittaUtente ? `vicino a ${cittaUtente}` : 'nella tua zona'}.
              </h3>
            </div>
            
            <Link 
              href="/esplora" 
              className="shrink-0 flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full font-black hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-700 relative z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Apri la Mappa
            </Link>
          </div>
        </div>
      </div>

      {/* 3. GLI SLIDER TIPO NETFLIX */}
      <div className="w-full max-w-[100vw] overflow-hidden">
        {matchPerfetti.length > 0 && (
          <SliderRow titolo="Match perfetti per te" emoji="🎯" items={matchPerfetti} />
        )}
        
        <SliderRow titolo="Ultime novità" emoji="⚡" items={ultimeNovita} />
        
        <SliderRow titolo="Eventi di un giorno" emoji="⏳" items={eventiSingoli} />
      </div>

    </div>
  )
}