'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams, usePathname } from 'next/navigation' // 🚨 Aggiunto usePathname

const TAGS_DISPONIBILI = ["Ambiente", "Sociale", "Animali", "Sport", "Cultura", "Sanità", "Educazione", "Emergenza"];
const COMPETENZE_DISPONIBILI = ["Patente B", "Forza Fisica", "Ascolto Attivo", "Informatica", "Lingue", "Fotografia", "Primo Soccorso"];
const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export default function SearchPill() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname() // 🚨 Serve per forzare il refresh corretto dell'URL

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
    
    // 🌍 GEOCODING FIXATO (Senza Header che bloccano il browser)
    if (tempIndirizzo) {
      if (!searchParams.get('lat') || tempIndirizzo !== indirizzo) {
        try {
          console.log("Cerco coordinate per:", tempIndirizzo);
          
          // 🚨 Rimosso l'header custom e usato countrycodes=it per massima precisione
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tempIndirizzo)}&countrycodes=it&format=json&limit=1`)
          const responseData = await res.json()
          
          if (responseData && responseData.length > 0) {
            console.log("Città trovata!", responseData[0].lat, responseData[0].lon);
            params.set('lat', responseData[0].lat)
            params.set('lng', responseData[0].lon)
          } else {
            console.warn("Città non trovata da Nominatim.");
          }
        } catch (error) {
          console.error("Errore Geocoding Nominatim:", error)
        }
      }
    } else {
      params.delete('lat')
      params.delete('lng')
    }

    // Salvataggio di tutti gli altri parametri
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

    // 🚨 Usiamo pathname per assicurarci che Next.js inietti l'URL nel posto giusto
    router.push(`${pathname}?${params.toString()}`)
    setIsGeocoding(false)
    setIsSearchOpen(false)
  }

  const handlePulisciTutto = () => {
    setTempSearch(''); setTempIndirizzo(''); setTempTipo(''); setTempData('');
    setTempGiorni([]); setTempTags([]); setTempCompetenze([]);
  }

  const labelDove = indirizzo || 'Ovunque'
  let labelQuando = 'Qualsiasi data';
  if (tipo === 'una_tantum') labelQuando = data ? new Date(data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'Singolo';
  else if (tipo === 'ricorrente') labelQuando = giorni.length > 0 ? `${giorni.length} Giorni` : 'Ricorrente';
  
  let labelCosa = q || 'Esplora tutto';
  if (!q && tags.length > 0) labelCosa = `${tags.length} Settori`;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
      <div className="absolute inset-0 hidden sm:block" onClick={() => setIsSearchOpen(false)}></div>

      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-[700px] sm:rounded-[2rem] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-top-8 duration-300">
        
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <button onClick={() => setIsSearchOpen(false)} className="p-2 -ml-2 rounded-full text-slate-900 hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h2 className="text-base font-bold text-slate-900">Ricerca avanzata</h2>
          <div className="w-9"></div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-grow flex flex-col gap-10">
          
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              <h3 className="text-lg font-semibold">Dove e Cosa</h3>
            </div>
            <div className="flex flex-col gap-4">
              <input 
                type="text" value={tempIndirizzo} onChange={(e) => setTempIndirizzo(e.target.value)}
                placeholder="Città, Quartiere o CAP..."
                className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
              />
              <input 
                type="text" value={tempSearch} onChange={(e) => setTempSearch(e.target.value)}
                placeholder="Parola chiave (es. Assistenza, Verde...)"
                className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
              />
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              <h3 className="text-lg font-semibold">Quando hai tempo?</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setTempTipo('una_tantum')} className={`p-4 rounded-xl border text-left transition-all ${tempTipo === 'una_tantum' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}>
                <p className="font-semibold text-slate-900 mb-1">Evento Singolo</p>
                <p className="text-xs text-slate-500">Un giorno specifico</p>
              </button>
              <button onClick={() => setTempTipo('ricorrente')} className={`p-4 rounded-xl border text-left transition-all ${tempTipo === 'ricorrente' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}>
                <p className="font-semibold text-slate-900 mb-1">Ricorrente</p>
                <p className="text-xs text-slate-500">Impegno continuo</p>
              </button>
            </div>

            {tempTipo === 'una_tantum' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <input 
                  type="date" value={tempData} onChange={(e) => setTempData(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-4 py-3 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
                />
              </div>
            )}
            {tempTipo === 'ricorrente' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-slate-500 mb-3">Seleziona i giorni della settimana:</p>
                <div className="flex flex-wrap gap-2">
                  {GIORNI_SETTIMANA.map(g => (
                    <button 
                      key={g} onClick={() => toggleArrayItem(g, tempGiorni, setTempGiorni)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${tempGiorni.includes(g) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr className="border-slate-100" />

          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
              <h3 className="text-lg font-semibold">Settori e Competenze</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-3">Aree di intervento:</p>
              <div className="flex flex-wrap gap-2">
                {TAGS_DISPONIBILI.map(t => (
                  <button 
                    key={t} onClick={() => toggleArrayItem(t, tempTags, setTempTags)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${tempTags.includes(t) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-3">Le tue competenze speciali:</p>
              <div className="flex flex-wrap gap-2">
                {COMPETENZE_DISPONIBILI.map(c => (
                  <button 
                    key={c} onClick={() => toggleArrayItem(c, tempCompetenze, setTempCompetenze)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${tempCompetenze.includes(c) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <button onClick={handlePulisciTutto} className="text-base font-semibold text-slate-900 underline hover:text-slate-600 transition-colors px-2">
            Pulisci tutto
          </button>
          <button 
            onClick={handleApplicaRicerca} 
            disabled={isGeocoding}
            className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-black active:scale-95 transition-all text-base disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
          >
            {isGeocoding ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Cerco...
              </>
            ) : (
              'Mostra attività'
            )}
          </button>
        </div>

      </div>
    </div>
  )

  return (
    <>
      <button 
        onClick={() => setIsSearchOpen(true)}
        className="w-full bg-white rounded-full shadow-[0_8px_28px_rgba(0,0,0,0.12)] border border-slate-200 pl-6 pr-3 py-3 flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 w-full">
            <span className="truncate">{labelDove}</span>
            <span className="text-slate-300 flex-shrink-0">•</span>
            <span className="truncate">{labelQuando}</span>
          </span>
          <span className="text-sm font-medium text-slate-500 truncate w-full text-left mt-0.5">
            {labelCosa}
          </span>
        </div>
        <div className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center text-white flex-shrink-0 ml-3 shadow-md hover:bg-black transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
        </div>
      </button>

      {mounted && isSearchOpen && createPortal(modalContent, document.body)}
    </>
  )
}