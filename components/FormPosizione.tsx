'use client'

import { useState, useEffect, useRef } from 'react'
import { getTagColor } from '@/lib/tagColors'
import CompetenzaSelector from './CompetenzaSelector'
import MediaGalleryPicker from '@/components/MediaGalleryPicker'
import { generaDescrizioneAI } from '@/app/ai-actions' // 🚨 IMPORTAZIONE DELLA TUA AZIONE AI

const GIORNI = [
  { etichetta: 'L', valore: 'Lunedì' },
  { etichetta: 'M', valore: 'Martedì' },
  { etichetta: 'M', valore: 'Mercoledì' },
  { etichetta: 'G', valore: 'Giovedì' },
  { etichetta: 'V', valore: 'Venerdì' },
  { etichetta: 'S', valore: 'Sabato' },
  { etichetta: 'D', valore: 'Domenica' }
]

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
  const [tipo, setTipo] = useState<'una_tantum' | 'ricorrente'>(posizione?.tipo || 'una_tantum')
  const [giorniSelezionati, setGiorniSelezionati] = useState<string[]>(posizione?.giorni_settimana || [])
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)
  const [immagineId, setImmagineId] = useState<string | null>(posizione?.immagine_id || null)
  
  // 🚨 STATI CONTROLLATI PER L'AI
  const [titolo, setTitolo] = useState(posizione?.titolo || '')
  const [descrizione, setDescrizione] = useState(posizione?.descrizione || '')
  
  // 🚨 STATI PER L'UI DEL MAGIC COPYWRITER
  const [showAiBox, setShowAiBox] = useState(false)
  const [aiSpunto, setAiSpunto] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [coordinate, setCoordinate] = useState<{lat: number, lng: number} | null>(null)
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
            inputRef.current.value = place.formatted_address
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
    setGiorniSelezionati(prev => 
      prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val]
    )
  }

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // 🚨 FUNZIONE PER GENERARE LA DESCRIZIONE
  const handleMagicGeneration = async () => {
    if (!titolo.trim()) {
      alert("Scrivi prima il Titolo dell'annuncio in alto!")
      return
    }
    
    setIsGenerating(true)
    const result = await generaDescrizioneAI(titolo, aiSpunto)
    
    if (result.error) {
      alert(result.error)
    } else if (result.text) {
      setDescrizione(result.text) // Inietta il testo nell'area principale!
      setShowAiBox(false)         // Chiude il box magico
      setAiSpunto('')
    }
    setIsGenerating(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
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
        className="space-y-8 bg-white p-8 md:p-12 rounded-[3rem] border shadow-2xl"
      >
        
        {/* 1. SELETTORE TIPO */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
          <button 
            type="button"
            onClick={() => setTipo('una_tantum')}
            className={`flex-1 py-4 rounded-xl font-black transition-all duration-300 ${tipo === 'una_tantum' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400'}`}
          >
            Evento Singolo
          </button>
          <button 
            type="button"
            onClick={() => setTipo('ricorrente')}
            className={`flex-1 py-4 rounded-xl font-black transition-all duration-300 ${tipo === 'ricorrente' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400'}`}
          >
            Ricorrente
          </button>
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        {/* 2. IMMAGINE DI COPERTINA (GALLERIA MEDIA) */}
        <div className="pt-4 pb-2 border-b border-slate-100">
          <MediaGalleryPicker 
            mediaIniziali={mediaDisponibili} 
            onSelect={(id) => setImmagineId(id)} 
          />
          <input type="hidden" name="immagine_id" value={immagineId || ''} />
        </div>

        {/* 3. TITOLO E DESCRIZIONE */}
        <div className="grid gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Titolo Posizione</label>
            <input 
              name="titolo" 
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="es: Aiuto Mensa Sociale" 
              className="w-full p-5 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-xl bg-slate-50/50 transition-all" 
              required 
            />
          </div>
          
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Descrizione</label>
              
              {/* BOTTONE MAGICO */}
              <button 
                type="button" 
                onClick={() => setShowAiBox(!showAiBox)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Scrivi con AI
              </button>
            </div>

            {/* BOX GENERATORE AI */}
            {showAiBox && (
              <div className="mb-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="relative z-10 flex flex-col gap-3">
                  <p className="text-white text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    L'AI scriverà un testo professionale per te.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={aiSpunto}
                      onChange={(e) => setAiSpunto(e.target.value)}
                      placeholder="Di cosa si tratta? (es. servono 5 volontari giovedì mattina)" 
                      className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleMagicGeneration()}
                    />
                    <button 
                      type="button" 
                      onClick={handleMagicGeneration}
                      disabled={isGenerating || !aiSpunto}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : 'Genera'}
                    </button>
                  </div>
                </div>
                {/* Effetto luce di sfondo */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
              </div>
            )}

            <textarea 
              name="descrizione" 
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Cosa faranno i volontari?" 
              className="w-full p-5 border-2 border-slate-50 rounded-2xl h-32 focus:border-blue-500 focus:bg-white outline-none bg-slate-50/50 transition-all resize-none" 
              required 
            />
          </div>
        </div>

        {/* 4. LOGICA TEMPORALE */}
        <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 transition-all">
          {tipo === 'una_tantum' ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95">
              <label className="text-sm font-black text-blue-700 uppercase tracking-tighter flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                Data dell'evento
              </label>
              <input type="date" name="data_esatta" defaultValue={posizione?.data_esatta} className="w-full p-5 rounded-2xl border-none shadow-lg focus:ring-4 ring-blue-500/20 text-lg font-medium outline-none" required={tipo === 'una_tantum'} />
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <label className="text-sm font-black text-blue-700 uppercase tracking-tighter flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                Giorni della settimana
              </label>
              <div className="flex justify-between gap-2">
                {GIORNI.map(g => (
                  <button key={g.valore} type="button" onClick={() => toggleGiorno(g.valore)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full font-black text-lg transition-all border-4 ${giorniSelezionati.includes(g.valore) ? 'bg-blue-600 border-blue-200 text-white scale-110 shadow-xl' : 'bg-white border-white text-slate-300 hover:border-blue-100'}`}>
                    {g.etichetta}
                  </button>
                ))}
              </div>
              {giorniSelezionati.map(g => <input key={g} type="hidden" name="giorni_settimana" value={g} />)}
            </div>
          )}
        </div>

        {/* 5. ORARI E LUOGO */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Orario
            </label>
            <div className="flex items-center gap-2">
              <input type="time" name="ora_inizio" defaultValue={posizione?.ora_inizio?.substring(0,5)} className="flex-1 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50 font-bold outline-none focus:border-blue-500" required />
              <input type="time" name="ora_fine" defaultValue={posizione?.ora_fine?.substring(0,5)} className="flex-1 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50 font-bold outline-none focus:border-blue-500" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              Luogo
            </label>
            <input 
              ref={inputRef} name="dove" defaultValue={posizione?.dove} placeholder="Cerca via o città..." 
              className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-blue-500 outline-none font-bold bg-slate-50/50" 
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
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest block">
            Ambito dell'annuncio (Categorie)
          </label>
          <div className="flex flex-wrap gap-3">
            {tagsDisponibili.map(t => {
              const isSelected = tagSelezionati.includes(t.id);
              const activeColorClass = getTagColor(t.name);
              
              return (
                <button 
                  key={t.id} 
                  type="button" 
                  onClick={() => toggleTag(t.id)}
                  className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 block ${
                    isSelected 
                      ? `${activeColorClass} shadow-lg scale-105` 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
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
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest block">
            Competenze Richieste (Opzionale)
          </label>
          <CompetenzaSelector 
            allCompetenze={competenzeDisponibili} 
            competenzeIniziali={competenzeSelezionate} 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full text-white font-black py-7 rounded-[2.5rem] shadow-2xl transition-all text-xl mt-8 ${
            isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-[0.97]'
          }`}
        >
          {isSubmitting ? 'SALVATAGGIO...' : (posizione ? 'AGGIORNA ANNUNCIO' : 'PUBBLICA ANNUNCIO')}
        </button>

      </form>

      <style jsx global>{`
        .pac-container {
          z-index: 99999 !important;
          border-radius: 1.5rem;
          border: none !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important;
          margin-top: 8px;
        }
      `}</style>
    </div>
  )
}