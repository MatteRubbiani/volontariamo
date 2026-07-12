'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import TagBadge from '@/components/TagBadge'
import CompetenzaSelector from './CompetenzaSelector'
import MediaGalleryPicker from '@/components/MediaGalleryPicker'
import { analizzaTestoPosizione } from '@/app/ai-actions'
import PosizioneCard from '@/components/PosizioneCard'
import { Sparkles, Eye, Calendar, Clock, MapPin, Check, Loader2 } from 'lucide-react'

const GIORNI = [
  { etichetta: 'L', valore: 'Lunedì' },
  { etichetta: 'M', valore: 'Martedì' },
  { etichetta: 'M', valore: 'Mercoledì' },
  { etichetta: 'G', valore: 'Giovedì' },
  { etichetta: 'V', valore: 'Venerdì' },
  { etichetta: 'S', valore: 'Sabato' },
  { etichetta: 'D', valore: 'Domenica' }
]

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function FormPosizioneConPreview({ 
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
  const [currentId, setCurrentId] = useState<string | null>(posizione?.id || null)
  const [immagineId, setImmagineId] = useState<string | null>(posizione?.immagine_id || null)
  const [immagineUrl, setImmagineUrl] = useState<string | null>(posizione?.media_associazioni?.url || posizione?.immagine?.url || null)
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

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

  // Generatore della stringa leggibile del "quando" per evitare duplicazioni di logica
  const quandoCalcolato = useMemo(() => {
    if (tipo === 'una_tantum') {
      return dataEsatta || 'Data da definire'
    }
    return giorniSelezionati.length > 0 ? giorniSelezionati.join(', ') : 'Giorni da definire'
  }, [tipo, dataEsatta, giorniSelezionati])

  const liveMockPosizione = useMemo(() => {
    const selectedTagsObjects = tagsDisponibili.filter((t: any) => tagSelezionati.includes(t.id))
    const selectedCompetenzeObjects = competenzeDisponibili.filter((c: any) => competenzeState.includes(c.id))

    return {
      id: currentId || 'preview',
      titolo: titolo || 'Titolo dell\'annuncio',
      descrizione: descrizione || 'La descrizione comparirà qui in tempo reale mentre scrivi...',
      tipo: tipo,
      dove: dove || 'Indirizzo sede',
      quando: quandoCalcolato,
      ora_inizio: oraInizio ? `${oraInizio}:00` : null,
      ora_fine: oraFine ? `${oraFine}:00` : null,
      giorni_settimana: giorniSelezionati,
      data_esatta: dataEsatta,
      competenze: selectedCompetenzeObjects,
      tags: selectedTagsObjects,
      stato: posizione?.stato || 'bozza',
      immagine_url: immagineUrl,
      immagine: { url: immagineUrl },
      media_associazioni: immagineUrl ? { url: immagineUrl } : null
    }
  }, [titolo, descrizione, tipo, dove, dataEsatta, giorniSelezionati, oraInizio, oraFine, tagSelezionati, competenzeState, immagineUrl, tagsDisponibili, competenzeDisponibili, currentId, posizione, quandoCalcolato])

  const findCoordinatesWithPlacesAPI = (addressQuery: string) => {
    const google = (window as any).google
    if (google?.maps?.places) {
      const service = new google.maps.places.PlacesService(window.document.createElement('div'))
      service.findPlaceFromQuery({ query: addressQuery, fields: ['formatted_address', 'geometry'] }, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          const loc = results[0].geometry.location
          setCoordinate({ lat: loc.lat(), lng: loc.lng() })
          if (results[0].formatted_address) setDove(results[0].formatted_address)
        }
      })
    }
  }

  // ==========================================
  // 💾 MOTORE AUTO-SAVE A BOZZA PROTETTO
  // ==========================================
  useEffect(() => {
    if (!titolo.trim() || isSubmitting) return

    setAutoSaveStatus('saving')
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setAutoSaveStatus('idle')
          return
        }

        const payload = {
          id: currentId || undefined,
          associazione_id: user.id,
          titolo: titolo.trim(),
          descrizione: descrizione.trim() || 'Nessuna descrizione inserita.',
          tipo: tipo,
          // ✨ FIX CRITICO: Forniamo la stringa calcolata per soddisfare il vincolo NOT NULL di "quando"
          quando: quandoCalcolato,
          dove: dove.trim() || 'Sede da definire',
          data_esatta: tipo === 'una_tantum' && dataEsatta ? dataEsatta : null,
          giorni_settimana: tipo === 'ricorrente' ? giorniSelezionati : [],
          ora_inizio: oraInizio || null,
          ora_fine: oraFine || null,
          immagine_id: immagineId || null,
          stato: posizione?.stato || 'bozza'
        }

        if (currentId) {
          const { error } = await supabase.from('posizioni').update(payload).eq('id', currentId)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('posizioni').insert(payload).select('id').single()
          if (error) throw error
          if (data?.id) setCurrentId(data.id)
        }
        setAutoSaveStatus('saved')
      } catch (err) {
        console.error("Errore critico durante l'auto-save della bozza:", err)
        setAutoSaveStatus('idle')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [titolo, descrizione, tipo, dove, dataEsatta, giorniSelezionati, oraInizio, oraFine, immagineId, currentId, isSubmitting, posizione, quandoCalcolato])

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
        
        if (d.immagine_id) {
          setImmagineId(d.immagine_id)
          const matchedMedia = mediaDisponibili.find((m: any) => String(m.id) === String(d.immagine_id))
          if (matchedMedia) setImmagineUrl(matchedMedia.url)
        }
        setMagicText('')
      } else alert(result.error)
    } finally { setIsAnalyzing(false) }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row items-start gap-12 relative">
      
      <div className="absolute -top-16 right-0 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 pointer-events-none">
        {autoSaveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin text-slate-500" /> Salvataggio bozza...</>}
        {autoSaveStatus === 'saved' && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Modifiche salvate automaticamente</>}
      </div>

      <div className="flex-1 w-full space-y-10">
        
        {/* Assistente AI */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-900 p-2 rounded-2xl shadow-sm">
          <div className="flex-1 flex items-center gap-3 px-3 py-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <textarea 
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              placeholder="Incolla qui un testo grezzo e lascia che l'AI compili la scheda..."
              className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none resize-none font-medium text-xs md:text-sm h-6 focus:h-20 transition-all leading-relaxed"
            />
          </div>
          <button
            type="button"
            onClick={handleMagicParse}
            disabled={isAnalyzing || !magicText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors self-end shrink-0"
          >
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Compila"}
          </button>
        </div>

        <form 
          action={async (fd) => {
            setIsSubmitting(true)
            try { 
              fd.set('stato', 'pubblicata')
              // Passiamo il quando compilato anche al Server Action finale
              fd.set('quando', quandoCalcolato)
              if (currentId) fd.set('id', currentId)
              await salvaAction(fd)
              window.location.assign('/app/associazione/posizioni') 
            } catch (e) { 
              console.error(e)
              setIsSubmitting(false) 
            }
          }} 
          className="space-y-8"
        >
          {/* TIPO OPPORTUNITÀ */}
          <div className="flex border-b border-slate-100 gap-6">
            <button type="button" onClick={() => setTipo('una_tantum')} className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tipo === 'una_tantum' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Evento Singolo
            </button>
            <button type="button" onClick={() => setTipo('ricorrente')} className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tipo === 'ricorrente' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Attività Continuativa
            </button>
            <input type="hidden" name="tipo" value={tipo} />
          </div>

          {/* TITOLO E DESCRIZIONE */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-0.5">Titolo della posizione</label>
              <input 
                name="titolo" 
                value={titolo} 
                onChange={e => setTitolo(e.target.value)} 
                placeholder="Es. Supporto compiti o Accoglienza mensa"
                className="w-full pb-2 border-b border-slate-200 focus:border-slate-900 outline-none font-semibold text-lg text-slate-900 transition-colors placeholder:text-slate-300 placeholder:font-normal" 
                required 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-0.5">Descrizione delle attività</label>
              <textarea 
                name="descrizione" 
                value={descrizione} 
                onChange={e => setDescrizione(e.target.value)} 
                placeholder="Fornisci una panoramica trasparente dei compiti richiesti e dell'impatto atteso..."
                className="w-full py-2 border-b border-slate-200 focus:border-slate-900 outline-none font-normal text-sm sm:text-base text-slate-700 h-24 resize-none transition-colors placeholder:text-slate-300" 
                required 
              />
            </div>
          </div>

          {/* TEMPORALIZZAZIONE */}
          <div className="py-2 border-b border-slate-100">
            {tipo === 'una_tantum' ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Giorno dell'evento</span>
                <input 
                  type="date" 
                  name="data_esatta" 
                  value={dataEsatta} 
                  onChange={e => setDataEsatta(e.target.value)} 
                  className="p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-slate-900 text-xs sm:text-sm" 
                  required={tipo === 'una_tantum'} 
                />
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Giorni ricorrenti della settimana</span>
                <div className="flex flex-wrap gap-2">
                  {GIORNI.map(g => {
                    const isSelected = giorniSelezionati.includes(g.valore)
                    return (
                      <button 
                        key={g.valore} 
                        type="button" 
                        onClick={() => toggleGiorno(g.valore)}
                        className={`w-10 h-10 rounded-full font-bold text-xs transition-all flex items-center justify-center ${isSelected ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300 hover:text-slate-600'}`}
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

          {/* ORARI E LUOGO CORRETTI SU UNA RIGA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Orari di attività</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <input type="time" name="ora_inizio" value={oraInizio} onChange={e => setOraInizio(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-2 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-slate-900" required />
                <span className="text-slate-300 font-bold">-</span>
                <input type="time" name="ora_fine" value={oraFine} onChange={e => setOraFine(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-2 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-slate-900" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Sede di svolgimento</label>
              <input ref={inputRef} name="dove" value={dove} onChange={e => setDove(e.target.value)} placeholder="Cerca indirizzo o comune..." className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-xs sm:text-sm text-slate-800 font-semibold placeholder:text-slate-300 placeholder:font-normal h-[54px]" required />
              {coordinate && <><input type="hidden" name="lat" value={coordinate.lat} /><input type="hidden" name="lng" value={coordinate.lng} /></>}
            </div>
          </div>

          {/* CARICAMENTO COPERTINA */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-0.5">Media di Copertina</label>
            <MediaGalleryPicker 
              mediaIniziali={mediaDisponibili} 
              onSelect={(id: string | null, url?: string | null) => {
                setImmagineId(id)
                if (url) {
                  setImmagineUrl(url)
                } else {
                  const selectedMedia = mediaDisponibili.find((m: any) => String(m.id) === String(id))
                  setImmagineUrl(selectedMedia ? selectedMedia.url : null)
                }
              }} 
            />
            <input type="hidden" name="immagine_id" value={immagineId || ''} />
          </div>

          {/* ASSEGNAZIONE TAG E COMPETENZE */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="space-y-4">
              {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([cat, tags]: any) => (
                <div key={cat} className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-0.5">{cat}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t: any) => {
                      const isSelected = tagSelezionati.includes(t.id)
                      return (
                        <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`transition-all rounded-lg text-left relative ${isSelected ? 'ring-2 ring-slate-900 shadow-sm scale-[1.01]' : 'opacity-50 hover:opacity-100'}`}>
                          <TagBadge nome={t.name} categoria={t.categoria} size="md" />
                          {isSelected && <span className="absolute -top-1 -right-1 bg-slate-900 text-white p-0.5 rounded-full"><Check className="w-2 h-2" /></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <input type="hidden" name="tags" value={JSON.stringify(tagSelezionati)} />

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-0.5">Competenze trasversali cercate</label>
              <CompetenzaSelector key={compKey} allCompetenze={competenzeDisponibili} competenzeIniziali={competenzeState} onChange={setCompetenzeState} />
              <input type="hidden" name="competenze" value={JSON.stringify(competenzeState)} />
            </div>
          </div>

          {/* BOTTONE PUBBLICAZIONE */}
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base text-white transition-all shadow-sm ${isSubmitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black active:scale-[0.99]'}`}
          >
            {isSubmitting ? "Pubblicazione in corso..." : (posizione ? 'Rilascia aggiornamento' : 'Rilascia e pubblica annuncio')}
          </button>
        </form>
      </div>

      {/* COLONNA DESTRA: Sticky Live Preview */}
      <div className="hidden lg:block w-[320px] sticky top-28 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
            <Eye className="w-3.5 h-3.5" /> Anteprima in tempo reale
          </div>
          <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transition-all duration-300">
            <PosizioneCard posizione={liveMockPosizione} ruolo="volontario" layout="vertical" />
          </div>
          <p className="text-[11px] text-slate-400 font-normal leading-relaxed text-center px-4">
            Così apparirà l'opportunità sulla tua bacheca e nella mappa di esplorazione dei volontari una volta pubblicata.
          </p>
        </div>
      </div>

    </div>
  )
}