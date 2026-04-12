'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/app/onboarding/actions'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

type Role = 'volontario' | 'associazione' | 'impresa'

type OnboardingFormProps = {
  redirectTo: string
}

type FormState = {
  nome: string
  cognome: string
  sitoWeb: string
  partitaIva: string
  citta: string
  indirizzoSede: string
  fasciaDipendenti: string
  emailContatto: string
  mission: string
  tags: string[]
  competenze: string[]
  formaGiuridica: string
  codiceFiscale: string
  telefono: string
  nomeReferente: string
  profiliSocial: string
  // NUOVI CAMPI VOLONTARIO (Allineati al DB)
  bio: string
  dataNascita: string
  sesso: string
  cittaResidenza: string
  gradoIstruzione: string
}

type TagRecord = { id: string; name: string }
type CompetenzaRecord = { id: string; name: string }

const roles: { id: Role; title: string; subtitle: string }[] = [
  { id: 'volontario', title: 'Volontario', subtitle: 'Cerco opportunità per candidarmi' },
  { id: 'associazione', title: 'Associazione', subtitle: 'Pubblico posizioni e gestisco candidature' },
  { id: 'impresa', title: 'Impresa', subtitle: 'Creo iniziative di impatto sociale' },
]

export default function OnboardingForm({ redirectTo }: OnboardingFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [role, setRole] = useState<Role>('volontario')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagsCatalog, setTagsCatalog] = useState<TagRecord[]>([])
  const [competenzeCatalog, setCompetenzeCatalog] = useState<CompetenzaRecord[]>([])
  
  const [formData, setFormData] = useState<FormState>({
    nome: '',
    cognome: '',
    sitoWeb: '',
    partitaIva: '',
    citta: '',
    indirizzoSede: '',
    fasciaDipendenti: '',
    emailContatto: '',
    mission: '',
    tags: [],
    competenze: [],
    formaGiuridica: '',
    codiceFiscale: '',
    telefono: '',
    nomeReferente: '',
    profiliSocial: '',
    bio: '',
    dataNascita: '',
    sesso: '',
    cittaResidenza: '',
    gradoIstruzione: ''
  })

  useEffect(() => {
    async function loadCatalogs() {
      const [tagsRes, compRes] = await Promise.all([
        supabase.from('tags').select('id,name').order('name'),
        supabase.from('competenze').select('id,name').eq('is_official', true).order('name'),
      ])

      if (tagsRes.data) setTagsCatalog(tagsRes.data as TagRecord[])
      if (compRes.data) setCompetenzeCatalog(compRes.data as CompetenzaRecord[])
    }

    loadCatalogs()
  }, [supabase])

  const selectedRole = roles.find((r) => r.id === role)!
  const progress = (step / 3) * 100

  function toggleMulti(field: 'tags' | 'competenze', value: string) {
    setFormData((prev) => {
      const exists = prev[field].includes(value)
      return {
        ...prev,
        [field]: exists ? prev[field].filter((v) => v !== value) : [...prev[field], value],
      }
    })
  }

  // VALIDAZIONE: Per il volontario ora chiediamo almeno Nome e Cognome per proseguire
  const canGoStep3 = role === 'volontario' 
    ? formData.nome.trim().length > 1 && formData.cognome.trim().length > 1
    : formData.nome.trim().length > 1;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Onboarding</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {step} / 3</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form
          action={async (fd) => {
            setIsSubmitting(true)
            try {
              // Refresh client-side per il sync istantaneo della Navbar
              router.refresh()
              await completeOnboarding(fd)
            } catch (error: any) {
              if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
                throw error;
              }
              console.error("Errore salvataggio:", error)
              setIsSubmitting(false)
              alert("Errore durante il salvataggio. Riprova.")
            }
          }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10"
        >
          {/* CAMPI NASCOSTI AGGIORNATI PER VOLONTARIO */}
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="nome" value={formData.nome} />
          <input type="hidden" name="cognome" value={formData.cognome} />
          <input type="hidden" name="telefono" value={formData.telefono} />
          <input type="hidden" name="bio" value={formData.bio} />
          <input type="hidden" name="dataNascita" value={formData.dataNascita} />
          <input type="hidden" name="sesso" value={formData.sesso} />
          <input type="hidden" name="cittaResidenza" value={formData.cittaResidenza} />
          <input type="hidden" name="gradoIstruzione" value={formData.gradoIstruzione} />
          
          {/* CAMPI ALTRI RUOLI */}
          <input type="hidden" name="sitoWeb" value={formData.sitoWeb} />
          <input type="hidden" name="partitaIva" value={formData.partitaIva} />
          <input type="hidden" name="citta" value={formData.citta} />
          <input type="hidden" name="indirizzoSede" value={formData.indirizzoSede} />
          <input type="hidden" name="fasciaDipendenti" value={formData.fasciaDipendenti} />
          <input type="hidden" name="emailContatto" value={formData.emailContatto} />
          <input type="hidden" name="mission" value={formData.mission} />
          <input type="hidden" name="formaGiuridica" value={formData.formaGiuridica} />
          <input type="hidden" name="codiceFiscale" value={formData.codiceFiscale} />
          <input type="hidden" name="nomeReferente" value={formData.nomeReferente} />
          <input type="hidden" name="profiliSocial" value={formData.profiliSocial} />
          
          {formData.tags.map((tagId) => (
            <input key={`tag-${tagId}`} type="hidden" name="tags" value={tagId} />
          ))}
          {formData.competenze.map((competenzaId) => (
            <input key={`comp-${competenzaId}`} type="hidden" name="competenze" value={competenzaId} />
          ))}

          {/* STEP 1: SCELTA RUOLO */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Scegli il tuo ruolo</h1>
                <p className="mt-2 text-slate-600">Definisci il tuo percorso nella piattaforma.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {roles.map((item) => {
                  const active = role === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setRole(item.id)
                        setStep(2)
                      }}
                      className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                        active ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-[1.02]' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.id}</p>
                      <h2 className="mt-2 text-xl font-black">{item.title}</h2>
                      <p className="mt-2 text-sm opacity-80">{item.subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: DATI ANAGRAFICI */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Dati personali</h2>
                <p className="mt-2 text-slate-600">Raccontaci chi sei per personalizzare la tua esperienza.</p>
              </div>

              {role === 'volontario' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="text" placeholder="Nome *" value={formData.nome} onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                  <input type="text" placeholder="Cognome *" value={formData.cognome} onChange={(e) => setFormData((prev) => ({ ...prev, cognome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                  
                  <input type="tel" placeholder="Telefono" value={formData.telefono} onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                  
                  <select value={formData.sesso} onChange={(e) => setFormData((prev) => ({ ...prev, sesso: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white">
                    <option value="">Genere</option>
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                    <option value="Altro">Altro / Preferisco non dirlo</option>
                  </select>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Data di Nascita</label>
                    <input type="date" value={formData.dataNascita} onChange={(e) => setFormData((prev) => ({ ...prev, dataNascita: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white" />
                  </div>

                  <input type="text" placeholder="Città di Residenza" value={formData.cittaResidenza} onChange={(e) => setFormData((prev) => ({ ...prev, cittaResidenza: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white mt-auto" />

                  <select value={formData.gradoIstruzione} onChange={(e) => setFormData((prev) => ({ ...prev, gradoIstruzione: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white md:col-span-2">
                    <option value="">Grado di Istruzione</option>
                    <option value="Scuola Media">Scuola Media</option>
                    <option value="Diploma">Diploma Superiore</option>
                    <option value="Laurea Triennale">Laurea Triennale</option>
                    <option value="Laurea Magistrale">Laurea Magistrale</option>
                    <option value="Master / Dottorato">Master / Dottorato</option>
                  </select>
                </div>
              )}

              {/* ... (Codice per Associazione e Impresa rimane invariato) ... */}
              {role === 'associazione' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="text" placeholder="Nome Associazione *" value={formData.nome} onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white" />
                  <select value={formData.formaGiuridica} onChange={(e) => setFormData((prev) => ({ ...prev, formaGiuridica: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white"><option value="">Forma Giuridica (Opzionale)</option><option value="APS">APS</option><option value="ODV">ODV</option><option value="ONLUS">ONLUS</option><option value="ETS">ETS</option></select>
                  <input type="text" placeholder="Codice Fiscale / P.IVA" value={formData.codiceFiscale} onChange={(e) => setFormData((prev) => ({ ...prev, codiceFiscale: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white" />
                  <input type="text" placeholder="Email Pubblica" value={formData.emailContatto} onChange={(e) => setFormData((prev) => ({ ...prev, emailContatto: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white" />
                  <input type="text" placeholder="Città" value={formData.citta} onChange={(e) => setFormData((prev) => ({ ...prev, citta: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white" />
                  <input type="text" placeholder="Indirizzo Sede" value={formData.indirizzoSede} onChange={(e) => setFormData((prev) => ({ ...prev, indirizzoSede: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white" />
                  <input type="text" placeholder="Telefono" value={formData.telefono} onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white md:col-span-2" />
                </div>
              )}

              {role === 'impresa' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="text" placeholder="Ragione Sociale *" value={formData.nome} onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
                  <input type="text" placeholder="Partita IVA" value={formData.partitaIva} onChange={(e) => setFormData((prev) => ({ ...prev, partitaIva: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
                  <input type="text" placeholder="Città" value={formData.citta} onChange={(e) => setFormData((prev) => ({ ...prev, citta: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white" />
                  <select value={formData.fasciaDipendenti} onChange={(e) => setFormData((prev) => ({ ...prev, fasciaDipendenti: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white md:col-span-2"><option value="">Grandezza...</option><option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-250">51-250</option><option value="250+">250+</option></select>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={(e) => { e.preventDefault(); setStep(1); }} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">Indietro</button>
                <button type="button" onClick={(e) => { e.preventDefault(); setStep(3); }} disabled={!canGoStep3} className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white transition-all hover:bg-slate-800 disabled:bg-slate-300">Continua</button>
              </div>
            </div>
          )}

          {/* STEP 3: BIO, INTERESSI E COMPETENZE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Il tuo profilo pubblico</h2>
                <p className="mt-2 text-slate-600">Completa le informazioni per farti conoscere.</p>
              </div>

              {role === 'volontario' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Raccontaci qualcosa di te (Bio)</label>
                    <textarea 
                      placeholder="Scrivi qui una breve presentazione..." 
                      value={formData.bio} 
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} 
                      className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white resize-none"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cause di interesse (tags)</p>
                    <div className="flex flex-wrap gap-3">
                      {tagsCatalog.map((tag) => {
                        const active = formData.tags.includes(tag.id)
                        return (
                          <button key={tag.id} type="button" onClick={(e) => { e.preventDefault(); toggleMulti('tags', tag.id); }} className={`rounded-xl transition-all duration-200 ${active ? 'scale-105 ring-2 ring-blue-500 ring-offset-2 opacity-100' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>
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
                          <button key={comp.id} type="button" onClick={(e) => { e.preventDefault(); toggleMulti('competenze', comp.id); }} className={`rounded-lg transition-all duration-200 ${active ? 'scale-105 ring-2 ring-slate-800 ring-offset-2 opacity-100' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>
                            <CompetenzaBadge nome={comp.name} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ... (Codice per Associazione e Impresa rimane invariato) ... */}
              {role === 'associazione' && (
                <>
                  <input type="text" placeholder="Nome Referente" value={formData.nomeReferente} onChange={(e) => setFormData((prev) => ({ ...prev, nomeReferente: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white mb-4" />
                  <textarea value={formData.mission} onChange={(e) => setFormData((prev) => ({ ...prev, mission: e.target.value }))} placeholder="Mission..." className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-green-500 focus:bg-white resize-none" />
                  <div className="pt-4 flex flex-wrap gap-3">{tagsCatalog.map((tag) => { const active = formData.tags.includes(tag.id); return (<button key={tag.id} type="button" onClick={(e) => { e.preventDefault(); toggleMulti('tags', tag.id); }} className={`rounded-xl transition-all ${active ? 'ring-2 ring-emerald-500 ring-offset-2' : 'grayscale opacity-50'}`}><TagBadge nome={tag.name} size="md" /></button>) })}</div>
                </>
              )}

              {role === 'impresa' && (
                <textarea value={formData.mission} onChange={(e) => setFormData((prev) => ({ ...prev, mission: e.target.value }))} placeholder="Mission..." className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-violet-500 focus:bg-white resize-none" />
              )}

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={(e) => { e.preventDefault(); setStep(2); }} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">Indietro</button>
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