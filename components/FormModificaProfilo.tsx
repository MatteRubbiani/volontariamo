'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTagColor } from '@/lib/tagColors'
import CompetenzaSelector from './CompetenzaSelector'

export default function FormModificaProfilo({
  isVolontario,
  profilo,
  allTags = [],
  tagsIniziali = [],
  allCompetenze = [],
  competenzeIniziali = [],
  salvaAction
}: {
  isVolontario: boolean
  profilo: any
  allTags?: any[]
  tagsIniziali?: string[]
  allCompetenze?: any[]
  competenzeIniziali?: string[]
  salvaAction: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagSelezionati, setTagSelezionati] = useState<string[]>(tagsIniziali)

  const toggleTag = (id: string) => {
    setTagSelezionati(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await salvaAction(formData)
      router.refresh()
      router.push('/profilo')
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  // Input utility per ridurre duplicazione
  const InputField = ({ label, name, type = 'text', required = false, defaultValue = '' }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
        {label}
      </label>
      <input 
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium transition-all" 
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
      <input type="hidden" name="role" value={isVolontario ? 'volontario' : 'associazione'} />
      
      {/* SEZIONE INFORMAZIONI BASE */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
          ✎ Informazioni Generali
        </h2>
        
        <div className="space-y-6">
          <InputField 
            label={isVolontario ? 'Nome Completo' : 'Nome Associazione'}
            name="nome"
            defaultValue={isVolontario ? profilo?.nome_completo : profilo?.nome}
            required
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
              {isVolontario ? 'Bio Personale' : 'Descrizione Associazione'}
            </label>
            <textarea 
              name="bio"
              defaultValue={isVolontario ? profilo?.bio : profilo?.descrizione}
              className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium h-32 transition-all" 
            />
          </div>
        </div>
      </div>

      {/* SEZIONE CAMPI SPECIFICI ASSOCIAZIONE */}
      {!isVolontario && (
        <>
          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              🏢 Dati Legali
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Forma Giuridica"
                name="forma_giuridica"
                defaultValue={profilo?.forma_giuridica}
              />
              <InputField 
                label="Codice Fiscale"
                name="codice_fiscale"
                defaultValue={profilo?.codice_fiscale}
              />
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              📍 Sede
            </h2>
            
            <div className="space-y-6">
              <InputField 
                label="Città"
                name="citta"
                defaultValue={profilo?.citta}
              />
              <InputField 
                label="Indirizzo Sede"
                name="indirizzo_sede"
                defaultValue={profilo?.indirizzo_sede}
              />
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              📞 Contatti
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Telefono"
                name="telefono"
                defaultValue={profilo?.telefono}
              />
              <InputField 
                label="Email Contatto"
                name="email_contatto"
                type="email"
                defaultValue={profilo?.email_contatto}
              />
              <InputField 
                label="Nome Referente"
                name="nome_referente"
                defaultValue={profilo?.nome_referente}
              />
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              🔗 Canali Online
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Sito Web"
                name="sito_web"
                type="url"
                defaultValue={profilo?.sito_web}
              />
              <InputField 
                label="Profili Social"
                name="profili_social"
                defaultValue={profilo?.profili_social}
              />
            </div>
          </div>
        </>
      )}

      {/* SEZIONE TAG VOLONTARIO */}
      {isVolontario && (
        <>
          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              ❤️ Le tue Passioni
            </h2>
            <div className="flex flex-wrap gap-3">
              {allTags.map(t => {
                const isSelected = tagSelezionati.includes(t.id)
                const activeColorClass = getTagColor(t.name)
                return (
                  <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                    className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 ${isSelected ? `${activeColorClass} shadow-lg scale-105` : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                    #{t.name}
                  </button>
                )
              })}
            </div>
            {tagSelezionati.map(id => <input key={id} type="hidden" name="tags" value={id} />)}
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 px-4">
              💪 I Tuoi Superpoteri
            </h2>
            <CompetenzaSelector 
              allCompetenze={allCompetenze} 
              competenzeIniziali={competenzeIniziali} 
            />
          </div>
        </>
      )}

      {/* PULSANTI AZIONE */}
      <div className="flex gap-4 pt-8 border-t-2 border-slate-100">
        <button type="submit" disabled={isSubmitting} className={`flex-1 font-black text-lg py-5 rounded-3xl shadow-xl transition-all active:scale-[0.98] ${isSubmitting ? 'bg-slate-400 text-white shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}>
          {isSubmitting ? '⏳ SALVATAGGIO...' : '✓ SALVA MODIFICHE'}
        </button>
        <a href="/profilo" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-center flex items-center justify-center font-black text-lg py-5 rounded-3xl transition-all">
          ✕ ANNULLA
        </a>
      </div>
    </form>
  )
}