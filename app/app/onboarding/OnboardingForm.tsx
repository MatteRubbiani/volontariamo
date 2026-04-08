'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/auth/registrazione/onboarding/actions'
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
  mission: string
  tags: string[]
  competenze: string[]
}

type TagRecord = { id: string; name: string }
type CompetenzaRecord = { id: string; name: string }

const roles: { id: Role; title: string; subtitle: string }[] = [
  { id: 'volontario', title: 'Volontario', subtitle: 'Cerco opportunità per candidarmi' },
  { id: 'associazione', title: 'Associazione', subtitle: 'Pubblico posizioni e gestisco candidature' },
  { id: 'impresa', title: 'Impresa', subtitle: 'Creo iniziative di impatto sociale' },
]

export default function OnboardingForm({ redirectTo }: OnboardingFormProps) {
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
    mission: '',
    tags: [],
    competenze: [],
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

  const canGoStep3 =
    role === 'volontario'
      ? formData.nome.trim().length > 1 && formData.cognome.trim().length > 1
      : formData.nome.trim().length > 1

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
            await completeOnboarding(fd)
          }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10"
        >
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="nome" value={formData.nome} />
          <input type="hidden" name="cognome" value={formData.cognome} />
          <input type="hidden" name="sitoWeb" value={formData.sitoWeb} />
          <input type="hidden" name="partitaIva" value={formData.partitaIva} />
          <input type="hidden" name="mission" value={formData.mission} />
          {formData.tags.map((tagId) => (
            <input key={`tag-${tagId}`} type="hidden" name="tags" value={tagId} />
          ))}
          {formData.competenze.map((competenzaId) => (
            <input key={`comp-${competenzaId}`} type="hidden" name="competenze" value={competenzaId} />
          ))}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Scegli il tuo ruolo</h1>
                <p className="mt-2 text-slate-600">Definisci il percorso iniziale: potrai modificarlo in seguito.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {roles.map((item) => {
                  const active = role === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
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

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Dati anagrafici</h2>
                <p className="mt-2 text-slate-600">Compila le informazioni base per il profilo {selectedRole.title.toLowerCase()}.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder={role === 'volontario' ? 'Nome' : role === 'associazione' ? 'Nome Associazione' : 'Nome Impresa'}
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                {role === 'volontario' ? (
                  <input
                    type="text"
                    placeholder="Cognome"
                    value={formData.cognome}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cognome: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                ) : role === 'associazione' ? (
                  <input
                    type="url"
                    placeholder="Sito web (opzionale)"
                    value={formData.sitoWeb}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sitoWeb: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-colors focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Partita IVA (opzionale)"
                    value={formData.partitaIva}
                    onChange={(e) => setFormData((prev) => ({ ...prev, partitaIva: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-colors focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canGoStep3}
                  className="w-2/3 rounded-xl bg-slate-900 py-3 font-black text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Continua
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Competenze e interessi</h2>
                <p className="mt-2 text-slate-600">Miglioriamo il matching con le informazioni giuste.</p>
              </div>

              {role === 'volontario' ? (
                <>
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Cause di interesse (tags)</p>
                    <div className="flex flex-wrap gap-3">
                      {tagsCatalog.map((tag) => {
                        const active = formData.tags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleMulti('tags', tag.id)}
                            className={`rounded-xl transition-all duration-200 ease-in-out ${
                              active 
                                ? 'scale-105 shadow-md ring-2 ring-blue-500 ring-offset-2 opacity-100' 
                                : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <TagBadge nome={tag.name} size="md" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Competenze</p>
                    <div className="flex flex-wrap gap-3">
                      {competenzeCatalog.map((comp) => {
                        const active = formData.competenze.includes(comp.id)
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => toggleMulti('competenze', comp.id)}
                            className={`rounded-lg transition-all duration-200 ease-in-out ${
                              active 
                                ? 'scale-105 shadow-md ring-2 ring-slate-800 ring-offset-2 opacity-100' 
                                : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <CompetenzaBadge nome={comp.name} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Mission</label>
                    <textarea
                      value={formData.mission}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mission: e.target.value }))}
                      placeholder="Racconta mission, obiettivi e impatto"
                      className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-colors focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/10"
                    />
                  </div>

                  <div className="pt-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Settori di interesse (tags)</p>
                    <div className="flex flex-wrap gap-3">
                      {tagsCatalog.map((tag) => {
                        const active = formData.tags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleMulti('tags', tag.id)}
                            className={`rounded-xl transition-all duration-200 ease-in-out ${
                              active 
                                ? 'scale-105 shadow-md ring-2 ring-emerald-500 ring-offset-2 opacity-100' 
                                : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <TagBadge nome={tag.name} size="md" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                  Indietro
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-blue-600 py-3 font-black text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Completamento in corso...' : 'Completa Profilo'}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  )
}