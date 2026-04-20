'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

export default function FormModificaProfilo({ 
  ruolo, 
  profilo, 
  allTags, 
  tagsIniziali, 
  allCompetenze, 
  competenzeIniziali, 
  salvaAction 
}: any) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])
  const [competenze, setCompetenze] = useState<string[]>(competenzeIniziali || [])
  
  const [fotoUrl, setFotoUrl] = useState(profilo?.foto_profilo_url || '')
  const [uploadingImage, setUploadingImage] = useState(false)

  // LOGICA MULTI-SELECT
  const handleToggle = (id: string, state: string[], setState: any) => {
    setState(state.includes(id) ? state.filter((i: string) => i !== id) : [...state, id])
  }

  // 📸 UPLOAD FOTO (Universale)
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Devi selezionare un\'immagine.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profilo?.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFotoUrl(data.publicUrl)

    } catch (error: any) {
      setError(error.message || 'Errore durante il caricamento dell\'immagine.')
    } finally {
      setUploadingImage(false)
    }
  }

  // SALVATAGGIO
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('tags_selezionati', JSON.stringify(tags))
    if (ruolo === 'volontario') {
      formData.append('competenze_selezionate', JSON.stringify(competenze))
    }
    formData.append('foto_profilo_url', fotoUrl)

    try {
      const result = await salvaAction(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push('/profilo')
        router.refresh()
      }
    } catch (err) {
      setError("Si è verificato un errore imprevisto.")
      setLoading(false)
    }
  }

  if (!profilo) return <div className="p-8 text-center text-slate-500 font-bold">Caricamento modulo...</div>

  // Stili dinamici in base al ruolo
  const isEnte = ruolo === 'associazione' || ruolo === 'impresa'
  const shapeClass = isEnte ? 'rounded-[2rem]' : 'rounded-full'
  const themeColor = ruolo === 'associazione' ? 'emerald' : ruolo === 'impresa' ? 'violet' : 'blue'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          {error}
        </div>
      )}

      {/* 📸 FOTO PROFILO / LOGO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center gap-4">
        <label htmlFor="avatar-upload" className="relative group cursor-pointer block">
          <div className={`w-32 h-32 border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-slate-100 overflow-hidden relative flex items-center justify-center transition-transform group-active:scale-95 ${shapeClass}`}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            )}

            <div className={`absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center transition-opacity duration-300 ${uploadingImage ? 'opacity-100 bg-white/80' : 'opacity-0 group-hover:opacity-100'}`}>
              {uploadingImage ? (
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
              )}
            </div>
          </div>
          <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploadingImage} />
        </label>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {uploadingImage ? 'Caricamento in corso...' : isEnte ? 'Tocca per cambiare Logo' : 'Tocca per cambiare Foto'}
        </p>
      </div>

      {/* DATI PRINCIPALI (Dinamici per ruolo) */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`bg-${themeColor}-50 p-2 rounded-full text-${themeColor}-600`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">Dati Principali</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VOLONTARIO */}
          {ruolo === 'volontario' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                <input type="text" name="nome" defaultValue={profilo?.nome || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cognome</label>
                <input type="text" name="cognome" defaultValue={profilo?.cognome || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Data di Nascita</label>
                <input type="date" name="data_nascita" defaultValue={profilo?.data_nascita || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Sesso</label>
                <select name="sesso" defaultValue={profilo?.sesso || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all cursor-pointer">
                  <option value="">Seleziona...</option><option value="Uomo">Uomo</option><option value="Donna">Donna</option><option value="Altro">Altro</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Grado di Istruzione</label>
                <select name="grado_istruzione" defaultValue={profilo?.grado_istruzione || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all cursor-pointer">
                  <option value="">Seleziona...</option><option value="Scuola dell'obbligo">Scuola dell'obbligo</option><option value="Diploma">Diploma</option><option value="Laurea Triennale">Laurea Triennale</option><option value="Laurea Magistrale">Laurea Magistrale / Master</option>
                </select>
              </div>
            </>
          )}

          {/* ASSOCIAZIONE / IMPRESA */}
          {isEnte && (
            <>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">{ruolo === 'impresa' ? 'Ragione Sociale' : 'Nome Associazione'}</label>
                <input type="text" name="nome" defaultValue={profilo?.nome || profilo?.ragione_sociale || ''} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Forma Giuridica</label>
                <input type="text" name="forma_giuridica" defaultValue={profilo?.forma_giuridica || ''} placeholder={ruolo === 'impresa' ? "es. Srl, SpA" : "es. APS, ODV"} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{ruolo === 'impresa' ? 'Partita IVA / Codice Fiscale' : 'Codice Fiscale'}</label>
                <input type="text" name="codice_fiscale" defaultValue={profilo?.codice_fiscale || profilo?.partita_iva || ''} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Referente principale</label>
                <input type="text" name="nome_referente" defaultValue={profilo?.nome_referente || ''} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* BIO / MISSION E CONTATTI */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`bg-${themeColor}-50 p-2 rounded-full text-${themeColor}-600`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" /></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">{isEnte ? 'Mission & Contatti' : 'Bio & Contatti'}</h2>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">{isEnte ? 'Descrivi la vostra missione' : 'Una breve bio'}</label>
          {/* L'attributo name="bio" viene mappato a "descrizione" in actions.ts per le associazioni */}
          <textarea name="bio" defaultValue={profilo?.bio || profilo?.descrizione || ''} placeholder={isEnte ? "Qual è il vostro obiettivo?" : "Parlaci di te..."} rows={4} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium resize-none focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Città</label>
             <input type="text" name="citta_residenza" defaultValue={profilo?.citta_residenza || profilo?.citta || ''} placeholder="Roma, Milano..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">CAP</label>
             <input type="text" name="cap" defaultValue={profilo?.cap || ''} placeholder="00100" maxLength={5} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
          </div>
          
          {isEnte && (
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 mb-1">Indirizzo Sede Fisico</label>
               <input type="text" name="indirizzo_sede" defaultValue={profilo?.indirizzo_sede || ''} placeholder="Via Roma 1..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
            </div>
          )}

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Email Pubblica / Contatto</label>
             <input type="email" name="email_contatto" defaultValue={profilo?.email_contatto || ''} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Telefono</label>
             <input type="tel" name="telefono" defaultValue={profilo?.telefono || ''} placeholder="+39 333..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
          </div>
        </div>
      </div>

      {/* INFORMAZIONI EXTRA (Solo Enti) */}
      {isEnte && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`bg-${themeColor}-50 p-2 rounded-full text-${themeColor}-600`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-900">Web & Social</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Sito Web</label>
               <input type="text" name="sito_web" defaultValue={profilo?.sito_web || ''} placeholder="www.associazione.it" className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Profili Social</label>
               <input type="text" name="profili_social" defaultValue={profilo?.profili_social || ''} placeholder="Instagram, Facebook..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-${themeColor}-500 transition-all outline-none`} />
            </div>
          </div>
        </div>
      )}

      {/* 🚨 TAGS E COMPETENZE CON COMPONENTI NATIVI */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`bg-${themeColor}-50 p-2 rounded-full text-${themeColor}-600`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">{isEnte ? 'Settori di Intervento' : 'Cause e Competenze'}</h2>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">{isEnte ? 'In quali ambiti operate?' : 'Quali cause ti appassionano?'}</label>
          <div className="flex flex-wrap gap-3">
            {allTags?.map((tag: any) => {
              const active = tags.includes(tag.id)
              return (
                <button 
                  key={tag.id} 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); handleToggle(tag.id, tags, setTags); }} 
                  className={`rounded-xl transition-all duration-200 ${active ? `scale-105 ring-2 ring-${themeColor}-500 ring-offset-2 opacity-100` : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                >
                  <TagBadge nome={tag.name} size="md" />
                </button>
              )
            })}
          </div>
        </div>

        {ruolo === 'volontario' && (
          <div className="pt-6 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-800 mb-4">Quali sono le tue competenze speciali?</label>
            <div className="flex flex-wrap gap-3">
              {allCompetenze?.map((comp: any) => {
                const active = competenze.includes(comp.id)
                return (
                  <button 
                    key={comp.id} 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); handleToggle(comp.id, competenze, setCompetenze); }} 
                    className={`rounded-lg transition-all duration-200 ${active ? 'scale-105 ring-2 ring-slate-800 ring-offset-2 opacity-100' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                  >
                    <CompetenzaBadge nome={comp.name} />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* AZIONE SALVA */}
      <div className="sticky bottom-6 z-50">
        <button 
          disabled={loading || uploadingImage}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
          ) : 'Salva Modifiche'}
        </button>
      </div>
    </form>
  )
}