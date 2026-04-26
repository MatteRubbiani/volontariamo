'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
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
  
  const [tagsCatalog, setTagsCatalog] = useState<{id: string, name: string}[]>([])
  const [competenzeCatalog, setCompetenzeCatalog] = useState<{id: string, name: string}[]>([])
  
  const [formData, setFormData] = useState<VolontarioFormState>({
    nome: '', cognome: '', telefono: '', sesso: '', dataNascita: '',
    gradoIstruzione: '', cap: '', cittaResidenza: '', bio: '', tags: [], competenze: []
  })

  // Caricamento Cataloghi (Cause e Competenze)
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

  // Logica CAP -> Città
  const handleCapChange = async (val: string) => {
    const cleanedVal = val.replace(/\D/g, '').slice(0, 5)
    setFormData(prev => ({ ...prev, cap: cleanedVal }))

    if (cleanedVal.length === 5) {
      setIsFetchingCity(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanedVal}&country=italy&format=json&addressdetails=1`)
        const data = await res.json()
        if (data?.[0]?.address) {
          const addr = data[0].address
          const cityName = addr.city || addr.town || addr.village || addr.municipality || ''
          if (cityName) setFormData(prev => ({ ...prev, cittaResidenza: cityName }))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsFetchingCity(false)
      }
    }
  }

  // Toggle per Tag e Competenze
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
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Onboarding Volontario • Step {step} / 2</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 🚨 IL TRUCCO È QUI: Creiamo il FormData manualmente dallo stato! */}
        <form action={async () => {
            setIsSubmitting(true)
            
            const payload = new FormData()
            payload.append('role', 'volontario')
            payload.append('redirectTo', redirectTo)
            
            Object.entries(formData).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(v => payload.append(key, v))
              } else {
                payload.append(key, value as string)
              }
            })

            await completeOnboarding(payload)
        }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Dati anagrafici</h2>
                <p className="mt-2 text-slate-600">Inserisci i tuoi dati principali per iniziare.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" name="nome" placeholder="Nome *" value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" required />
                <input type="text" name="cognome" placeholder="Cognome *" value={formData.cognome} onChange={(e) => setFormData(p => ({ ...p, cognome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" required />
                <input type="tel" name="telefono" placeholder="Telefono" value={formData.telefono} onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                <select name="sesso" value={formData.sesso} onChange={(e) => setFormData(p => ({ ...p, sesso: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white">
                  <option value="">Genere</option>
                  <option value="M">Maschio</option>
                  <option value="F">Femmina</option>
                  <option value="Altro">Altro / Preferisco non dirlo</option>
                </select>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Data di Nascita</label>
                  <input type="date" name="dataNascita" value={formData.dataNascita} onChange={(e) => setFormData(p => ({ ...p, dataNascita: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <select name="gradoIstruzione" value={formData.gradoIstruzione} onChange={(e) => setFormData(p => ({ ...p, gradoIstruzione: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white mt-auto">
                  <option value="">Grado di Istruzione</option>
                  <option value="Scuola Media">Scuola Media</option>
                  <option value="Diploma">Diploma Superiore</option>
                  <option value="Laurea Triennale">Laurea Triennale</option>
                  <option value="Laurea Magistrale">Laurea Magistrale</option>
                  <option value="Master / Dottorato">Master / Dottorato</option>
                </select>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-100">
                  <div className="relative">
                    <input type="text" name="cap" placeholder="CAP (Es. 20100) *" value={formData.cap} onChange={(e) => handleCapChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" maxLength={5} required />
                    {isFetchingCity && <span className="absolute right-4 top-3.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>}
                  </div>
                  <input type="text" name="cittaResidenza" placeholder="Città di Residenza" value={formData.cittaResidenza} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-medium outline-none text-slate-600" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => router.push('/app/onboarding')} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">Cambia Ruolo</button>
                <button type="button" onClick={() => setStep(2)} disabled={!canGoNext} className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white transition-all hover:bg-slate-800 disabled:bg-slate-300">Continua</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Il tuo profilo pubblico</h2>
                <p className="mt-2 text-slate-600">Completa le informazioni per farti conoscere dalle associazioni.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Raccontaci qualcosa di te (Bio)</label>
                <textarea name="bio" placeholder="Scrivi qui una breve presentazione..." value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
              
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cause di interesse (tags)</p>
                <div className="flex flex-wrap gap-3">
                  {tagsCatalog.map((tag) => {
                    const active = formData.tags.includes(tag.id)
                    return (
                      <button key={tag.id} type="button" onClick={() => toggleMulti('tags', tag.id)} className={`rounded-xl transition-all duration-200 ${active ? 'scale-105 ring-2 ring-blue-500 ring-offset-2 opacity-100' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>
                        <TagBadge nome={tag.name} size="md" />
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Le tue Competenze</p>
                <div className="flex flex-wrap gap-3">
                  {competenzeCatalog.map((comp) => {
                    const active = formData.competenze.includes(comp.id)
                    return (
                      <button key={comp.id} type="button" onClick={() => toggleMulti('competenze', comp.id)} className={`rounded-lg transition-all duration-200 ${active ? 'scale-105 ring-2 ring-slate-800 ring-offset-2 opacity-100' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>
                        <CompetenzaBadge nome={comp.name} />
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">Indietro</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 rounded-xl bg-blue-600 py-3 font-black text-white transition-all hover:bg-blue-700 disabled:bg-slate-300">
                  {isSubmitting ? 'Salvataggio...' : 'Completa Profilo'}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  )
}

export default function VolontarioWizard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span></div>}>
      <VolontarioWizardForm />
    </Suspense>
  )
}