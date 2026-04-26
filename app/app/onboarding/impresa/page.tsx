'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeOnboarding } from '@/app/app/onboarding/actions'

type ImpresaFormState = {
  nome: string; formaGiuridica: string; partitaIva: string;
  codiceFiscale: string; settoreAttivita: string; fasciaDipendenti: string;
  cap: string; citta: string; indirizzoSede: string; nomeReferente: string;
  areaOperativa: string; sitoWeb: string; profiliSocial: string;
  obiettiviEsg: string; valoriCause: string; tipologiaImpatto: string;
}

export default function ImpresaWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCity, setIsFetchingCity] = useState(false)
  
  const [formData, setFormData] = useState<ImpresaFormState>({
    nome: '', formaGiuridica: '', partitaIva: '', codiceFiscale: '',
    settoreAttivita: '', fasciaDipendenti: '', cap: '', citta: '',
    indirizzoSede: '', nomeReferente: '', areaOperativa: '',
    sitoWeb: '', profiliSocial: '', obiettiviEsg: '', valoriCause: '', tipologiaImpatto: ''
  })

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

  const progress = (step / 2) * 100

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Onboarding Impresa • Step {step} / 2</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form action={async (fd) => {
          setIsSubmitting(true)
          fd.append('role', 'impresa')
          fd.append('redirectTo', redirectTo)
          await completeOnboarding(fd)
        }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900">Dati Aziendali</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" name="nome" placeholder="Ragione Sociale *" value={formData.nome} onChange={(e) => setFormData(p => ({...p, nome: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white md:col-span-2" required />
                <input type="text" name="partitaIva" placeholder="Partita IVA" value={formData.partitaIva} onChange={(e) => setFormData(p => ({...p, partitaIva: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
                <select name="fasciaDipendenti" value={formData.fasciaDipendenti} onChange={(e) => setFormData(p => ({...p, fasciaDipendenti: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white">
                  <option value="">Fascia Dipendenti</option>
                  <option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-250">51-250</option><option value="250+">250+</option>
                </select>
                <div className="relative">
                  <input type="text" name="cap" placeholder="CAP *" value={formData.cap} onChange={(e) => handleCapChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" maxLength={5} required />
                  {isFetchingCity && <span className="absolute right-4 top-3.5 w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>}
                </div>
                <input type="text" name="citta" placeholder="Città" value={formData.citta} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-medium outline-none" />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => router.push('/app/onboarding')} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Cambia Ruolo</button>
                <button type="button" onClick={() => setStep(2)} disabled={formData.nome.length < 2 || formData.cap.length !== 5} className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white disabled:bg-slate-300">Continua</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900">Profilo d&apos;Impatto</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" name="nomeReferente" placeholder="Referente Aziendale" value={formData.nomeReferente} onChange={(e) => setFormData(p => ({...p, nomeReferente: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
                <input type="text" name="sitoWeb" placeholder="Sito Web" value={formData.sitoWeb} onChange={(e) => setFormData(p => ({...p, sitoWeb: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
              </div>
              <textarea name="obiettiviEsg" placeholder="Obiettivi ESG..." value={formData.obiettiviEsg} onChange={(e) => setFormData(p => ({...p, obiettiviEsg: e.target.value}))} className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white resize-none" />
              <textarea name="tipologiaImpatto" placeholder="Tipologia di impatto desiderato..." value={formData.tipologiaImpatto} onChange={(e) => setFormData(p => ({...p, tipologiaImpatto: e.target.value}))} className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white resize-none" />
              
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Indietro</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 rounded-xl bg-violet-600 py-3 font-black text-white hover:bg-violet-700">
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