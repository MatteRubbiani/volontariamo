'use client'

import { useState, useEffect, useRef } from 'react'
import { getTagColor } from '@/lib/tagColors'
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
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
  const [coordinate, setCoordinate] = useState<{lat: number, lng: number} | null>(null)
  
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)
  const [competenzeState, setCompetenzeState] = useState<string[]>(competenzeSelezionate)
  const [compKey, setCompKey] = useState(0)
  
  const [magicText, setMagicText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google
      if (google && inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'it' },
          fields: ['formatted_address', 'geometry'] 
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place && place.formatted_address && inputRef.current) {
            setDove(place.formatted_address)
            if (place.geometry && place.geometry.location) {
              setCoordinate({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              })
            }
          }
        })
      }
    }

    if ((window as any).google) {
      initAutocomplete()
    } else {
      const checkGoogle = setInterval(() => {
        if ((window as any).google) {
          initAutocomplete()
          clearInterval(checkGoogle)
        }
      }, 500)
      return () => clearInterval(checkGoogle)
    }
  }, [])

  const toggleGiorno = (val: string) => {
    setGiorniSelezionati(prev => prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val])
  }

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleMagicParse = async () => {
    setIsAnalyzing(true)
    const result = await analizzaTestoPosizione(magicText, tagsDisponibili, competenzeDisponibili)
    
    if (result.success && result.data) {
      const d = result.data
      if (d.titolo) setTitolo(d.titolo)
      if (d.descrizione) setDescrizione(d.descrizione)
      if (d.tipo) setTipo(d.tipo)
      if (d.data_esatta) setDataEsatta(d.data_esatta)
      if (d.giorni_settimana && Array.isArray(d.giorni_settimana)) setGiorniSelezionati(d.giorni_settimana)
      if (d.ora_inizio) setOraInizio(d.ora_inizio)
      if (d.ora_fine) setOraFine(d.ora_fine)
      if (d.dove) setDove(d.dove)
      if (d.tags && Array.isArray(d.tags)) setTagSelezionati(d.tags)
      if (d.competenze && Array.isArray(d.competenze)) {
        setCompetenzeState(d.competenze)
        setCompKey(prev => prev + 1) 
      }
      setMagicText('')
    } else {
      alert(result.error)
    }
    setIsAnalyzing(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      
      {/* 🪄 MAGIC PARSER UI - PRO COMMAND BAR */}
      <div className="mb-8 relative group z-10">
        {/* Glow effect on focus */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-xl transition-all duration-300 group-focus-within:bg-emerald-500/25" />
        
        <div className="relative bg-slate-900 border border-slate-800 p-2 sm:p-2.5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col sm:flex-row items-center gap-2 transition-all">
          <div className="flex-1 w-full flex items-start gap-3 px-3 sm:px-4 py-2">
            <div className="mt-0.5 text-emerald-400 shrink-0">
              <SparkleIcon className="w-5 h-5" />
            </div>
            <textarea 
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              placeholder="Chiedi all'AI di compilare il form per te..."
              className="w-full bg-transparent text-white placeholder:text-slate-400 outline-none resize-none font-medium text-sm sm:text-base min-h-[24px] h-[24px] focus:min-h-[80px] transition-all overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMagicParse()
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleMagicParse}
            disabled={isAnalyzing || !magicText.trim()}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold px-6 py-3 sm:py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            {isAnalyzing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              "Compila"
            )}
          </button>
        </div>
      </div>

      <form 
        action={async (fd) => {
          setIsSubmitting(true)
          try {
            await salvaAction(fd)
            window.location.assign('/app/associazione')
          } catch (error) {
            console.error("Errore salvataggio:", error)
            window.location.assign('/app/associazione')
          }
        }} 
        className="space-y-8 bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      >
        
        {/* 1. SELETTORE TIPO */}
        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl">
          <button 
            type="button"
            onClick={() => setTipo('una_tantum')}
            className={`flex-1 py-3.5 rounded-[14px] text-sm font-bold transition-all duration-300 ${tipo === 'una_tantum' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Evento Singolo
          </button>
          <button 
            type="button"
            onClick={() => setTipo('ricorrente')}
            className={`flex-1 py-3.5 rounded-[14px] text-sm font-bold transition-all duration-300 ${tipo === 'ricorrente' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ricorrente
          </button>
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        {/* 2. IMMAGINE DI COPERTINA */}
        <div className="pt-2 pb-4 border-b border-slate-100">
          <MediaGalleryPicker 
            mediaIniziali={mediaDisponibili} 
            onSelect={(id) => setImmagineId(id)} 
          />
          <input type="hidden" name="immagine_id" value={immagineId || ''} />
        </div>

        {/* 3. TITOLO E DESCRIZIONE */}
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Titolo Posizione</label>
            <input 
              name="titolo" 
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="es: Aiuto Mensa Sociale" 
              className="w-full p-4 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white outline-none font-bold text-lg transition-all" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Descrizione</label>
            <textarea 
              name="descrizione" 
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Cosa faranno i volontari?" 
              className="w-full p-4 border border-slate-200 rounded-2xl h-32 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white outline-none font-medium transition-all resize-none text-slate-700" 
              required 
            />
          </div>
        </div>

        {/* 4. LOGICA TEMPORALE */}
        <div className="p-6 sm:p-8 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50 transition-all">
          {tipo === 'una_tantum' ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                Data dell'evento
              </label>
              <input 
                type="date" 
                name="data_esatta" 
                value={dataEsatta}
                onChange={(e) => setDataEsatta(e.target.value)}
                className="w-full p-4 rounded-2xl border border-emerald-200 bg-white focus:ring-4 focus:ring-emerald-500/10 text-slate-800 font-bold outline-none transition-all" 
                required={tipo === 'una_tantum'} 
              />
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Giorni della settimana
              </label>
              <div className="flex justify-between gap-1 sm:gap-2">
                {GIORNI.map(g => (
                  <button key={g.valore} type="button" onClick={() => toggleGiorno(g.valore)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full font-black text-sm sm:text-base md:text-lg transition-all ${giorniSelezionati.includes(g.valore) ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-offset-2 ring-emerald-600' : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'}`}>
                    {g.etichetta}
                  </button>
                ))}
              </div>
              {giorniSelezionati.map(g => <input key={g} type="hidden" name="giorni_settimana" value={g} />)}
            </div>
          )}
        </div>

        {/* 5. ORARI E LUOGO */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Orario (Inizio - Fine)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="time" 
                name="ora_inizio" 
                value={oraInizio}
                onChange={(e) => setOraInizio(e.target.value)}
                className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700" 
                required 
              />
              <span className="text-slate-300 font-bold">-</span>
              <input 
                type="time" 
                name="ora_fine" 
                value={oraFine}
                onChange={(e) => setOraFine(e.target.value)}
                className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700" 
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              Indirizzo Esatto
            </label>
            <input 
              ref={inputRef} 
              name="dove" 
              value={dove}
              onChange={(e) => setDove(e.target.value)}
              placeholder="Cerca via o città..." 
              className="w-full p-4 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white outline-none font-bold text-slate-700 transition-all" 
              required autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            {coordinate && (
              <>
                <input type="hidden" name="lat" value={coordinate.lat} />
                <input type="hidden" name="lng" value={coordinate.lng} />
              </>
            )}
          </div>
        </div>

        {/* 6. TAGS */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block pl-2">
            Ambiti dell'annuncio
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {tagsDisponibili.map(t => {
              const isSelected = tagSelezionati.includes(t.id);
              const activeColorClass = getTagColor(t.name);
              
              return (
                <button 
                  key={t.id} 
                  type="button" 
                  onClick={() => toggleTag(t.id)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all duration-300 block ${
                    isSelected 
                      ? `${activeColorClass} shadow-md scale-[1.02] border-transparent` 
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  #{t.name}
                </button>
              )
            })}
          </div>
          {tagSelezionati.map(tId => (
            <input key={tId} type="hidden" name="tags" value={tId} />
          ))}
        </div>

        {/* 7. COMPETENZE RICHIESTE */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block pl-2">
            Competenze Richieste (Opzionale)
          </label>
          <CompetenzaSelector 
            key={compKey}
            allCompetenze={competenzeDisponibili} 
            competenzeIniziali={competenzeState} 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full text-white font-black py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] transition-all text-lg sm:text-xl mt-4 sm:mt-8 flex items-center justify-center gap-3 ${
            isSubmitting 
              ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_8px_20px_rgba(16,185,129,0.25)] active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-6 h-6 border-4 border-slate-500 border-t-transparent animate-spin rounded-full" />
              Salvataggio in corso...
            </>
          ) : (
            posizione ? 'AGGIORNA ANNUNCIO' : 'PUBBLICA ANNUNCIO'
          )}
        </button>

      </form>

      <style jsx global>{`
        .pac-container {
          z-index: 99999 !important;
          border-radius: 1.5rem;
          border: none !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important;
          margin-top: 8px;
          font-family: inherit;
        }
        .pac-item {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 14px;
        }
        .pac-item:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  )
}