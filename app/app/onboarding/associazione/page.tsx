'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'
import TagBadge from '@/components/TagBadge'

type AssociazioneFormState = {
  // Tabella: associazioni
  denominazione: string; 
  forma_giuridica: string; 
  codice_fiscale: string;
  email_associazione: string; 
  telefono: string; 
  descrizione: string; 
  
  // Tabella: associazioni_sedi
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;

  // Tabella: associazioni_trasparenza
  referente_progetto_nome: string;
  referente_progetto_cognome: string; // 🔒 NOME E COGNOME SEPARATI
  referente_progetto_ruolo: string;
  dichiarazione_veridicita: boolean;
  consenso_privacy: boolean;
  consenso_newsletter: boolean;

  // Relazioni
  tags: string[];
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
    denominazione: '', forma_giuridica: '', codice_fiscale: '', email_associazione: '',
    telefono: '', cap: '', comune: '', provincia: '', indirizzo: '',
    referente_progetto_nome: '', referente_progetto_cognome: '', referente_progetto_ruolo: '', descrizione: '', 
    dichiarazione_veridicita: false, consenso_privacy: false, 
    consenso_newsletter: false,
    tags: []
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
          const provName = addr.county || addr.state_district || addr.province || ''
          setFormData(prev => ({ 
            ...prev, 
            comune: cityName || prev.comune,
            provincia: provName ? provName.replace('Provincia di ', '').substring(0, 2).toUpperCase() : prev.provincia
          }))
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
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col justify-center">
      <section className="mx-auto w-full max-w-4xl">
        
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Registrazione Ente • Step {step} / 2</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form action={async () => {
          setIsSubmitting(true)
          const payload = new FormData()
          payload.append('role', 'associazione')
          payload.append('redirectTo', redirectTo)
          
          Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => payload.append(key, v))
            } else {
              payload.append(key, String(value))
            }
          })
          await completeOnboarding(payload)
        }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Dati Identificativi</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Informazioni fiscali obbligatorie per l'attivazione.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input 
                  type="text" name="denominazione" placeholder="Denominazione Completa *" 
                  value={formData.denominazione} 
                  onChange={(e) => setFormData(p => ({...p, denominazione: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white md:col-span-2" 
                  required 
                />
                
                <select 
                  name="forma_giuridica" value={formData.forma_giuridica} 
                  onChange={(e) => setFormData(p => ({...p, forma_giuridica: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  required
                >
                  <option value="">Forma Giuridica *</option>
                  <option value="APS">APS - Associazione Promozione Sociale</option>
                  <option value="ODV">ODV - Organizzazione Volontariato</option>
                  <option value="ETS">ETS - Ente Terzo Settore</option>
                  <option value="Altro">Altra Associazione</option>
                </select>

                <input 
                  type="text" name="codice_fiscale" placeholder="Codice Fiscale Ente *" 
                  value={formData.codice_fiscale} 
                  onChange={(e) => setFormData(p => ({...p, codice_fiscale: e.target.value.toUpperCase().replace(/\s/g, '')}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white font-mono" 
                  required 
                />

                <input 
                  type="email" name="email_associazione" placeholder="Email Ufficiale di Contatto *" 
                  value={formData.email_associazione} 
                  onChange={(e) => setFormData(p => ({...p, email_associazione: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" 
                  required
                />

                <input 
                  type="tel" name="telefono" placeholder="Telefono" 
                  value={formData.telefono} 
                  onChange={(e) => setFormData(p => ({...p, telefono: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:bg-white" 
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => router.push('/app/onboarding')} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Cambia Ruolo</button>
                <button 
                  type="button" onClick={() => setStep(2)} 
                  disabled={!formData.denominazione || !formData.codice_fiscale || !formData.email_associazione} 
                  className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white active:scale-95 transition-all disabled:bg-slate-200"
                >
                  Prossimo Step →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900">Sede e Referente</h2>

              <div className="grid gap-3 md:grid-cols-4 bg-slate-50 p-4 rounded-2xl">
                <div className="relative"><input type="text" placeholder="CAP *" value={formData.cap} onChange={(e) => handleCapChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" maxLength={5} required /></div>
                <input type="text" placeholder="Comune *" value={formData.comune} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2 outline-none" readOnly />
                <input type="text" placeholder="Prov." value={formData.provincia} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-center outline-none" readOnly />
                <input type="text" name="indirizzo" placeholder="Indirizzo Sede Operativa *" value={formData.indirizzo} onChange={(e) => setFormData(p => ({...p, indirizzo: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-4 outline-none focus:border-emerald-500" required />
              </div>

              {/* 🔒 GRIGLIA A 3 PER GESTIRE CHIRURGICAMENTE NOME E COGNOME */}
              <div className="grid gap-4 md:grid-cols-3">
                <input 
                  type="text" name="referente_progetto_nome" placeholder="Nome Referente *" 
                  value={formData.referente_progetto_nome} 
                  onChange={(e) => setFormData(p => ({...p, referente_progetto_nome: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white" 
                  required 
                />
                <input 
                  type="text" name="referente_progetto_cognome" placeholder="Cognome Referente *" 
                  value={formData.referente_progetto_cognome} 
                  onChange={(e) => setFormData(p => ({...p, referente_progetto_cognome: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white" 
                  required 
                />
                <input 
                  type="text" name="referente_progetto_ruolo" placeholder="Ruolo (es. Presidente) *" 
                  value={formData.referente_progetto_ruolo} 
                  onChange={(e) => setFormData(p => ({...p, referente_progetto_ruolo: e.target.value}))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white" 
                  required 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.dichiarazione_veridicita} onChange={(e) => setFormData(p => ({...p, dichiarazione_veridicita: e.target.checked}))} className="mt-0.5 shrink-0 rounded text-emerald-600" required />
                  <span className="text-[11px] text-slate-500 leading-tight">Dichiaro che i dati forniti sono veritieri e l'ente opera senza fini di lucro. *</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.consenso_privacy} onChange={(e) => setFormData(p => ({...p, consenso_privacy: e.target.checked}))} className="mt-0.5 shrink-0 rounded text-emerald-600" required />
                  <span className="text-[11px] text-slate-500 leading-tight">Accetto i termini di servizio e il trattamento dei dati personali (GDPR). *</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <input 
                    type="checkbox" 
                    checked={formData.consenso_newsletter} 
                    onChange={(e) => setFormData(p => ({...p, consenso_newsletter: e.target.checked}))} 
                    className="mt-0.5 shrink-0 rounded text-emerald-600"
                  />
                  <span className="text-[11px] text-emerald-800 font-bold leading-tight">
                    Voglio ricevere aggiornamenti, nuovi volontari e consigli per la mia associazione tramite newsletter. (Facoltativo)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">← Indietro</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.referente_progetto_nome || !formData.referente_progetto_cognome || !formData.dichiarazione_veridicita || !formData.consenso_privacy} 
                  className="w-2/3 rounded-xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Inviando...' : 'Attiva Profilo'}
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></span></div>}>
      <AssociazioneWizardForm />
    </Suspense>
  )
}