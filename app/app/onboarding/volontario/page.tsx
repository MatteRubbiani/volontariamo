'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

type VolontarioFormState = {
  nome: string; cognome: string; telefono: string; sesso: string;
  dataNascita: string; gradoIstruzione: string; cap: string;
  cittaResidenza: string; bio: string; tags: string[]; competenze: string[];
}

function VolontarioWizardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isFetchingCity, setIsFetchingCity] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  const [tagsCatalog, setTagsCatalog] = useState<{id: string, name: string}[]>([])
  const [competenzeCatalog, setCompetenzeCatalog] = useState<{id: string, name: string}[]>([])
  
  // Ref per centrare l'input quando si apre la tendina
  const cityFieldWrapperRef = useRef<HTMLDivElement | null>(null)
  
  const [formData, setFormData] = useState<VolontarioFormState>({
    nome: '', cognome: '', telefono: '', sesso: '', dataNascita: '',
    gradoIstruzione: '', cap: '', cittaResidenza: '', bio: '', tags: [], competenze: []
  })

  useEffect(() => {
    async function loadCatalogs() {
      const [tagsRes, compRes] = await Promise.all([
        supabase.from('tags').select('id,name').order('name'),
        supabase.from('competenze').select('id,name').eq('is_official', true).order('name'),
      ])

      if (tagsRes.data) setTagsCatalog(tagsRes.data)
      if (compRes.data) setCompetenzeCatalog(compRes.data)
    }
    loadCatalogs()
  }, [supabase])

  // L'auto-scroll elegante (unica cosa buona suggerita dal bot)
  useEffect(() => {
    if (!showCityDropdown) return

    const scrollToCityField = setTimeout(() => {
      cityFieldWrapperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)

    return () => clearTimeout(scrollToCityField)
  }, [showCityDropdown])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    
    let formatted = val
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    
    setFormData(p => ({ ...p, dataNascita: formatted }))
  }

  const handleCapChange = async (val: string) => {
    const cleanedVal = val.replace(/\D/g, '').slice(0, 5)
    setFormData(prev => ({ ...prev, cap: cleanedVal }))

    if (cleanedVal.length === 5) {
      setIsFetchingCity(true)
      setCitySuggestions([]) 
      setShowCityDropdown(false)
      
      try {
        const resZip = await fetch(`https://api.zippopotam.us/it/${cleanedVal}`)
        
        if (resZip.ok) {
          const data = await resZip.json()
          if (data && data.places && data.places.length > 0) {
            const allCities = data.places.map((p: any) => p['place name'])
            setFormData(prev => ({ ...prev, cittaResidenza: allCities[0] }))
            
            if (allCities.length > 1) {
              setCitySuggestions(allCities)
              setShowCityDropdown(true)
            }
            return
          }
        }

        const resOsm = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanedVal}&country=italy&format=json&addressdetails=1`)
        
        if (resOsm.ok) {
          const dataOsm = await resOsm.json()
          if (dataOsm && dataOsm.length > 0 && dataOsm[0].address) {
            const addr = dataOsm[0].address
            const cityName = addr.city || addr.town || addr.village || addr.municipality || ''
            
            if (cityName) {
              setFormData(prev => ({ ...prev, cittaResidenza: cityName }))
              return
            }
          }
        }

        setFormData(prev => ({ ...prev, cittaResidenza: '' }))

      } catch (err) {
        console.error("Errore recupero CAP:", err)
        setFormData(prev => ({ ...prev, cittaResidenza: '' }))
      } finally {
        setIsFetchingCity(false)
      }
    } else {
      setCitySuggestions([]) 
      setShowCityDropdown(false)
    }
  }

  const toggleMulti = (field: 'tags' | 'competenze', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id) 
        ? prev[field].filter(item => item !== id) 
        : [...prev[field], id]
    }))
  }

  const canGoNext = formData.nome.trim().length > 1 && formData.cognome.trim().length > 1 && formData.cap.length === 5;
  const progress = (step / 2) * 100

  return (
    // 🚨 1. IL BLOCCO TOTALE: h-[calc...] fisso e overflow-hidden. Niente scroll di pagina.
    <main className="h-[calc(100dvh-5rem)] bg-slate-50 flex flex-col overflow-hidden">
      
      {/* 🚨 2. L'INTESTAZIONE FISSA: Non scorre mai, resta sempre visibile sotto la navbar */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 shrink-0">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Onboarding Volontario • Step {step} / 2</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 🚨 3. IL FORM SCROLLABILE: Solo questo div ha il permesso di scorrere (overflow-y-auto) */}
      <div className="flex-1 overflow-y-auto w-full px-4 pb-12">
        <section className="w-full max-w-4xl mx-auto pb-48">
          <form action={async () => {
              setIsSubmitting(true)
              
              const payload = new FormData()
              payload.append('role', 'volontario')
              payload.append('redirectTo', redirectTo)
              
              Object.entries(formData).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                  value.forEach(v => payload.append(key, v))
                } else {
                  if (key === 'dataNascita' && value.length === 10) {
                    const [dd, mm, yyyy] = (value as string).split('/')
                    payload.append(key, `${yyyy}-${mm}-${dd}`)
                  } else {
                    payload.append(key, value as string)
                  }
                }
              })

              await completeOnboarding(payload)
          }} className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Dati anagrafici</h2>
                  <p className="mt-2 text-slate-600">Inserisci i tuoi dati principali per iniziare.</p>
                </div>

                <div className="flex flex-col gap-8">
                  {/* Gruppo Nome & Cognome */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Nome *</label>
                      <input type="text" name="nome" value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Cognome *</label>
                      <input type="text" name="cognome" value={formData.cognome} onChange={(e) => setFormData(p => ({ ...p, cognome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600" required />
                    </div>
                  </div>

                  {/* Gruppo Genere & Data di Nascita */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Genere</label>
                      <div className="flex gap-2 h-[54px]">
                        {[
                          { id: 'M', label: 'Uomo' },
                          { id: 'F', label: 'Donna' },
                          { id: 'Altro', label: 'Altro' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, sesso: opt.id }))}
                            className={`flex-1 rounded-xl border text-sm font-bold transition-all ${
                              formData.sesso === opt.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Data di Nascita</label>
                      <input 
                        type="text" 
                        placeholder="GG/MM/AAAA" 
                        value={formData.dataNascita} 
                        onChange={handleDateChange} 
                        className="w-full h-[54px] rounded-xl border border-slate-200 bg-white px-4 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-700" 
                      />
                    </div>
                  </div>

                  {/* Gruppo Istruzione */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Grado di Istruzione</label>
                    <div className="flex flex-wrap gap-2.5">
                      {['Scuola Media', 'Diploma', 'Laurea Triennale', 'Laurea Magistrale', 'Master / Dottorato'].map((livello) => (
                        <button
                          key={livello}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, gradoIstruzione: livello }))}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                            formData.gradoIstruzione === livello
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {livello}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-100 my-1" />

                  {/* Gruppo Contatti & Posizione */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Telefono</label>
                      <input type="tel" name="telefono" value={formData.telefono} onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600" />
                    </div>
                    
                    <div ref={cityFieldWrapperRef} className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">CAP *</label>
                      <input type="text" name="cap" placeholder="Es. 20100" value={formData.cap} onChange={(e) => handleCapChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600" maxLength={5} required />
                      {isFetchingCity && <span className="absolute right-4 top-10 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>}
                    </div>
                    
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Città</label>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          name="cittaResidenza" 
                          value={formData.cittaResidenza} 
                          onChange={(e) => setFormData(p => ({ ...p, cittaResidenza: e.target.value }))}
                          onClick={() => citySuggestions.length > 1 && setShowCityDropdown(true)}
                          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 ${citySuggestions.length > 1 ? 'pr-10' : ''}`} 
                          placeholder="Es. Milano" 
                          autoComplete="off"
                        />
                        
                        {citySuggestions.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setShowCityDropdown(!showCityDropdown)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${showCityDropdown ? 'rotate-180' : ''}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {showCityDropdown && citySuggestions.length > 1 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)}></div>
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="bg-slate-50/90 px-4 py-2 border-b border-slate-100 backdrop-blur-sm">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Scegli il comune corretto</span>
                            </div>
                            <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
                              {citySuggestions.map((city, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormData(p => ({ ...p, cittaResidenza: city }))
                                    setShowCityDropdown(false)
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                                    formData.cittaResidenza === city 
                                      ? 'bg-blue-50 text-blue-700' 
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => router.push('/app/onboarding')} className="w-1/3 rounded-xl bg-slate-100 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-200">Indietro</button>
                  <button type="button" onClick={() => setStep(2)} disabled={!canGoNext} className="w-2/3 rounded-xl bg-slate-900 py-3.5 font-black text-white transition-all hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 shadow-md">Continua</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Il tuo profilo pubblico</h2>
                  <p className="mt-2 text-slate-600">Completa le informazioni per farti conoscere dalle associazioni.</p>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Raccontaci qualcosa di te (Bio)</label>
                  <textarea name="bio" placeholder="Scrivi qui una breve presentazione..." value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="w-full h-28 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none" />
                </div>
                
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Cause di interesse (Tags)</p>
                  <div className="flex flex-wrap gap-2.5">
                    {tagsCatalog.map((tag) => {
                      const active = formData.tags.includes(tag.id)
                      return (
                        <button key={tag.id} type="button" onClick={() => toggleMulti('tags', tag.id)} className={`rounded-xl transition-all duration-200 ${active ? 'scale-105 ring-2 ring-blue-500 ring-offset-2 opacity-100 shadow-sm' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                          <TagBadge nome={tag.name} size="md" />
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="space-y-2.5 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Le tue Competenze</p>
                  <div className="flex flex-wrap gap-2.5">
                    {competenzeCatalog.map((comp) => {
                      const active = formData.competenze.includes(comp.id)
                      return (
                        <button key={comp.id} type="button" onClick={() => toggleMulti('competenze', comp.id)} className={`rounded-lg transition-all duration-200 ${active ? 'scale-105 ring-2 ring-slate-800 ring-offset-2 opacity-100 shadow-sm' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                          <CompetenzaBadge nome={comp.name} />
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-4">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-200">Indietro</button>
                  <button type="submit" disabled={isSubmitting} className="w-2/3 rounded-xl bg-blue-600 py-3.5 font-black text-white transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 shadow-md">
                    {isSubmitting ? 'Salvataggio...' : 'Completa Profilo'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}

export default function VolontarioWizard() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-slate-50"><span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span></div>}>
      <VolontarioWizardForm />
    </Suspense>
  )
}