'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'
import { ShieldAlert, Search, CheckCircle2, Lock } from 'lucide-react'

type AssociazioneFormState = {
  denominazione: string; 
  nome_breve: string;
  forma_giuridica: string; 
  codice_fiscale: string;
  email_associazione: string; 
  telefono: string; 
  descrizione: string; 
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  lat: string;
  lng: string;
  referente_progetto_nome: string;
  referente_progetto_cognome: string;
  referente_progetto_ruolo: string;
  dichiarazione_legale: boolean;
  consenso_privacy: boolean;
  consenso_newsletter: boolean;
  tags: string[];
}

function AssociazioneWizardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  const claimId = searchParams.get('claim_id') || ''
  const prefilledCF = searchParams.get('cf') || ''
  
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagsCatalog, setTagsCatalog] = useState<{id: string, name: string}[]>([])
  const [tagQuery, setTagQuery] = useState('')
  
  const [isSearching, setIsSearching] = useState(false)
  const [runtsMatch, setRuntsMatch] = useState<{ found: boolean, claimed: boolean, name?: string } | null>(null)
  
  const googleInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<AssociazioneFormState>({
    denominazione: '', nome_breve: '', forma_giuridica: 'APS', codice_fiscale: prefilledCF, email_associazione: '',
    telefono: '', cap: '', comune: '', provincia: '', indirizzo: '', lat: '', lng: '',
    referente_progetto_nome: '', referente_progetto_cognome: '', referente_progetto_ruolo: '', descrizione: '', 
    dichiarazione_legale: false, consenso_privacy: false, consenso_newsletter: false, tags: []
  })

  // Caricamento Tag
  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase.from('tags').select('id,name').order('name')
      if (data) setTagsCatalog(data)
    }
    loadTags()
  }, [supabase])

  // 🟢 1. CARICAMENTO SICURO DA claim_id (UUID)
  useEffect(() => {
    if (!claimId) return

    const fetchClaimData = async () => {
      setIsSearching(true)
      
      // A. Controlla prima in 'associazioni'
      let { data } = await supabase
        .from('associazioni')
        .select('denominazione, codice_fiscale, comune, provincia, forma_giuridica, claimed')
        .eq('id', claimId)
        .maybeSingle()

      // B. Se non presente, controlla in 'runts_import'
      if (!data) {
        const runtsRes = await supabase
          .from('runts_import')
          .select('denominazione, codice_fiscale, comune, provincia, sezione_runts')
          .eq('id', claimId)
          .maybeSingle()
        
        if (runtsRes.data) {
          data = { 
            denominazione: runtsRes.data.denominazione,
            codice_fiscale: runtsRes.data.codice_fiscale,
            comune: runtsRes.data.comune,
            provincia: runtsRes.data.provincia,
            forma_giuridica: runtsRes.data.sezione_runts,
            claimed: false 
          }
        }
      }

      if (data) {
        setRuntsMatch({ found: true, claimed: data.claimed, name: data.denominazione })
        if (!data.claimed) {
          setFormData(prev => ({
            ...prev,
            codice_fiscale: data.codice_fiscale || prev.codice_fiscale,
            denominazione: data.denominazione || prev.denominazione,
            comune: data.comune || prev.comune,
            provincia: data.provincia || prev.provincia,
            forma_giuridica: data.forma_giuridica || prev.forma_giuridica
          }))
        }
      }
      setIsSearching(false)
    }

    fetchClaimData()
  }, [claimId, supabase])

  // 🟢 2. RICERCA AUTOMATICA DA DIGITAZIONE MANUAL CF (se claim_id non è presente)
  useEffect(() => {
    if (claimId) return

    const cf = formData.codice_fiscale.trim().toUpperCase()
    if (cf.length === 11) {
      const searchRunts = async () => {
        setIsSearching(true)
        const { data } = await supabase.rpc('verifica_codice_fiscale_runts', { cf_input: cf })
        
        if (data && data.length > 0) {
          const res = data[0]
          if (res.trovato) {
            setRuntsMatch({ found: true, claimed: res.gia_rivendicato, name: res.denominazione })
            if (!res.gia_rivendicato) {
              setFormData(prev => ({
                ...prev,
                denominazione: res.denominazione || prev.denominazione,
                comune: res.comune || prev.comune,
                provincia: res.provincia || prev.provincia,
                forma_giuridica: res.sezione_runts || prev.forma_giuridica
              }))
            }
          } else {
            setRuntsMatch({ found: false, claimed: false })
          }
        }
        setIsSearching(false)
      }
      searchRunts()
    } else {
      setRuntsMatch(null)
    }
  }, [formData.codice_fiscale, claimId, supabase])

  // Google Places Autocomplete
  useEffect(() => {
    if (step !== 2) return
    const initGoogleAutocomplete = () => {
      const google = (window as any).google
      if (google && googleInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(googleInputRef.current, {
          types: ['address'], componentRestrictions: { country: 'it' }, fields: ['address_components', 'formatted_address', 'geometry'] 
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place || !place.address_components) return
          let streetNumber = '', route = '', cap = '', comune = '', provincia = ''
          place.address_components.forEach((component: any) => {
            const types = component.types
            if (types.includes('street_number')) streetNumber = component.long_name
            if (types.includes('route')) route = component.long_name
            if (types.includes('postal_code')) cap = component.long_name
            if (types.includes('locality')) comune = component.long_name
            if (types.includes('administrative_area_level_2')) provincia = component.short_name
          })
          setFormData(prev => ({
            ...prev,
            indirizzo: `${route}${streetNumber ? ', ' + streetNumber : ''}` || place.formatted_address || '',
            cap: cap || prev.cap, comune: comune || prev.comune, provincia: provincia || prev.provincia,
            lat: place.geometry?.location ? place.geometry.location.lat().toString() : '',
            lng: place.geometry?.location ? place.geometry.location.lng().toString() : ''
          }))
        })
      }
    }
    const google = (window as any).google
    if (google?.maps?.places) initGoogleAutocomplete()
    else {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) { initGoogleAutocomplete(); clearInterval(interval) }
      }, 300)
      return () => clearInterval(interval)
    }
  }, [step])

  const toggleTag = (id: string) => setFormData(p => ({ ...p, tags: p.tags.includes(id) ? p.tags.filter(t => t !== id) : [...p.tags, id] }))
  const filteredTags = useMemo(() => (!tagQuery.trim() ? tagsCatalog.slice(0, 6) : tagsCatalog.filter(t => t.name.toLowerCase().includes(tagQuery.toLowerCase()))), [tagsCatalog, tagQuery])

  const isCfValid = formData.codice_fiscale.length === 11
  const isCfBlocked = runtsMatch?.claimed === true
  const isStep1Valid = isCfValid && !isCfBlocked && formData.denominazione.trim().length > 2 && formData.email_associazione.trim().includes('@')
  const isStep2Valid = formData.indirizzo.trim().length > 2 && formData.comune.length > 1
  const isStep3Valid = formData.referente_progetto_nome.trim().length > 1 && formData.referente_progetto_cognome.trim().length > 1 && formData.dichiarazione_legale && formData.consenso_privacy

  const progress = (step / 3) * 100

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] w-full bg-slate-50/50 flex flex-col justify-start pt-6 md:pt-12 pb-28 md:pb-12 items-center overflow-y-auto font-sans antialiased selection:bg-slate-100">
      <div className="max-w-[480px] w-full flex flex-col px-4 sm:px-6">
        
        {/* PROGRESS BAR */}
        <div className="mb-6 md:mb-8 shrink-0">
          <div className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>{runtsMatch?.found ? 'Rivendica Ente' : 'Nuova Registrazione'}</span>
            <span className="text-slate-900 font-extrabold">Fase {step} di 3</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
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
          
          <input type="hidden" name="lat" value={formData.lat} />
          <input type="hidden" name="lng" value={formData.lng} />

          {/* ================= STEP 1: ANAGRAFICA RUNTS BLOCCATA ================= */}
          {step === 1 && (
            <div className="flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">Anagrafica dell'Ente</h1>
                <p className="text-sm text-slate-500 font-normal">Inserisci il Codice Fiscale. Se l'ente è nel RUNTS, i dati legali verranno bloccati in automatico.</p>
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                {/* Campo Codice Fiscale */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Codice Fiscale (11 cifre) *" 
                    maxLength={11}
                    value={formData.codice_fiscale} 
                    readOnly={Boolean(claimId)}
                    onChange={(e) => setFormData(p => ({...p, codice_fiscale: e.target.value.toUpperCase().replace(/\s/g, '')}))} 
                    className={`w-full rounded-2xl border bg-white pl-12 pr-4 py-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900 font-mono shadow-xs ${isCfBlocked ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'} ${claimId ? 'bg-slate-100/80 cursor-not-allowed' : ''}`} 
                    required 
                  />
                  {isSearching && <div className="absolute right-4 top-4 w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                </div>

                {/* Feedback RUNTS */}
                {runtsMatch?.found && !runtsMatch.claimed && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">Ente presente nel RUNTS</h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Denominazione e Forma Giuridica verificate e bloccate.</p>
                    </div>
                  </div>
                )}

                {runtsMatch?.claimed && (
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">Ente già rivendicato</h4>
                      <p className="text-[11px] text-rose-700 mt-0.5">Questa associazione è gestita da un altro profilo. Contatta l'assistenza.</p>
                    </div>
                  </div>
                )}

                {/* 🔴 SE TROVATO NEL RUNTS: DENOMINAZIONE E FORMA GIURIDICA BLOCCATE */}
                {runtsMatch?.found ? (
                  <div className="space-y-3 mt-1">
                    {/* Denominazione Bloccata */}
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.denominazione} 
                        readOnly 
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 pl-4 pr-24 py-3.5 text-base sm:text-sm font-semibold text-slate-700 cursor-not-allowed outline-none select-none" 
                      />
                      <span className="absolute right-3.5 top-3.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Lock className="w-3 h-3" /> RUNTS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {/* Forma Giuridica Bloccata */}
                      <div className="relative">
                        <input 
                          type="text" 
                          value={formData.forma_giuridica || 'ETS'} 
                          readOnly 
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-3.5 text-base sm:text-sm font-semibold text-slate-700 cursor-not-allowed outline-none select-none" 
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-4" />
                      </div>

                      {/* Email Ufficiale (Compilabile dal referente) */}
                      <input 
                        type="email" 
                        placeholder="Email Ufficiale *" 
                        value={formData.email_associazione} 
                        onChange={(e) => setFormData(p => ({...p, email_associazione: e.target.value}))} 
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none transition-all focus:border-slate-900 shadow-xs" 
                        required
                      />
                    </div>
                  </div>
                ) : (
                  /* ⚪ SE NON RUNTS: TUTTO LIBERO PER NUOVA REGISTRAZIONE */
                  <div className="space-y-3 mt-1">
                    <input 
                      type="text" 
                      placeholder="Denominazione Completa *" 
                      value={formData.denominazione} 
                      onChange={(e) => setFormData(p => ({...p, denominazione: e.target.value}))} 
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none transition-all focus:border-slate-900 shadow-xs" 
                      required 
                    />
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <select 
                        value={formData.forma_giuridica} 
                        onChange={(e) => setFormData(p => ({...p, forma_giuridica: e.target.value}))} 
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none transition-all focus:border-slate-900 shadow-xs" 
                        required
                      >
                        <option value="APS">APS</option>
                        <option value="ODV">ODV</option>
                        <option value="ETS">ETS</option>
                        <option value="Altro">Altro</option>
                      </select>

                      <input 
                        type="email" 
                        placeholder="Email Ufficiale *" 
                        value={formData.email_associazione} 
                        onChange={(e) => setFormData(p => ({...p, email_associazione: e.target.value}))} 
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none transition-all focus:border-slate-900 shadow-xs" 
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="button" 
                disabled={!isStep1Valid} 
                onClick={() => setStep(2)} 
                className="w-full rounded-2xl bg-slate-950 text-white py-4 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 shadow-sm mt-2"
              >
                Continua alla Sede
              </button>
            </div>
          )}

          {/* ================= STEP 2: POSIZIONE SULLA MAPPA ================= */}
          {step === 2 && (
            <div className="flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">Posizione sulla Mappa</h2>
                <p className="text-sm text-slate-500 font-normal">Cerca l'indirizzo per accendere il pin della tua associazione sulla mappa.</p>
              </div>

              <div className="flex flex-col gap-4 mt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block ml-0.5">Indirizzo Sede Operativa *</label>
                  <input 
                    ref={googleInputRef} type="text" placeholder="Inizia a digitare l'indirizzo..." 
                    defaultValue={formData.indirizzo ? `${formData.indirizzo}, ${formData.comune}` : ''}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none focus:border-slate-900 shadow-xs" required 
                  />
                </div>

                {formData.comune && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">Pin localizzato: {formData.comune} ({formData.provincia})</span>
                  </div>
                )}

                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col gap-2.5 shadow-xs shrink-0 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Ambiti di intervento</span>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Filtra ambiti..." value={tagQuery} onChange={(e) => setTagQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-base sm:text-xs font-medium outline-none focus:border-slate-900"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {filteredTags.map((tag) => {
                      const active = formData.tags.includes(tag.id)
                      return (
                        <button
                          key={tag.id} type="button" onClick={() => { toggleTag(tag.id); setTagQuery(''); }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200/60 mt-2 shrink-0">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-2xl bg-white border border-slate-200 text-slate-700 py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-100 active:scale-95">Indietro</button>
                <button type="button" disabled={!isStep2Valid} onClick={() => setStep(3)} className="w-2/3 rounded-2xl bg-slate-950 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-200 shadow-sm text-center">Ultimo Step</button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DICH. SOSTITUTIVA ART. 494 C.P. ================= */}
          {step === 3 && (
            <div className="flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">Responsabilità Legale</h2>
                <p className="text-sm text-slate-500 font-normal">Identificati come Referente Ufficiale per attivare il profilo in modalità Sandbox.</p>
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <input 
                    type="text" placeholder="Tuo Nome *" value={formData.referente_progetto_nome} onChange={(e) => setFormData(p => ({...p, referente_progetto_nome: e.target.value}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none focus:border-slate-900 shadow-xs" required 
                  />
                  <input 
                    type="text" placeholder="Tuo Cognome *" value={formData.referente_progetto_cognome} onChange={(e) => setFormData(p => ({...p, referente_progetto_cognome: e.target.value}))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none focus:border-slate-900 shadow-xs" required 
                  />
                </div>
                <input 
                  type="text" placeholder="Ruolo in Associazione (es. Presidente, Delegato) *" value={formData.referente_progetto_ruolo} onChange={(e) => setFormData(p => ({...p, referente_progetto_ruolo: e.target.value}))} 
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium outline-none focus:border-slate-900 shadow-xs" required 
                />

                <div className="space-y-3 pt-3 border-t border-slate-200/60 mt-1 shrink-0">
                  <label className="flex items-start gap-3 cursor-pointer select-none p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                    <input 
                      type="checkbox" checked={formData.dichiarazione_legale} onChange={(e) => setFormData(p => ({...p, dichiarazione_legale: e.target.checked}))} 
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-md border-amber-400 accent-amber-600" required 
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Dichiarazione Sostitutiva (DPR 445/2000) *</span>
                      <span className="text-[11px] text-amber-800 font-normal leading-tight">
                        Dichiaro sotto la mia personale responsabilità, <strong>ai sensi dell'Art. 494 C.P. (Sostituzione di persona)</strong>, di essere il Legale Rappresentante o un soggetto ufficialmente delegato all'amministrazione di questo Ente. Sono consapevole che dichiarazioni mendaci comportano responsabilità penali.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none px-2">
                    <input type="checkbox" checked={formData.consenso_privacy} onChange={(e) => setFormData(p => ({...p, consenso_privacy: e.target.checked}))} className="mt-0.5 h-4 w-4 shrink-0 rounded-md border-slate-300 accent-slate-950" required />
                    <span className="text-xs text-slate-600 font-normal leading-tight">Accetto i Termini di Servizio e l'Informativa Privacy (GDPR). *</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200/60 mt-2 shrink-0">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 rounded-2xl bg-white border border-slate-200 text-slate-700 py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-100 active:scale-95">Indietro</button>
                <button 
                  type="submit" disabled={isSubmitting || !isStep3Valid} 
                  className="w-2/3 rounded-2xl bg-slate-950 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span>Attiva Sandbox Mappa</span>}
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
      <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center bg-slate-50/50">
        <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AssociazioneWizardForm />
    </Suspense>
  )
}