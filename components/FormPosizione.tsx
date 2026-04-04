'use client'

import { useState, useEffect, useRef } from 'react'
import { getTagColor } from '@/lib/tagColors'
// 1. IMPORTIAMO IL NOSTRO SELETTORE DI COMPETENZE
import CompetenzaSelector from './CompetenzaSelector'

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
  competenzeDisponibili = [],           // <--- NUOVA PROP
  competenzeSelezionate = [],           // <--- NUOVA PROP
  salvaAction 
}: { 
  posizione?: any
  tagsDisponibili?: any[]
  tagsSelezionati?: string[]
  competenzeDisponibili?: any[]         // <--- NUOVO TIPO
  competenzeSelezionate?: string[]      // <--- NUOVO TIPO
  salvaAction: (formData: FormData) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipo, setTipo] = useState<'una_tantum' | 'ricorrente'>(posizione?.tipo || 'una_tantum')
  const [giorniSelezionati, setGiorniSelezionati] = useState<string[]>(posizione?.giorni_settimana || [])
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // --- LOGICA GOOGLE MAPS (Invariata) ---
  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google
      if (google && inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'it' },
          fields: ['formatted_address']
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place && place.formatted_address && inputRef.current) {
            inputRef.current.value = place.formatted_address
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

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <form 
        action={async (fd) => {
          setIsSubmitting(true)
          try {
            await salvaAction(fd)
            // FORZIAMO IL RELOAD PER AGGIORNARE NAVBAR E DASHBOARD
            window.location.assign('/dashboard/associazione')
          } catch (error) {
            window.location.assign('/dashboard/associazione')
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

        {/* 2. TITOLO E DESCRIZIONE */}
        <div className="grid gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Titolo Posizione</label>
            <input name="titolo" defaultValue={posizione?.titolo} placeholder="es: Aiuto Mensa Sociale" className="w-full p-5 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-xl bg-slate-50/50 transition-all" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Descrizione</label>
            <textarea name="descrizione" defaultValue={posizione?.descrizione} placeholder="Cosa faranno i volontari?" className="w-full p-5 border-2 border-slate-50 rounded-2xl h-32 focus:border-blue-500 focus:bg-white outline-none bg-slate-50/50 transition-all" required />
          </div>
        </div>

        {/* 3. LOGICA TEMPORALE */}
        <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 transition-all">
          {tipo === 'una_tantum' ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95">
              <label className="text-sm font-black text-blue-700 uppercase tracking-tighter">📅 Data dell'evento</label>
              <input type="date" name="data_esatta" defaultValue={posizione?.data_esatta} className="w-full p-5 rounded-2xl border-none shadow-lg focus:ring-4 ring-blue-500/20 text-lg font-medium outline-none" required={tipo === 'una_tantum'} />
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <label className="text-sm font-black text-blue-700 uppercase tracking-tighter">🗓️ Giorni della settimana</label>
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

        {/* 4. ORARI E LUOGO */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">⏳ Orario</label>
            <div className="flex items-center gap-2">
              <input type="time" name="ora_inizio" defaultValue={posizione?.ora_inizio?.substring(0,5)} className="flex-1 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50 font-bold outline-none focus:border-blue-500" required />
              <input type="time" name="ora_fine" defaultValue={posizione?.ora_fine?.substring(0,5)} className="flex-1 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50 font-bold outline-none focus:border-blue-500" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">📍 Luogo</label>
            <input 
              ref={inputRef} name="dove" defaultValue={posizione?.dove} placeholder="Cerca via o città..." 
              className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-blue-500 outline-none font-bold bg-slate-50/50" 
              required autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
          </div>
        </div>

        {/* 5. TAGS GESTITI DA REACT CON COLORI DINAMICI */}
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

        {/* 6. COMPETENZE RICHIESTE - NUOVA SEZIONE! */}
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