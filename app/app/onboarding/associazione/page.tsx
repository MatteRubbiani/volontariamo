'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'
import TagBadge from '@/components/TagBadge'

type AssociazioneFormState = {
  nome: string; formaGiuridica: string; codiceFiscale: string;
  emailContatto: string; telefono: string; cap: string;
  citta: string; indirizzoSede: string; nomeReferente: string;
  mission: string; tags: string[];
}

function AssociazioneWizardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCity, setIsFetchingCity] = useState(false)
  const [tagsCatalog, setTagsCatalog] = useState<any[]>([])
  
  const [formData, setFormData] = useState<AssociazioneFormState>({
    nome: '', formaGiuridica: '', codiceFiscale: '', emailContatto: '',
    telefono: '', cap: '', citta: '', indirizzoSede: '',
    nomeReferente: '', mission: '', tags: []
  })

  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase.from('tags').select('id,name').order('name')
      if (data) setTagsCatalog(data)
    }
    loadTags()
  }, [supabase])

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
          if (cityName) setFormData(prev => ({ ...prev, citta: cityName }))
        }
      } catch (err) { console.error(err) } finally { setIsFetchingCity(false) }
    }
  }

  const toggleTag = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(id) ? prev.tags.filter(t => t !== id) : [...prev.tags, id]
    }))
  }

  const progress = (step / 2) * 100

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Onboarding Associazione • Step {step} / 2</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form action={async (fd) => {
          setIsSubmitting(true)
          fd.append('role', 'associazione')
          fd.append('redirectTo', redirectTo)
          await completeOnboarding(fd)
        }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900">Dati Associazione</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" name="nome" placeholder="Nome Associazione *" value={formData.nome} onChange={(e) => setFormData(p => ({...p, nome: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" required />
                <select name="formaGiuridica" value={formData.formaGiuridica} onChange={(e) => setFormData(p => ({...p, formaGiuridica: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white">
                  <option value="">Forma Giuridica</option>
                  <option value="APS">APS</option><option value="ODV">ODV</option><option value="ONLUS">ONLUS</option><option value="ETS">ETS</option>
                </select>
                <input type="text" name="codiceFiscale" placeholder="Codice Fiscale / P.IVA" value={formData.codiceFiscale} onChange={(e) => setFormData(p => ({...p, codiceFiscale: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" />
                <input type="email" name="emailContatto" placeholder="Email Pubblica" value={formData.emailContatto} onChange={(e) => setFormData(p => ({...p, emailContatto: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" />
                <div className="relative">
                  <input type="text" name="cap" placeholder="CAP *" value={formData.cap} onChange={(e) => handleCapChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" maxLength={5} required />
                  {isFetchingCity && <span className="absolute right-4 top-3.5 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>}
                </div>
                <input type="text" name="citta" placeholder="Città" value={formData.citta} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-medium outline-none" />
                <input type="text" name="indirizzoSede" placeholder="Indirizzo Sede" value={formData.indirizzoSede} onChange={(e) => setFormData(p => ({...p, indirizzoSede: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white md:col-span-2" />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => router.push('/app/onboarding')} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Cambia Ruolo</button>
                <button type="button" onClick={() => setStep(2)} disabled={formData.nome.length < 2 || formData.cap.length !== 5} className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white disabled:bg-slate-300">Continua</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900">Profilo Pubblico</h2>
              <input type="text" name="nomeReferente" placeholder="Nome Referente" value={formData.nomeReferente} onChange={(e) => setFormData(p => ({...p, nomeReferente: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" />
              <textarea name="mission" placeholder="Mission dell'Associazione..." value={formData.mission} onChange={(e) => setFormData(p => ({...p, mission: e.target.value}))} className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white resize-none" />
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cause trattate</p>
                <div className="flex flex-wrap gap-3">
                  {tagsCatalog.map((tag) => (
                    <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`rounded-xl transition-all ${formData.tags.includes(tag.id) ? 'ring-2 ring-emerald-500 ring-offset-2 scale-105' : 'grayscale opacity-50'}`}>
                      <TagBadge nome={tag.name} size="md" />
                      <input type="hidden" name="tags" value={tag.id} disabled={!formData.tags.includes(tag.id)} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Indietro</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 rounded-xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-700">
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

export default function AssociazioneWizard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    }>
      <AssociazioneWizardForm />
    </Suspense>
  )
}