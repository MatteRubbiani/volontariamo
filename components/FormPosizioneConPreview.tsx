'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import TagBadge from '@/components/TagBadge'
import MediaGalleryPicker from '@/components/MediaGalleryPicker'
import { analizzaTestoPosizione } from '@/app/ai-actions'
import PosizioneCard from '@/components/PosizioneCard'
import { Sparkles, Eye, Calendar, Clock, MapPin, Check, Loader2 } from 'lucide-react'
import { Database } from '@/types/supabase'

const GIORNI = [
  { etichetta: 'L', valore: 'Lunedì' },
  { etichetta: 'M', valore: 'Martedì' },
  { etichetta: 'M', valore: 'Mercoledì' },
  { etichetta: 'G', valore: 'Giovedì' },
  { etichetta: 'V', valore: 'Venerdì' },
  { etichetta: 'S', valore: 'Sabato' },
  { etichetta: 'D', valore: 'Domenica' }
]

function generaSlug(testo: string): string {
  return testo
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function FormPosizioneConPreview({ 
  posizione, 
  tagsDisponibili = [], 
  tagsSelezionati: tagsIniziali = [],
  mediaDisponibili = [],
  salvaAction 
}: { 
  posizione?: any
  tagsDisponibili?: any[]
  tagsSelezionati?: string[]
  competenzeDisponibili?: any[]         
  competenzeSelezionate?: string[]
  mediaDisponibili?: any[]
  sediDisponibili?: any[]
  salvaAction: (formData: FormData) => Promise<void>
}) {
  const supabase = useMemo(
    () => createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(posizione?.id || null)

  // Campi Core
  const [titolo, setTitolo] = useState(posizione?.titolo || '')
  const [descrizione, setDescrizione] = useState(posizione?.descrizione || '')
  const [tipo, setTipo] = useState<'una_tantum' | 'ricorrente'>(posizione?.tipo || 'una_tantum')
  const [modalita, setModalita] = useState<'in_sede' | 'ibrido' | 'da_remoto'>(posizione?.modalita || 'in_sede')
  
  // Temporalità
  const [dataEsatta, setDataEsatta] = useState(posizione?.data_esatta || '')
  const [giorniSelezionati, setGiorniSelezionati] = useState<string[]>(posizione?.giorni_settimana || [])
  const [oraInizio, setOraInizio] = useState(posizione?.ora_inizio?.substring(0, 5) || '')
  const [oraFine, setOraFine] = useState(posizione?.ora_fine?.substring(0, 5) || '')

  // Localizzazione (colonne reali: indirizzo_specifico, luogo_nome, comune, provincia)
  const [indirizzoSpecifico, setIndirizzoSpecifico] = useState(
    posizione?.indirizzo_specifico || posizione?.dove || ''
  )
  const [luogoNome, setLuogoNome] = useState(posizione?.luogo_nome || '')
  const [comune, setComune] = useState(posizione?.comune || '')
  const [provincia, setProvincia] = useState(posizione?.provincia || '')
  const [coordinate, setCoordinate] = useState<{ lat: number; lng: number } | null>(
    posizione?.lat && posizione?.lng ? { lat: posizione.lat, lng: posizione.lng } : null
  )

  // Immagine (collegata a MediaGalleryPicker ma mappata su immagine_path)
  const [immaginePath, setImmaginePath] = useState<string | null>(
    posizione?.immagine_path || posizione?.immagine_url || null
  )
  const [immagineUrl, setImmagineUrl] = useState<string | null>(
    posizione?.immagine_path || posizione?.immagine_url || null
  )

  // Tags
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)

  // Assistente AI & Auto-Save
  const [magicText, setMagicText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const inputIndirizzoRef = useRef<HTMLInputElement>(null)

  const tagsRaggruppati = useMemo(() => {
    return tagsDisponibili?.reduce((acc: any, tag: any) => {
      const cat = tag.categoria || 'Generale'
      acc[cat] = acc[cat] || []
      acc[cat].push(tag)
      return acc
    }, {})
  }, [tagsDisponibili])

  const toggleGiorno = (val: string) => {
    setGiorniSelezionati(prev => prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val])
  }

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const quandoCalcolato = useMemo(() => {
    if (tipo === 'una_tantum') {
      return dataEsatta || 'Data da definire'
    }
    return giorniSelezionati.length > 0 ? giorniSelezionati.join(', ') : 'Giorni da definire'
  }, [tipo, dataEsatta, giorniSelezionati])

  // Live Mock per l'anteprima laterale
  const liveMockPosizione = useMemo(() => {
    const selectedTagsObjects = tagsDisponibili
      .filter((t: any) => tagSelezionati.includes(t.id))
      .map((t: any) => ({
        ...t,
        name: t.nome || t.name,
      }))

    return {
      id: currentId || 'preview',
      titolo: titolo || "Titolo dell'annuncio",
      descrizione: descrizione || 'La descrizione comparirà qui in tempo reale mentre scrivi...',
      tipo,
      modalita,
      luogo_nome: luogoNome,
      indirizzo_specifico: indirizzoSpecifico || 'Sede da definire',
      comune,
      provincia,
      quando: quandoCalcolato,
      ora_inizio: oraInizio ? `${oraInizio}:00` : null,
      ora_fine: oraFine ? `${oraFine}:00` : null,
      giorni_settimana: giorniSelezionati,
      data_esatta: dataEsatta,
      tags: selectedTagsObjects,
      stato: posizione?.stato || 'bozza',
      immagine_url: immagineUrl || immaginePath,
      immagine_path: immaginePath,
    }
  }, [
    titolo, descrizione, tipo, modalita, luogoNome, indirizzoSpecifico, comune, provincia,
    quandoCalcolato, oraInizio, oraFine, giorniSelezionati, dataEsatta, tagSelezionati,
    tagsDisponibili, currentId, posizione, immagineUrl, immaginePath
  ])

  // Autocomplete Indirizzo Google Places
  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google
      if (google?.maps?.places && inputIndirizzoRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputIndirizzoRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'it' },
          fields: ['formatted_address', 'geometry', 'address_components']
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place?.formatted_address) {
            setIndirizzoSpecifico(place.formatted_address)

            if (place.address_components) {
              for (const c of place.address_components) {
                if (c.types.includes('locality')) setComune(c.long_name)
                if (c.types.includes('administrative_area_level_2')) setProvincia(c.short_name)
              }
            }

            if (place.geometry?.location) {
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
      const check = setInterval(() => {
        if ((window as any).google) {
          initAutocomplete()
          clearInterval(check)
        }
      }, 500)
      return () => clearInterval(check)
    }
  }, [])

  // ==========================================
  // AUTO-SAVE BOZZA (Campi allineati al DB)
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

        const baseSlug = generaSlug(titolo) || 'bozza'
        const randomSuffix = Math.random().toString(36).substring(2, 6)
        const slug = `${baseSlug}-${randomSuffix}`

        const payload: any = {
          associazione_id: user.id,
          titolo: titolo.trim(),
          descrizione: descrizione.trim() || 'Nessuna descrizione inserita.',
          tipo,
          modalita,
          quando: quandoCalcolato,
          indirizzo_specifico: indirizzoSpecifico.trim() || null,
          luogo_nome: luogoNome.trim() || null,
          comune: comune.trim() || null,
          provincia: provincia.trim() || null,
          lat: coordinate?.lat || null,
          lng: coordinate?.lng || null,
          data_esatta: tipo === 'una_tantum' && dataEsatta ? dataEsatta : null,
          giorni_settimana: tipo === 'ricorrente' ? giorniSelezionati : [],
          ora_inizio: oraInizio ? `${oraInizio}:00` : null,
          ora_fine: oraFine ? `${oraFine}:00` : null,
          immagine_path: immaginePath || null,
          stato: posizione?.stato || 'bozza',
        }

        if (currentId) {
          const { error } = await supabase
            .from('posizioni')
            .update(payload)
            .eq('id', currentId)
            .eq('associazione_id', user.id)

          if (error) throw error
        } else {
          payload.slug = slug
          const { data, error } = await supabase
            .from('posizioni')
            .insert(payload)
            .select('id')
            .single()

          if (error) throw error
          if (data?.id) setCurrentId(data.id)
        }

        setAutoSaveStatus('saved')
      } catch (err) {
        console.error("Errore durante l'auto-save della bozza:", err)
        setAutoSaveStatus('idle')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [
    titolo, descrizione, tipo, modalita, indirizzoSpecifico, luogoNome, comune, provincia,
    coordinate, dataEsatta, giorniSelezionati, oraInizio, oraFine, immaginePath,
    currentId, isSubmitting, posizione, quandoCalcolato, supabase
  ])

  // AI Magic Parse
  const handleMagicParse = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analizzaTestoPosizione(magicText, tagsDisponibili, [])
      if (result.success && result.data) {
        const d = result.data
        if (d.titolo) setTitolo(d.titolo)
        if (d.descrizione) setDescrizione(d.descrizione)
        if (d.giorni_settimana?.length > 0) { 
          setTipo('ricorrente')
          setGiorniSelezionati(d.giorni_settimana) 
        } else if (d.tipo) {
          setTipo(d.tipo)
        }
        if (d.data_esatta) setDataEsatta(d.data_esatta)
        if (d.ora_inizio) setOraInizio(d.ora_inizio)
        if (d.ora_fine) setOraFine(d.ora_fine)
        if (d.indirizzo_specifico || d.dove) {
          setIndirizzoSpecifico(d.indirizzo_specifico || d.dove)
        }
        if (Array.isArray(d.tags)) setTagSelezionati(d.tags)
        setMagicText('')
      } else if (result.error) {
        alert(result.error)
      }
    } finally { 
      setIsAnalyzing(false) 
    }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row items-start gap-12 relative">
      
      {/* Indicatore Auto-Save */}
      <div className="absolute -top-16 right-0 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 pointer-events-none">
        {autoSaveStatus === 'saving' && (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
            <span>Salvataggio bozza...</span>
          </>
        )}
        {autoSaveStatus === 'saved' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Modifiche salvate automaticamente</span>
          </>
        )}
      </div>

      <div className="flex-1 w-full space-y-10">
        
        {/* Assistente AI */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-900 p-2 rounded-2xl shadow-sm">
          <div className="flex-1 flex items-center gap-3 px-3 py-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <textarea 
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              placeholder="Incolla qui un testo descrittivo e lascia che l'AI compili la scheda..."
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
              fd.set('quando', quandoCalcolato)
              if (currentId) fd.set('id', currentId)
              await salvaAction(fd)
            } catch (e: any) { 
              if (e?.message?.includes('NEXT_REDIRECT') || e?.digest?.includes('NEXT_REDIRECT')) {
                throw e
              }
              console.error(e)
              setIsSubmitting(false) 
            }
          }} 
          className="space-y-8"
        >
          {/* TIPO OPPORTUNITÀ */}
          <div className="flex border-b border-slate-100 gap-6">
            <button 
              type="button" 
              onClick={() => setTipo('una_tantum')} 
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tipo === 'una_tantum' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Evento Singolo
            </button>
            <button 
              type="button" 
              onClick={() => setTipo('ricorrente')} 
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tipo === 'ricorrente' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Attività Continuativa
            </button>
            <input type="hidden" name="tipo" value={tipo} />
            <input type="hidden" name="modalita" value={modalita} />
          </div>

          {/* TITOLO E DESCRIZIONE */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-0.5">
                Titolo dell'annuncio
              </label>
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
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-0.5">
                Descrizione delle attività
              </label>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Giorno dell'evento
                </span>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Giorni ricorrenti della settimana
                </span>
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

          {/* ORARI E INDIRIZZO SPECIFICO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Orari di attività
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <input 
                  type="time" 
                  name="ora_inizio" 
                  value={oraInizio} 
                  onChange={e => setOraInizio(e.target.value)} 
                  className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-2 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-slate-900" 
                  required 
                />
                <span className="text-slate-300 font-bold">-</span>
                <input 
                  type="time" 
                  name="ora_fine" 
                  value={oraFine} 
                  onChange={e => setOraFine(e.target.value)} 
                  className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-2 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-slate-900" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Indirizzo o sede specifica
              </label>
              <input 
                ref={inputIndirizzoRef} 
                name="indirizzo_specifico" 
                value={indirizzoSpecifico} 
                onChange={e => setIndirizzoSpecifico(e.target.value)} 
                placeholder="Cerca via, piazza o sede..." 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-xs sm:text-sm text-slate-800 font-semibold placeholder:text-slate-300 placeholder:font-normal h-[54px]" 
                required 
              />
              <input type="hidden" name="comune" value={comune} />
              <input type="hidden" name="provincia" value={provincia} />
              {coordinate && (
                <>
                  <input type="hidden" name="lat" value={coordinate.lat} />
                  <input type="hidden" name="lng" value={coordinate.lng} />
                </>
              )}
            </div>
          </div>

          {/* MEDIA GALLERY RIPRISTINATA */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-0.5">
              Media di Copertina
            </label>
            <MediaGalleryPicker 
              mediaIniziali={mediaDisponibili} 
              onSelect={(id: string | null, url?: string | null) => {
                const finalUrl = url || mediaDisponibili.find((m: any) => String(m.id) === String(id))?.url || (id?.startsWith('http') ? id : null)
                setImmagineUrl(finalUrl)
                setImmaginePath(finalUrl || id || null)
              }} 
            />
            <input type="hidden" name="immagine_path" value={immaginePath || immagineUrl || ''} />
          </div>

          {/* ASSEGNAZIONE TAG TEMATICI */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pl-0.5">
                Ambiti e Categorie
              </label>
              {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([cat, tags]: any) => (
                <div key={cat} className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-0.5">{cat}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t: any) => {
                      const isSelected = tagSelezionati.includes(t.id)
                      return (
                        <button 
                          key={t.id} 
                          type="button" 
                          onClick={() => toggleTag(t.id)} 
                          className={`transition-all rounded-lg text-left relative ${isSelected ? 'ring-2 ring-slate-900 shadow-sm scale-[1.01]' : 'opacity-50 hover:opacity-100'}`}
                        >
                          <TagBadge nome={t.nome || t.name} categoria={t.categoria} size="md" />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-slate-900 text-white p-0.5 rounded-full">
                              <Check className="w-2 h-2" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <input type="hidden" name="tags" value={JSON.stringify(tagSelezionati)} />
          </div>

          {/* BOTTONE PUBBLICAZIONE */}
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base text-white transition-all shadow-sm ${isSubmitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black active:scale-[0.99]'}`}
          >
            {isSubmitting ? 'Pubblicazione in corso...' : (posizione ? 'Rilascia aggiornamento' : 'Rilascia e pubblica annuncio')}
          </button>
        </form>
      </div>

      {/* ANTEPRIMA STICKY */}
      <div className="hidden lg:block w-[320px] sticky top-28 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
            <Eye className="w-3.5 h-3.5" /> Anteprima in tempo reale
          </div>
          <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transition-all duration-300">
            <PosizioneCard posizione={liveMockPosizione} ruolo="volontario" layout="vertical" />
          </div>
          <p className="text-[11px] text-slate-400 font-normal leading-relaxed text-center px-4">
            Così apparirà l'opportunità sulla tua bacheca e nella mappa dei volontari una volta pubblicata.
          </p>
        </div>
      </div>

    </div>
  )
}