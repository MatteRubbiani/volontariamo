// src/components/FormPosizione.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import TagBadge from '@/components/TagBadge'
import CompetenzaSelector from './CompetenzaSelector'
import MediaGalleryPicker from '@/components/MediaGalleryPicker'
import { analizzaTestoPosizione } from '@/app/ai-actions'

const GIORNI = [
  { etichetta: 'L', valore: 'Lunedì' },
  { etichetta: 'M', valore: 'Martedì' },
  { etichetta: 'M', valore: 'Mercoledì' },
  { etichetta: 'G', valore: 'Giovedì' },
  { etichetta: 'V', valore: 'Venerdì' },
  { etichetta: 'S', valore: 'Sabato' },
  { etichetta: 'D', valore: 'Domenica' }
]

const SparkleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
)

export default function FormPosizione({ 
  posizione, 
  tagsDisponibili = [], 
  tagsSelezionati: tagsIniziali = [],
  competenzeDisponibili = [],           
  competenzeSelezionate = [],
  mediaDisponibili = [],         
  salvaAction 
}: { 
  posizione?: any
  tagsDisponibili?: any[]
  tagsSelezionati?: string[]
  competenzeDisponibili?: any[]         
  competenzeSelezionate?: string[]
  mediaDisponibili?: any[]
  salvaAction: (formData: FormData) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [immagineId, setImmagineId] = useState<string | null>(posizione?.immagine_id || null)
  const [tipo, setTipo] = useState<'una_tantum' | 'ricorrente'>(posizione?.tipo || 'una_tantum')
  const [titolo, setTitolo] = useState(posizione?.titolo || '')
  const [descrizione, setDescrizione] = useState(posizione?.descrizione || '')
  const [dataEsatta, setDataEsatta] = useState(posizione?.data_esatta || '')
  const [giorniSelezionati, setGiorniSelezionati] = useState<string[]>(posizione?.giorni_settimana || [])
  const [oraInizio, setOraInizio] = useState(posizione?.ora_inizio?.substring(0,5) || '')
  const [oraFine, setOraFine] = useState(posizione?.ora_fine?.substring(0,5) || '')
  const [dove, setDove] = useState(posizione?.dove || '')
  const [coordinate, setCoordinate] = useState<{lat: number, lng: number} | null>(
    posizione?.lat && posizione?.lng ? { lat: posizione.lat, lng: posizione.lng } : null
  )
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)
  const [competenzeState, setCompetenzeState] = useState<string[]>(competenzeSelezionate)
  const [compKey, setCompKey] = useState(0)
  const [magicText, setMagicText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAiBarExpanded, setIsAiBarExpanded] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const tagsRaggruppati = tagsDisponibili?.reduce((acc: any, tag: any) => {
    const cat = tag.categoria || 'Altro'; acc[cat] = acc[cat] || []; acc[cat].push(tag); return acc
  }, {})

  const toggleGiorno = (val: string) => {
    setGiorniSelezionati(prev => prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val])
  }

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const findCoordinatesWithPlacesAPI = (addressQuery: string) => {
    const google = (window as any).google
    if (google?.maps?.places) {
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      service.findPlaceFromQuery({ query: addressQuery, fields: ['formatted_address', 'geometry'] }, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          const loc = results[0].geometry.location
          setCoordinate({ lat: loc.lat(), lng: loc.lng() })
          if (results[0].formatted_address) setDove(results[0].formatted_address)
        }
      })
    }
  }

  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google
      if (google && inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'], componentRestrictions: { country: 'it' }, fields: ['formatted_address', 'geometry'] 
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place?.formatted_address) {
            setDove(place.formatted_address)
            if (place.geometry?.location) setCoordinate({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
          }
        })
      }
    }
    if ((window as any).google) initAutocomplete(); else {
      const check = setInterval(() => { if ((window as any).google) { initAutocomplete(); clearInterval(check) } }, 500)
      return () => clearInterval(check)
    }
  }, [])

  const handleMagicParse = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analizzaTestoPosizione(magicText, tagsDisponibili, competenzeDisponibili)
      if (result.success && result.data) {
        const d = result.data
        if (d.titolo) setTitolo(d.titolo)
        if (d.descrizione) setDescrizione(d.descrizione)
        if (d.giorni_settimana?.length > 0) { setTipo('ricorrente'); setGiorniSelezionati(d.giorni_settimana) }
        else if (d.tipo) setTipo(d.tipo)
        if (d.data_esatta) setDataEsatta(d.data_esatta)
        if (d.ora_inizio) setOraInizio(d.ora_inizio)
        if (d.ora_fine) setOraFine(d.ora_fine)
        if (d.dove) { setDove(d.dove); findCoordinatesWithPlacesAPI(d.dove) }
        if (Array.isArray(d.tags)) setTagSelezionati(d.tags)
        if (Array.isArray(d.competenze)) { setCompetenzeState(d.competenze); setCompKey(p => p + 1) }
        setMagicText(''); setIsAiBarExpanded(false)
      } else alert(result.error)
    } finally { setIsAnalyzing(false) }
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-2 sm:px-0">
      
      {/* 🪄 MAGIC PARSER UI */}
      <div className="mb-10 relative z-50">
        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl">
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <SparkleIcon className="text-emerald-400" />
            <textarea 
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              placeholder="Incolla l'annuncio o chiedi all'AI di precompilare..."
              className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none resize-none font-medium text-sm h-5 focus:h-20 transition-all leading-relaxed"
            />
          </div>
          <button
            type="button"
            onClick={handleMagicParse}
            disabled={isAnalyzing || !magicText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm self-end"
          >
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : "Compila"}
          </button>
        </div>

        {/* Mobile */}
        <div className="sm:hidden">
          {isAiBarExpanded ? (
            <div className="fixed inset-x-4 bottom-24 bg-slate-900 border border-slate-800 p-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <SparkleIcon className="w-4 h-4" /> AI Assistant
                </span>
                <button type="button" onClick={() => setIsAiBarExpanded(false)} className="text-slate-400 hover:text-white text-base font-bold">✕</button>
              </div>
              <textarea 
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
                placeholder="Incolla qui il testo della ricerca..."
                className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-white text-sm outline-none mb-3 h-28 resize-none focus:border-slate-700 transition-colors"
              />
              <button
                type="button"
                onClick={handleMagicParse}
                disabled={isAnalyzing || !magicText.trim()}
                className="w-full bg-emerald-600 active:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? "Elaborazione in corso..." : "Compila scheda"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAiBarExpanded(true)}
              className="fixed bottom-6 right-6 bg-slate-900 text-emerald-400 px-5 py-3.5 rounded-full shadow-2xl border border-slate-800 flex items-center gap-2.5 font-bold text-sm tracking-wide active:scale-95 transition-all"
            >
              <SparkleIcon /> <span>AI Compila</span>
            </button>
          )}
        </div>
      </div>

      <form 
        action={async (fd) => {
          setIsSubmitting(true)
          try { await salvaAction(fd); window.location.assign('/app/associazione') } 
          catch (e) { console.error(e); setIsSubmitting(false) }
        }} 
        className="space-y-8 bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-sm"
      >
        {/* 1. SELETTORE TIPO DI RICERCA */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          {['una_tantum', 'ricorrente'].map((t) => (
            <button 
              key={t} type="button" onClick={() => setTipo(t as any)}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${tipo === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'una_tantum' ? 'Evento Singolo' : 'Attività Ricorrente'}
            </button>
          ))}
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        {/* 2. MEDIA GALLERY PICKER */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Immagine di Copertina</label>
          <MediaGalleryPicker mediaIniziali={mediaDisponibili} onSelect={setImmagineId} />
          <input type="hidden" name="immagine_id" value={immagineId || ''} />
        </div>

        {/* 3. TITOLO E DESCRIZIONE */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Titolo Annuncio</label>
            <input 
              name="titolo" 
              value={titolo} 
              onChange={e => setTitolo(e.target.value)} 
              placeholder="es. Supporto Scolastico Pomeridiano"
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none font-bold text-base sm:text-lg text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-medium" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Descrizione Attività</label>
            <textarea 
              name="descrizione" 
              value={descrizione} 
              onChange={e => setDescrizione(e.target.value)} 
              placeholder="Descrivi i compiti, il clima e l'impatto che i volontari avranno..."
              className="w-full p-4 border border-slate-200 rounded-xl h-32 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none font-normal text-sm sm:text-base text-slate-700 resize-none transition-all placeholder:text-slate-400" 
              required 
            />
          </div>
        </div>

        {/* 4. SEZIONE TEMPORALE (HIGHLIGHT UX) */}
        <div className="p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200/60">
          {tipo === 'una_tantum' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                Data Specifica
              </label>
              <input 
                type="date" 
                name="data_esatta" 
                value={dataEsatta} 
                onChange={e => setDataEsatta(e.target.value)} 
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:border-slate-400 transition-all text-sm" 
                required={tipo === 'una_tantum'} 
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                Giorni di Impegno
              </label>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {GIORNI.map(g => {
                  const isSelected = giorniSelezionati.includes(g.valore)
                  return (
                    <button 
                      key={g.valore} 
                      type="button" 
                      onClick={() => toggleGiorno(g.valore)}
                      className={`h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center ${isSelected ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                    >
                      {g.etichetta}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <input type="hidden" name="giorni_settimana" value={JSON.stringify(giorniSelezionati)} />
        </div>

        {/* 5. GRIGLIA LUOGO E ORARI */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Fascia Oraria</label>
            <div className="flex items-center gap-2">
              <input type="time" name="ora_inizio" value={oraInizio} onChange={e => setOraInizio(e.target.value)} className="flex-1 p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all" required />
              <span className="text-slate-300 font-bold">-</span>
              <input type="time" name="ora_fine" value={oraFine} onChange={e => setOraFine(e.target.value)} className="flex-1 p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Indirizzo Sede</label>
            <input ref={inputRef} name="dove" value={dove} onChange={e => setDove(e.target.value)} placeholder="Cerca via o città..." className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-400 placeholder:font-normal" required />
            {coordinate && <><input type="hidden" name="lat" value={coordinate.lat} /><input type="hidden" name="lng" value={coordinate.lng} /></>}
          </div>
        </div>

        {/* 6. CATEGORIE E COMPETENZE */}
        <div className="space-y-7 pt-6 border-t border-slate-100">
          <div className="space-y-4">
            {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([cat, tags]: any) => (
              <div key={cat} className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">{cat}</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t: any) => (
                    <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`transition-all rounded-lg ${tagSelezionati.includes(t.id) ? 'ring-2 ring-slate-900 scale-[1.02] shadow-xs' : 'opacity-60 hover:opacity-100'}`}>
                      <TagBadge nome={t.name} categoria={t.categoria} size="md" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <input type="hidden" name="tags" value={JSON.stringify(tagSelezionati)} />

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-1">Competenze Aggiuntive</label>
            <CompetenzaSelector key={compKey} allCompetenze={competenzeDisponibili} competenzeIniziali={competenzeState} onChange={setCompetenzeState} />
            <input type="hidden" name="competenze" value={JSON.stringify(competenzeState)} />
          </div>
        </div>

        {/* SUBMIT BUTTON PREMIUM CTA */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`w-full py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-200 shadow-md ${isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10 active:scale-[0.99]'}`}
        >
          {isSubmitting ? "Salvataggio in corso..." : (posizione ? 'Aggiorna annuncio' : 'Pubblica annuncio')}
        </button>
      </form>
    </div>
  )
}