'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'

type AssociazioneFormState = {
  denominazione: string; 
  forma_giuridica: string; 
  codice_fiscale: string;
  email_associazione: string; 
  telefono: string; 
  descrizione: string; 
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  lat: string; // 🟢 Nuova colonna per coordinate
  lng: string; // 🟢 Nuova colonna per coordinate
  referente_progetto_nome: string;
  referente_progetto_cognome: string;
  referente_progetto_ruolo: string;
  dichiarazione_veridicita: boolean;
  consenso_privacy: boolean;
  consenso_newsletter: boolean;
  tags: string[];
}

function AssociazioneWizardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagsCatalog, setTagsCatalog] = useState<{id: string, name: string}[]>([])
  const [tagQuery, setTagQuery] = useState('')
  
  // 🟢 Riferimento per l'input dell'indirizzo di Google Maps
  const googleInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<AssociazioneFormState>({
    denominazione: '', forma_giuridica: '', codice_fiscale: '', email_associazione: '',
    telefono: '', cap: '', comune: '', provincia: '', indirizzo: '', lat: '', lng: '',
    referente_progetto_nome: '', referente_progetto_cognome: '', referente_progetto_ruolo: '', descrizione: '', 
    dichiarazione_veridicita: false, consenso_privacy: false, consenso_newsletter: false,
    tags: []
  })

  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase.from('tags').select('id,name').order('name')
      if (data) setTagsCatalog(data)
    }
    loadTags()
  }, [supabase])

  // 🟢 MOTORE INTELLIGENTE DI AUTOCOMPLETE GOOGLE MAPS
  useEffect(() => {
    if (step !== 2) return

    const initGoogleAutocomplete = () => {
      const google = (window as any).google
      if (google && googleInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(googleInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'it' },
          fields: ['address_components', 'formatted_address', 'geometry'] 
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place || !place.address_components) return

          let streetNumber = ''
          let route = ''
          let cap = ''
          let comune = ''
          let provincia = ''

          place.address_components.forEach((component: any) => {
            const types = component.types
            if (types.includes('street_number')) streetNumber = component.long_name
            if (types.includes('route')) route = component.long_name
            if (types.includes('postal_code')) cap = component.long_name
            if (types.includes('locality')) comune = component.long_name
            if (types.includes('administrative_area_level_2')) provincia = component.short_name
          })

          const fullAddress = `${route}${streetNumber ? ', ' + streetNumber : ''}`
          const lat = place.geometry?.location ? place.geometry.location.lat().toString() : ''
          const lng = place.geometry?.location ? place.geometry.location.lng().toString() : ''

          setFormData(prev => ({
            ...prev,
            indirizzo: fullAddress || place.formatted_address || '',
            cap: cap || prev.cap,
            comune: comune || prev.comune,
            provincia: provincia || prev.provincia,
            lat: lat,
            lng: lng
          }))
        })
      }
    }

    // Prova ad agganciarsi o aspetta il caricamento dello script
    const google = (window as any).google
    if (google?.maps?.places) {
      initGoogleAutocomplete()
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          initGoogleAutocomplete()
          clearInterval(interval)
        }
      }, 300)
      return () => clearInterval(interval)
    }
  }, [step])

  const toggleTag = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(id) ? prev.tags.filter(t => t !== id) : [...prev.tags, id]
    }))
  }

  const filteredTags = useMemo(() => {
    if (!tagQuery.trim()) return tagsCatalog.slice(0, 4)
    return tagsCatalog.filter(t => t.name.toLowerCase().includes(tagQuery.toLowerCase()))
  }, [tagsCatalog, tagQuery])

  const isStep1Valid = formData.denominazione.trim().length > 2 && formData.forma_giuridica && formData.codice_fiscale.trim().length >= 11 && formData.email_associazione.trim().includes('@');
  const isStep2Valid = formData.indirizzo.trim().length > 2 && formData.comune.length > 1;
  const isStep3Valid = formData.referente_progetto_nome.trim().length > 1 && formData.referente_progetto_cognome.trim().length > 1 && formData.referente_progetto_ruolo.trim().length > 1 && formData.dichiarazione_veridicita && formData.consenso_privacy;

  const progress = (step / 3) * 100

  return (
    <main className="h-[calc(100dvh-76px)] w-full bg-white flex flex-col justify-start pt-8 md:pt-16 items-center overflow-hidden font-sans antialiased selection:bg-slate-100">
      <div className="max-w-[480px] w-full flex flex-col px-6">
        
        {/* PROGRESS BAR */}
        <div className="mb-8 shrink-0">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Registrazione Ente</span>
            <span className="text-slate-900">Fase {step} di 3</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-950 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form action={async () => {
            setIsSubmitting(true)
            const payload = new FormData()
            payload.append('role', 'associazione')
            payload.append('redirectTo', redirectTo)
            Object.entries(formData).forEach(([key, value]) => {
              if (Array.isArray(value)) value.forEach(v => payload.append(key, v))
              else payload.append(key, String(value))
            })
            await completeOnboarding(payload)
        }} className="flex flex-col gap-6 w-full">
          
          {/* 🟢 COORDINATE HIDDEN PRONTE PER IL PAYLOAD DI ACTIONS */}
          <input type="hidden" name="lat" value={formData.lat} />
          <input type="hidden" name="lng" value={formData.lng} />

          {/* ==========================================
              🎨 STEP 1: ANAGRAFICA FISCALE CORE
             ========================================== */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="space-y-1.5">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 leading-none">Anagrafica dell'Ente</h1>
                <p className="text-sm text-slate-500 font-normal">Inserisci i riferimenti legali e fiscali della tua organizzazione.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <input 
                  type="text" placeholder="Denominazione Completa *" value={formData.denominazione} 
                  onChange={(e) => setFormData(p => ({...p, denominazione: e.target.value}))} 
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={formData.forma_giuridica} onChange={(e) => setFormData(p => ({...p, forma_giuridica: e.target.value}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required
                  >
                    <option value="">Forma Giuridica *</option>
                    <option value="APS">APS</option>
                    <option value="ODV">ODV</option>
                    <option value="ETS">ETS</option>
                    <option value="Altro">Altro</option>
                  </select>

                  <input 
                    type="text" placeholder="Codice Fiscale *" value={formData.codice_fiscale} 
                    onChange={(e) => setFormData(p => ({...p, codice_fiscale: e.target.value.toUpperCase().replace(/\s/g, '')}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 font-mono" required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
                  <input 
                    type="email" placeholder="Email Ufficiale *" value={formData.email_associazione} 
                    onChange={(e) => setFormData(p => ({...p, email_associazione: e.target.value}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required
                  />
                  <input 
                    type="tel" placeholder="Telefono" value={formData.telefono} 
                    onChange={(e) => setFormData(p => ({...p, telefono: e.target.value}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" 
                  />
                </div>
              </div>

              <button 
                type="button" disabled={!isStep1Valid} onClick={() => setStep(2)} 
                className="w-full rounded-2xl bg-slate-950 text-white py-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 mt-4 shadow-sm"
              >
                Continua alla Sede
              </button>
            </div>
          )}

          {/* ==========================================
              🎨 STEP 2: GOOGLE MAPS AUTOCOMPLETE & TAGS
             ========================================== */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="space-y-1.5">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 leading-none">Dove operate?</h2>
                <p className="text-sm text-slate-500 font-normal">Digita la via della sede per la geolocalizzazione automatica.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2 max-h-[46vh] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                
                {/* 🟢 INPUT UNICO GOOGLE MAPS INDIRIZZO SEDE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block ml-0.5">Indirizzo Sede Operativa *</label>
                  <input 
                    ref={googleInputRef}
                    type="text" 
                    placeholder="Inizia a digitare l'indirizzo della sede..." 
                    defaultValue={formData.indirizzo ? `${formData.indirizzo}, ${formData.comune}` : ''}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 shadow-sm"
                    required 
                  />
                </div>

                {/* VISUALIZZAZIONE DATI ESTRATTI DA GOOGLE (RIASSUNTO MINIMALE) */}
                {formData.comune && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 animate-in fade-in duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Rilevato: {formData.comune} ({formData.provincia}) · CAP {formData.cap}</span>
                  </div>
                )}

                {/* INTERATTIVITÀ PREDIZIONE TAG AMBITI */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 mt-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Ambiti di intervento dell'Ente</span>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Filtra ambiti..." value={tagQuery} onChange={(e) => setTagQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-xs font-medium outline-none"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {filteredTags.map((tag) => {
                      const active = formData.tags.includes(tag.id)
                      return (
                        <button
                          key={tag.id} type="button" onClick={() => { toggleTag(tag.id); setTagQuery(''); }}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-all duration-200 ${
                            active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-2 shrink-0">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 py-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-slate-100">Indietro</button>
                <button 
                  type="button" disabled={!isStep2Valid} onClick={() => setStep(3)}
                  className="w-2/3 rounded-2xl bg-slate-950 text-white py-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-100 shadow-md text-center"
                >
                  Ultimo Step: Referente
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              🎨 STEP 3: REFERENTE UMANO & CONSENSI
             ========================================== */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="space-y-1.5">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 leading-none">Chi gestirà l'account?</h2>
                <p className="text-sm text-slate-500 font-normal">Inserisci i riferimenti della persona responsabile dell'ente.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2 max-h-[46vh] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nome Referente *" value={formData.referente_progetto_nome} onChange={(e) => setFormData(p => ({...p, referente_progetto_nome: e.target.value}))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required />
                  <input type="text" placeholder="Cognome Referente *" value={formData.referente_progetto_cognome} onChange={(e) => setFormData(p => ({...p, referente_progetto_cognome: e.target.value}))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required />
                </div>
                <input type="text" placeholder="Ruolo societario (es. Presidente, Coordinatore) *" value={formData.referente_progetto_ruolo} onChange={(e) => setFormData(p => ({...p, referente_progetto_ruolo: e.target.value}))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400" required />

                <div className="space-y-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.dichiarazione_veridicita} onChange={(e) => setFormData(p => ({...p, dichiarazione_veridicita: e.target.checked}))} className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-md border-slate-300 accent-slate-950" required />
                    <span className="text-[11px] text-slate-500 font-normal leading-tight">Dichiaro che i dati forniti sono veritieri e l'ente opera senza fini di lucro. *</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.consenso_privacy} onChange={(e) => setFormData(p => ({...p, consenso_privacy: e.target.checked}))} className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-md border-slate-300 accent-slate-950" required />
                    <span className="text-[11px] text-slate-500 font-normal leading-tight">Accetto i termini di servizio e il trattamento dei dati personali (GDPR). *</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <input type="checkbox" checked={formData.consenso_newsletter} onChange={(e) => setFormData(p => ({...p, consenso_newsletter: e.target.checked}))} className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-md border-slate-300 accent-slate-950" />
                    <span className="text-[11px] text-slate-700 font-medium leading-tight">Desidero ricevere report sui flussi di nuovi volontari e consigli operativi. (Facoltativo)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-auto shrink-0">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 py-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-slate-100">Indietro</button>
                <button 
                  type="submit" disabled={isSubmitting || !isStep3Valid} 
                  className="w-2/3 rounded-2xl bg-slate-950 text-white py-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-100 shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Attiva Account Ente</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

export default function AssociazioneWizard() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100dvh-76px)] w-full items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AssocalypseWizardForm />
    </Suspense>
  )
}

function AssocalypseWizardForm() { return <AssociazioneWizardForm /> }