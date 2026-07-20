'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FormModificaVolontario({ 
  profilo, 
  allTags, 
  tagsIniziali, 
  allCompetenze, 
  competenzeIniziali, 
  salvaAction 
}: any) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Stati tassonomie e immagine
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])
  const [competenze, setCompetenze] = useState<string[]>(competenzeIniziali || [])
  const [previewImmagine, setPreviewImmagine] = useState<string | null>(profilo.foto_profilo_url || null)
  
  const [activeSection, setActiveSection] = useState<'cause' | 'competenze'>('cause')
  const [tagQuery, setTagQuery] = useState('')
  const [compQuery, setCompQuery] = useState('')

  const handleToggleMulti = (field: 'tags' | 'competenze', id: string) => {
    if (field === 'tags') {
      setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
    } else {
      setCompetenze(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
    }
  }

  // Anteprima istantanea dell'immagine selezionata localmente
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImmagine(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const filteredTags = useMemo(() => {
    if (!tagQuery.trim()) return allTags.slice(0, 4)
    return allTags.filter((t: any) => t.name.toLowerCase().includes(tagQuery.toLowerCase()))
  }, [allTags, tagQuery])

  const filteredCompetenze = useMemo(() => {
    if (!compQuery.trim()) return allCompetenze.slice(0, 4)
    return allCompetenze.filter((c: any) => c.name.toLowerCase().includes(compQuery.toLowerCase()))
  }, [allCompetenze, compQuery])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('tags_selezionati', JSON.stringify(tags))
    formData.append('competenze_selezionate', JSON.stringify(competenze))
    formData.append('role', 'volontario')
    
    try {
      const result = await salvaAction(formData)
      if (result?.error) { 
        setError(result.error)
        setLoading(false)
      } else { 
        router.push('/app/profilo')
        router.refresh()
      }
    } catch (err) { 
      setError("Errore durante il salvataggio dei dati.")
      setLoading(false) 
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      
      {/* HEADER EDITORIALE */}
      <div className="space-y-1.5">
        <Link href="/app/profilo" className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1.5 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Annulla e torna indietro
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 leading-none">Aggiorna il tuo profilo</h1>
        <p className="text-sm text-slate-500 font-normal">Gestisci foto, anagrafica ed ambiti in cui fare la differenza.</p>
      </div>

      {error && <div className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold p-4 rounded-2xl">{error}</div>}

      {/* ========================================================
          🖼️ UPLOADER IMMAGINE AVATAR (INTERATTIVO STILE AIRBNB)
         ======================================================== */}
      <div className="flex flex-col items-center gap-3 py-4 border-b border-slate-100 shrink-0">
        <input 
          type="file" name="file_avatar" ref={fileInputRef} 
          onChange={handleFileChange} accept="image/*" className="hidden" 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-20 w-20 h-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer relative group shadow-inner select-none"
        >
          {previewImmagine ? (
            <img src={previewImmagine} className="w-full h-full object-cover" alt="Avatar" />
          ) : (
            <span className="text-xs font-semibold text-slate-400 text-center px-1">Aggiungi Foto</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-semibold">
            Modifica
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Fai tap sul cerchio per caricare un'immagine quadrata</span>
      </div>

      {/* SEZIONE 1: DATI ANAGRAFICI */}
      <div className="flex flex-col gap-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Informazioni Personali</span>
        
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="nome" defaultValue={profilo.nome} placeholder="Nome *" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all" required />
          <input type="text" name="cognome" defaultValue={profilo.cognome} placeholder="Cognome *" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="telefono" defaultValue={profilo.telefono} placeholder="Telefono" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all" />
          <select name="grado_istruzione" defaultValue={profilo.grado_istruzione || ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all">
            <option value="">Grado di istruzione</option>
            <option value="Scuola Media">Scuola Media</option>
            <option value="Diploma">Diploma Superiore</option>
            <option value="Laurea Triennale">Laurea Triennale</option>
            <option value="Laurea Magistrale">Laurea Magistrale</option>
            <option value="Master / Dottorato">Master / Dottorato</option>
          </select>
        </div>

        {/* COMPILAZIONE ANAGRAFICA REALE PER COMPLETARE IL 100% */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-1">
          <input type="date" name="data_nascita" defaultValue={profilo.data_nascita || ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-all" />
          <select name="sesso" defaultValue={profilo.sesso || ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all">
            <option value="">Genere</option>
            <option value="M">Uomo</option>
            <option value="F">Donna</option>
            <option value="Altro">Altro / Riservato</option>
          </select>
        </div>
      </div>

      {/* SEZIONE 2: LA BIOGRAFIA */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">La tua Biografia (Presentazione)</label>
        <textarea 
          name="bio" defaultValue={profilo.bio} placeholder="Racconta qualcosa sulle tue motivazioni..."
          className="w-full h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-slate-400 transition-all resize-none leading-relaxed" 
        />
      </div>

      {/* ========================================================
          📊 BLOCCO TASSONOMIE AD ACCORDION DI FOCUS
         ======================================================== */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Interessi & Competenze</span>
        
        {/* SEZIONE CAUSE */}
        <div 
          onClick={() => activeSection !== 'cause' && setActiveSection('cause')}
          className={`border rounded-[2rem] p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
            activeSection === 'cause' ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cause di Interesse</span>
            {activeSection !== 'cause' && <span className="text-xs font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-full border border-slate-200">{tags.length} scelte</span>}
          </div>
          {activeSection === 'cause' ? (
            <div className="space-y-3 mt-3 animate-in fade-in duration-300">
              <div className="relative"><input type="text" placeholder="Filtra cause..." value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-medium outline-none" onClick={(e) => e.stopPropagation()} /><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg></div>
              <div className="grid grid-cols-2 gap-2 max-h-[130px] overflow-y-auto pr-0.5">
                {filteredTags.map((tag: any) => {
                  const active = tags.includes(tag.id)
                  return (
                    <button key={tag.id} type="button" onClick={(e) => { e.stopPropagation(); handleToggleMulti('tags', tag.id); setTagQuery(''); }} className={`px-3 py-2.5 rounded-xl border text-left text-xs font-medium truncate flex items-center gap-2 transition-all ${active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}><span className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300'}`} /><span className="truncate">{tag.name}</span></button>
                  )
                })}
              </div>
            </div>
          ) : <p className="text-xs text-slate-500 font-medium truncate mt-1">{tags.length > 0 ? 'Espandi per modificare' : 'Nessuna causa'}</p>}
        </div>

        {/* SEZIONE COMPETENZE */}
        <div 
          onClick={() => activeSection !== 'competenze' && setActiveSection('competenze')}
          className={`border rounded-[2rem] p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
            activeSection === 'competenze' ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Le tue Competenze</span>
            {activeSection !== 'competenze' && <span className="text-xs font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-full border border-slate-200">{competenze.length} scelte</span>}
          </div>
          {activeSection === 'competenze' ? (
            <div className="space-y-3 mt-3 animate-in fade-in duration-300">
              <div className="relative"><input type="text" placeholder="Filtra competenze..." value={compQuery} onChange={(e) => setCompQuery(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-medium outline-none" onClick={(e) => e.stopPropagation()} /><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg></div>
              <div className="grid grid-cols-2 gap-2 max-h-[130px] overflow-y-auto pr-0.5">[scrollbar-width:thin]
                {filteredCompetenze.map((comp: any) => {
                  const active = competenze.includes(comp.id)
                  return (
                    <button key={comp.id} type="button" onClick={(e) => { e.stopPropagation(); handleToggleMulti('competenze', comp.id); setCompQuery(''); }} className={`px-3 py-2.5 rounded-xl border text-left text-xs font-medium truncate flex items-center gap-2 transition-all ${active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}><span className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300'}`} /><span className="truncate">{comp.name}</span></button>
                  )
                })}
              </div>
            </div>
          ) : <p className="text-xs text-slate-500 font-medium truncate mt-1">{competenze.length > 0 ? 'Espandi per modificare' : 'Nessuna competenza'}</p>}
        </div>
      </div>

      {/* AZIONE DI SALVATAGGIO */}
      <button 
        type="submit" disabled={loading} 
        className="w-full bg-slate-950 text-white py-4 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 shadow-md flex items-center justify-center gap-2 mt-4"
      >
        {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span>Salva ed applica modifiche</span>}
      </button>

    </form>
  )
}