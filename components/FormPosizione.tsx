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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={{ flexShrink: 0 }}>
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
  // --- STATI ---
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

  // --- HELPERS ---
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
    <div className="w-full max-w-3xl mx-auto pb-20 px-4 sm:px-0">
      
      {/* 🪄 MAGIC PARSER UI */}
      <div className="mb-10 relative z-50">
        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-3xl shadow-2xl">
          <div className="flex-1 flex items-start gap-3 px-4 py-2">
            <SparkleIcon className="text-emerald-400 mt-1" />
            <textarea 
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              placeholder="Incolla l'annuncio o chiedi all'AI di compilare..."
              className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none resize-none font-medium text-sm h-6 focus:h-24 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleMagicParse}
            disabled={isAnalyzing || !magicText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl transition-all"
          >
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : "Compila"}
          </button>
        </div>

        {/* Mobile */}
        <div className="sm:hidden">
          {isAiBarExpanded ? (
            <div className="fixed inset-x-4 bottom-24 bg-slate-900 border border-slate-800 p-4 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <SparkleIcon className="w-4 h-4" /> AI Assistant
                </span>
                <button type="button" onClick={() => setIsAiBarExpanded(false)} className="text-slate-400 text-lg">✕</button>
              </div>
              <textarea 
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
                placeholder="Cosa vuoi pubblicare?"
                className="w-full bg-slate-800/50 rounded-xl p-3 text-white text-sm outline-none mb-3 h-32"
              />
              <button
                type="button"
                onClick={handleMagicParse}
                disabled={isAnalyzing || !magicText.trim()}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl"
              >
                {isAnalyzing ? "Elaborazione..." : "Compila ora"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAiBarExpanded(true)}
              className="fixed bottom-6 right-6 bg-slate-900 text-emerald-400 p-4 rounded-full shadow-2xl border border-slate-800 flex items-center gap-3 font-bold"
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
        className="space-y-8 bg-white p-6 sm:p-12 rounded-[3rem] border border-slate-100 shadow-xl"
      >
        <div className="flex p-1.5 bg-slate-100 rounded-2xl">
          {['una_tantum', 'ricorrente'].map((t) => (
            <button 
              key={t} type="button" onClick={() => setTipo(t as any)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${tipo === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              {t === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}
            </button>
          ))}
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        <MediaGalleryPicker mediaIniziali={mediaDisponibili} onSelect={setImmagineId} />
        <input type="hidden" name="immagine_id" value={immagineId || ''} />

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Titolo</label>
            <input name="titolo" value={titolo} onChange={e => setTitolo(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white outline-none font-bold text-slate-800" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Descrizione</label>
            <textarea name="descrizione" value={descrizione} onChange={e => setDescrizione(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl h-32 bg-slate-50 focus:bg-white outline-none font-medium text-slate-700 resize-none" required />
          </div>
        </div>

        <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
          {tipo === 'una_tantum' ? (
            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">Data Evento</label>
              <input type="date" name="data_esatta" value={dataEsatta} onChange={e => setDataEsatta(e.target.value)} className="w-full p-4 rounded-2xl border border-emerald-200 bg-white font-bold outline-none" required={tipo === 'una_tantum'} />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">Giorni Settimana</label>
              <div className="flex justify-between gap-1 sm:gap-2">
                {GIORNI.map(g => (
                  <button key={g.valore} type="button" onClick={() => toggleGiorno(g.valore)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-sm transition-all ${giorniSelezionati.includes(g.valore) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    {g.etichetta}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input type="hidden" name="giorni_settimana" value={JSON.stringify(giorniSelezionati)} />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Orario</label>
            <div className="flex items-center gap-2">
              <input type="time" name="ora_inizio" value={oraInizio} onChange={e => setOraInizio(e.target.value)} className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" required />
              <input type="time" name="ora_fine" value={oraFine} onChange={e => setOraFine(e.target.value)} className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Luogo</label>
            <input ref={inputRef} name="dove" value={dove} onChange={e => setDove(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" required />
            {coordinate && <><input type="hidden" name="lat" value={coordinate.lat} /><input type="hidden" name="lng" value={coordinate.lng} /></>}
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-100">
          <div className="space-y-5">
            {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([cat, tags]: any) => (
              <div key={cat} className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{cat}</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t: any) => (
                    <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`transition-all rounded-xl ${tagSelezionati.includes(t.id) ? 'ring-2 ring-slate-900 scale-105 shadow-md' : 'opacity-60'}`}>
                      <TagBadge nome={t.name} categoria={t.categoria} size="md" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <input type="hidden" name="tags" value={JSON.stringify(tagSelezionati)} />

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Competenze</label>
            <CompetenzaSelector key={compKey} allCompetenze={competenzeDisponibili} competenzeIniziali={competenzeState} onChange={setCompetenzeState} />
            <input type="hidden" name="competenze" value={JSON.stringify(competenzeState)} />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-[2rem] font-black text-xl text-white transition-all ${isSubmitting ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700 shadow-xl'}`}>
          {isSubmitting ? "Salvataggio..." : (posizione ? 'AGGIORNA' : 'PUBLICA')}
        </button>
      </form>
    </div>
  )
}