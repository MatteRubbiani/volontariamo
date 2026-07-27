'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'

type VolontarioFormState = {
  nome: string;
  cognome: string;
  cap: string;
  cittaResidenza: string;
  tags: string[];
  competenze: string[];
  telefono: string; sesso: string; dataNascita: string; gradoIstruzione: string; bio: string;
}

function VolontarioWizardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCity, setIsFetchingCity] = useState(false)
  
  const [tagsCatalog, setTagsCatalog] = useState<{id: string, name: string}[]>([])
  const [competenzeCatalog, setCompetenzeCatalog] = useState<{id: string, name: string}[]>([])
  
  const [activeSection, setActiveSection] = useState<'cause' | 'competenze'>('cause')
  
  const [tagQuery, setTagQuery] = useState('')
  const [compQuery, setCompQuery] = useState('')
  
  const [formData, setFormData] = useState<VolontarioFormState>({
    nome: '', cognome: '', cap: '', cittaResidenza: '', tags: [], competenze: [],
    telefono: '', sesso: '', dataNascita: '', gradoIstruzione: '', bio: ''
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

  const handleCapChange = async (val: string) => {
    const cleanedVal = val.replace(/\D/g, '').slice(0, 5)
    setFormData(prev => ({ ...prev, cap: cleanedVal }))

    if (cleanedVal.length === 5) {
      setIsFetchingCity(true)
      try {
        const resZip = await fetch(`https://api.zippopotam.us/it/${cleanedVal}`)
        if (resZip.ok) {
          const data = await resZip.json()
          if (data && data.places && data.places.length > 0) {
            setFormData(prev => ({ ...prev, cittaResidenza: data.places[0]['place name'] }))
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
        console.error(err)
        setFormData(prev => ({ ...prev, cittaResidenza: '' }))
      } finally {
        setIsFetchingCity(false)
      }
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

  const filteredTags = useMemo(() => {
    if (!tagQuery.trim()) return tagsCatalog.slice(0, 6)
    return tagsCatalog.filter(t => t.name.toLowerCase().includes(tagQuery.toLowerCase()))
  }, [tagsCatalog, tagQuery])

  const filteredCompetenze = useMemo(() => {
    if (!compQuery.trim()) return competenzeCatalog.slice(0, 6)
    return competenzeCatalog.filter(c => c.name.toLowerCase().includes(compQuery.toLowerCase()))
  }, [competenzeCatalog, compQuery])

  const selectedTagsDetails = useMemo(() => tagsCatalog.filter(t => formData.tags.includes(t.id)), [tagsCatalog, formData.tags])
  const selectedCompetenzeDetails = useMemo(() => competenzeCatalog.filter(c => formData.competenze.includes(c.id)), [competenzeCatalog, formData.competenze])

  const canGoNext = formData.nome.trim().length > 1 && formData.cognome.trim().length > 1 && formData.cap.length === 5 && formData.cittaResidenza.length > 0;
  const progress = (step / 2) * 100

  return (
    // 🟢 'min-h' flessibile e 'pb-28' da mobile per evitare il blocco sotto la BottomNav
    <main className="min-h-[calc(100dvh-3.5rem)] w-full bg-slate-50/50 flex flex-col justify-start pt-6 md:pt-12 pb-28 md:pb-12 items-center overflow-y-auto font-sans antialiased selection:bg-slate-100">
      <div className="max-w-[480px] w-full flex flex-col px-4 sm:px-6">
        
        {/* PROGRESS BAR */}
        <div className="mb-6 md:mb-8 shrink-0">
          <div className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Registrazione Volontario</span>
            <span className="text-slate-900 font-extrabold">Fase {step} di 2</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div className="h-full bg-slate-950 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form declare-action="true" action={async () => {
            setIsSubmitting(true)
            const payload = new FormData()
            payload.append('role', 'volontario')
            payload.append('redirectTo', redirectTo)
            Object.entries(formData).forEach(([key, value]) => {
              if (Array.isArray(value)) value.forEach(v => payload.append(key, v))
              else payload.append(key, value as string)
            })
            await completeOnboarding(payload)
        }} className="flex flex-col gap-6 w-full">
          
          {/* ==========================================
              STEP 1: ANAGRAFICA CORE
             ========================================== */}
          {step === 1 && (
            <div className="flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">Come ti chiami?</h1>
                <p className="text-sm text-slate-500 font-normal">Inserisci i tuoi dati personali per attivare il profilo.</p>
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* ⚡ 'text-base sm:text-sm' previene l'auto-zoom di iOS/Safari */}
                  <input 
                    type="text" 
                    placeholder="Nome *" 
                    value={formData.nome} 
                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 shadow-xs" 
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="Cognome *" 
                    value={formData.cognome} 
                    onChange={(e) => setFormData(p => ({ ...p, cognome: e.target.value }))} 
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 shadow-xs" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-slate-200/60 mt-1">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="CAP *" 
                      value={formData.cap} 
                      onChange={(e) => handleCapChange(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 shadow-xs" 
                      maxLength={5} 
                      required 
                    />
                    {isFetchingCity && <span className="absolute right-3.5 top-4 w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>}
                  </div>
                  <input 
                    type="text" 
                    readOnly 
                    placeholder="Città" 
                    value={formData.cittaResidenza} 
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-100/70 px-4 py-3.5 text-base sm:text-sm font-semibold text-slate-700 outline-none cursor-not-allowed" 
                  />
                </div>
              </div>

              <button 
                type="button" 
                disabled={!canGoNext} 
                onClick={() => setStep(2)} 
                className="w-full rounded-2xl bg-slate-950 text-white py-4 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 mt-2 shadow-sm"
              >
                Scegli Interessi e Cause
              </button>
            </div>
          )}

          {/* ==========================================
              STEP 2: CAUSE E COMPETENZE
             ========================================== */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="space-y-1.5 shrink-0">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">Cosa ti appassiona?</h2>
                <p className="text-sm text-slate-500 font-normal">Personalizza le cause e le tue competenze principali.</p>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                
                {/* 🟢 SEZIONE 1: LE CAUSE */}
                <div 
                  onClick={() => activeSection !== 'cause' && setActiveSection('cause')}
                  className={`border rounded-[1.75rem] p-4 sm:p-5 transition-all duration-300 cursor-pointer ${
                    activeSection === 'cause' 
                      ? 'border-slate-900 bg-white shadow-md' 
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Cause e Ambiti</span>
                    {activeSection !== 'cause' && (
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                        {selectedTagsDetails.length} {selectedTagsDetails.length === 1 ? 'scelta' : 'scelte'}
                      </span>
                    )}
                  </div>

                  {activeSection === 'cause' ? (
                    <div className="space-y-3 mt-3 animate-in fade-in duration-300">
                      <div className="relative">
                        {/* ⚡ 'text-base sm:text-xs' evita lo zoom su Safari */}
                        <input 
                          type="text" 
                          placeholder="Cerca causa..." 
                          value={tagQuery} 
                          onChange={(e) => setTagQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-base sm:text-xs font-medium outline-none transition-colors focus:border-slate-900"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-0.5">
                        {filteredTags.map((tag) => {
                          const active = formData.tags.includes(tag.id)
                          return (
                            <button
                              key={tag.id} 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); toggleMulti('tags', tag.id); setTagQuery(''); }}
                              className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold truncate flex items-center gap-2 transition-all active:scale-95 ${
                                active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                              <span className="truncate">{tag.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">
                      {selectedTagsDetails.length > 0 ? selectedTagsDetails.map(t => t.name).join(', ') : 'Nessuna causa selezionata'}
                    </p>
                  )}
                </div>

                {/* 🟢 SEZIONE 2: LE COMPETENZE */}
                <div 
                  onClick={() => activeSection !== 'competenze' && setActiveSection('competenze')}
                  className={`border rounded-[1.75rem] p-4 sm:p-5 transition-all duration-300 cursor-pointer ${
                    activeSection === 'competenze' 
                      ? 'border-slate-900 bg-white shadow-md' 
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Le tue Competenze</span>
                    {activeSection !== 'competenze' && (
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                        {selectedCompetenzeDetails.length} {selectedCompetenzeDetails.length === 1 ? 'scelta' : 'scelte'}
                      </span>
                    )}
                  </div>

                  {activeSection === 'competenze' ? (
                    <div className="space-y-3 mt-3 animate-in fade-in duration-300">
                      <div className="relative">
                        {/* ⚡ 'text-base sm:text-xs' evita lo zoom su Safari */}
                        <input 
                          type="text" 
                          placeholder="Cerca competenza..." 
                          value={compQuery} 
                          onChange={(e) => setCompQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-base sm:text-xs font-medium outline-none transition-colors focus:border-slate-900"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-0.5">
                        {filteredCompetenze.map((comp) => {
                          const active = formData.competenze.includes(comp.id)
                          return (
                            <button
                              key={comp.id} 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); toggleMulti('competenze', comp.id); setCompQuery(''); }}
                              className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold truncate flex items-center gap-2 transition-all active:scale-95 ${
                                active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                              <span className="truncate">{comp.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">
                      {selectedCompetenzeDetails.length > 0 ? selectedCompetenzeDetails.map(c => c.name).join(', ') : 'Nessuna competenza selezionata'}
                    </p>
                  )}
                </div>

              </div>

              {/* PULSANTI DI AZIONE */}
              <div className="flex gap-3 pt-3 border-t border-slate-200/60 mt-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="w-1/3 rounded-2xl bg-white border border-slate-200 text-slate-700 py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-100 active:scale-95"
                >
                  Indietro
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-2/3 rounded-2xl bg-slate-950 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black active:scale-95 disabled:bg-slate-200 shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Inizia a esplorare</span>
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

export default function VolontarioWizard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center bg-slate-50/50">
        <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VolontarioWizardForm />
    </Suspense>
  )
}