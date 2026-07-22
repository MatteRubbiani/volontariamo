'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, MapPin, Calendar, Tag, Sparkles, X, Check, RotateCcw } from 'lucide-react'

const TAGS_DISPONIBILI = ["Ambiente", "Sociale", "Animali", "Sport", "Cultura", "Sanità", "Educazione", "Emergenza"];
const COMPETENZE_DISPONIBILI = ["Patente B", "Forza Fisica", "Ascolto Attivo", "Informatica", "Lingue", "Fotografia", "Primo Soccorso"];
const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function SearchPill() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const q = searchParams.get('q') || ''
  const tipo = searchParams.get('tipo') || ''
  const indirizzo = searchParams.get('indirizzo') || ''
  const data = searchParams.get('data') || ''
  const giorni = searchParams.get('giorni')?.split(',').filter(Boolean) || []
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const competenze = searchParams.get('competenze')?.split(',').filter(Boolean) || []

  const [tempSearch, setTempSearch] = useState(q)
  const [tempIndirizzo, setTempIndirizzo] = useState(indirizzo)
  const [tempTipo, setTempTipo] = useState(tipo)
  const [tempData, setTempData] = useState(data)
  const [tempGiorni, setTempGiorni] = useState<string[]>(giorni)
  const [tempTags, setTempTags] = useState<string[]>(tags)
  const [tempCompetenze, setTempCompetenze] = useState<string[]>(competenze)

  // Sincronizza lo stato quando il modal si apre
  useEffect(() => {
    if (isSearchOpen) {
      setTempSearch(q)
      setTempIndirizzo(indirizzo)
      setTempTipo(tipo)
      setTempData(data)
      setTempGiorni(giorni)
      setTempTags(tags)
      setTempCompetenze(competenze)
    }
  }, [isSearchOpen])

  const toggleArrayItem = (item: string, stateArray: string[], setStateFunction: any) => {
    if (stateArray.includes(item)) {
      setStateFunction(stateArray.filter(i => i !== item));
    } else {
      setStateFunction([...stateArray, item]);
    }
  }

  const handleApplicaRicerca = async () => {
    setIsGeocoding(true)
    const params = new URLSearchParams(searchParams.toString())
    
    // GEOCODING NOMINATIM
    if (tempIndirizzo) {
      if (!searchParams.get('lat') || tempIndirizzo !== indirizzo) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tempIndirizzo)}&countrycodes=it&format=json&limit=1`)
          const responseData = await res.json()
          
          if (responseData && responseData.length > 0) {
            params.set('lat', responseData[0].lat)
            params.set('lng', responseData[0].lon)
          }
        } catch (error) {
          console.error("Errore Geocoding Nominatim:", error)
        }
      }
    } else {
      params.delete('lat')
      params.delete('lng')
    }

    if (tempSearch) params.set('q', tempSearch); else params.delete('q');
    if (tempIndirizzo) params.set('indirizzo', tempIndirizzo); else params.delete('indirizzo');
    
    if (tempTipo) {
      params.set('tipo', tempTipo);
      if (tempTipo === 'una_tantum' && tempData) {
        params.set('data', tempData);
        params.delete('giorni');
      } else if (tempTipo === 'ricorrente' && tempGiorni.length > 0) {
        params.set('giorni', tempGiorni.join(','));
        params.delete('data');
      } else {
        params.delete('data');
        params.delete('giorni');
      }
    } else {
      params.delete('tipo'); params.delete('data'); params.delete('giorni');
    }

    if (tempTags.length > 0) params.set('tags', tempTags.join(',')); else params.delete('tags');
    if (tempCompetenze.length > 0) params.set('competenze', tempCompetenze.join(',')); else params.delete('competenze');

    router.push(`${pathname}?${params.toString()}`)
    setIsGeocoding(false)
    setIsSearchOpen(false)
  }

  const handlePulisciTutto = () => {
    setTempSearch(''); setTempIndirizzo(''); setTempTipo(''); setTempData('');
    setTempGiorni([]); setTempTags([]); setTempCompetenze([]);
  }

  // CALCOLO ETICHETTE VISIVE PER LA PILLOLA
  const labelDove = indirizzo || 'Ovunque'
  let labelQuando = 'Qualsiasi data';
  if (tipo === 'una_tantum') labelQuando = data ? new Date(data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'Singolo';
  else if (tipo === 'ricorrente') labelQuando = giorni.length > 0 ? `${giorni.length} Giorni` : 'Ricorrente';
  
  let labelCosa = q || 'Esplora tutto';
  if (!q && tags.length > 0) labelCosa = `${tags.length} Settori`;

  // Contatore filtri attivi
  const numFiltriAttivi = (tipo ? 1 : 0) + (indirizzo ? 1 : 0) + (q ? 1 : 0) + tags.length + competenze.length + (data ? 1 : 0) + (giorni.length > 0 ? 1 : 0);

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex flex-col justify-end sm:justify-center items-center bg-slate-950/60 backdrop-blur-md transition-all animate-in fade-in duration-200">
      
      {/* Sfondo cliccabile per chiudere su desktop */}
      <div className="absolute inset-0 hidden sm:block" onClick={() => setIsSearchOpen(false)} />

      {/* MODAL CONTAINER */}
      <div className="bg-white w-full h-[92dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-[620px] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] flex flex-col relative z-10 overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-full duration-300">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
          <button 
            type="button"
            onClick={() => setIsSearchOpen(false)} 
            className="p-2 -ml-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">Filtri e Ricerca</span>
          <button 
            type="button"
            onClick={handlePulisciTutto}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Azzera</span>
          </button>
        </div>

        {/* CORPO MODAL SCROLLABILE */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-8 divide-y divide-slate-100">
          
          {/* SEZIONE 1: DOVE E COSA */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Dove & Cosa cerchi?</h3>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={tempIndirizzo} 
                  onChange={(e) => setTempIndirizzo(e.target.value)}
                  placeholder="Città, CAP o Zona (es. Modena)"
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-semibold rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={tempSearch} 
                  onChange={(e) => setTempSearch(e.target.value)}
                  placeholder="Parola chiave (es. Doposcuola, Mense...)"
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-semibold rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          </section>

          {/* SEZIONE 2: QUANDO (SEGMENTED CONTROL PREMIUM) */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Calendar className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Disponibilità temporale</h3>
            </div>
            
            {/* SEGMENTED CONTROL AIRBNB STYLE */}
            <div className="grid grid-cols-3 p-1 bg-slate-100/80 rounded-2xl gap-1">
              <button 
                type="button"
                onClick={() => setTempTipo('')} 
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tempTipo === '' 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Qualsiasi
              </button>
              <button 
                type="button"
                onClick={() => setTempTipo('una_tantum')} 
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tempTipo === 'una_tantum' 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Evento Singolo
              </button>
              <button 
                type="button"
                onClick={() => setTempTipo('ricorrente')} 
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tempTipo === 'ricorrente' 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Ricorrente
              </button>
            </div>

            {/* SOTTO-OPZIONI DINAMICHE */}
            {tempTipo === 'una_tantum' && (
              <div className="animate-in fade-in slide-in-from-top-2 pt-1">
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Scegli la data dell'evento:</label>
                <input 
                  type="date" 
                  value={tempData} 
                  onChange={(e) => setTempData(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-semibold rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
            )}

            {tempTipo === 'ricorrente' && (
              <div className="animate-in fade-in slide-in-from-top-2 pt-1 space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Giorni preferiti della settimana:</label>
                <div className="flex flex-wrap gap-2">
                  {GIORNI_SETTIMANA.map(g => {
                    const isSelected = tempGiorni.includes(g);
                    return (
                      <button 
                        key={g} 
                        type="button"
                        onClick={() => toggleArrayItem(g, tempGiorni, setTempGiorni)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 border ${
                          isSelected 
                            ? 'bg-slate-950 text-white border-slate-950 shadow-xs' 
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* SEZIONE 3: SETTORI */}
          <section className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Tag className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Settori di intervento</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {TAGS_DISPONIBILI.map(t => {
                const isSelected = tempTags.includes(t);
                return (
                  <button 
                    key={t} 
                    type="button"
                    onClick={() => toggleArrayItem(t, tempTags, setTempTags)}
                    className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 border ${
                      isSelected 
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                    <span>{t}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* SEZIONE 4: COMPETENZE */}
          <section className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Le tue competenze</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {COMPETENZE_DISPONIBILI.map(c => {
                const isSelected = tempCompetenze.includes(c);
                return (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => toggleArrayItem(c, tempCompetenze, setTempCompetenze)}
                    className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 border ${
                      isSelected 
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                    <span>{c}</span>
                  </button>
                )
              })}
            </div>
          </section>

        </div>

        {/* 🟢 FOOTER MODAL: SAFE PADDING ED ELEVATO PER SOSPENDERSI SOPRA LA NAVBAR */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-5">
          <button 
            type="button"
            onClick={handlePulisciTutto} 
            className="text-xs font-extrabold text-slate-500 hover:text-slate-950 underline underline-offset-4 transition-colors px-2"
          >
            Pulisci tutto
          </button>
          
          <button 
            type="button"
            onClick={handleApplicaRicerca} 
            disabled={isGeocoding}
            className="bg-slate-950 text-white font-extrabold py-3.5 px-7 rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all text-xs disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
          >
            {isGeocoding ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Aggiorno la mappa...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-violet-400" />
                <span>Mostra risultati</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )

  return (
    <>
      {/* 🔴 BARRA / PILLOLA DI RICERCA CHIUSA STILE AIRBNB */}
      <button 
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className="w-full bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/80 pl-5 pr-2 py-2.5 flex items-center justify-between hover:border-slate-300 active:scale-[0.98] transition-all group"
      >
        <div className="flex flex-col items-start min-w-0 flex-1">
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-xs font-extrabold text-slate-900 truncate">{labelDove}</span>
            <span className="text-slate-300 shrink-0">•</span>
            <span className="text-xs font-bold text-slate-500 truncate">{labelQuando}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 truncate w-full text-left mt-0.5">
            {labelCosa}
          </span>
        </div>

        <div className="relative flex items-center shrink-0 ml-3">
          {numFiltriAttivi > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {numFiltriAttivi}
            </span>
          )}
          <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center text-white shadow-md group-hover:bg-black transition-colors">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </button>

      {mounted && isSearchOpen && createPortal(modalContent, document.body)}
    </>
  )
}