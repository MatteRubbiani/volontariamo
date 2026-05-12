'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import TagBadge from '@/components/TagBadge'
// Importiamo l'azione dal percorso indicato
import { magicOnboardingAssociazione } from '@/app/ai-actions'

export default function FormModificaProfilo({ 
  ruolo, 
  profilo: profiloRaw, 
  allTags, 
  tagsIniziali, 
  salvaAction 
}: any) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const profilo = profiloRaw || {}

  // --- STATI CONTROLLATI PER LA COMPILAZIONE AI ---
  const [denominazione, setDenominazione] = useState(profilo.denominazione || '')
  const [formaGiuridica, setFormaGiuridica] = useState(profilo.forma_giuridica || '')
  const [indirizzo, setIndirizzo] = useState(profilo.indirizzo || '')
  const [cap, setCap] = useState(profilo.cap || '')
  const [provincia, setProvincia] = useState(profilo.provincia || '')
  const [legaleNome, setLegaleNome] = useState(profilo.legale_rappresentante_nome || '')
  const [legaleCognome, setLegaleCognome] = useState(profilo.legale_rappresentante_cognome || '')
  const [referenteNome, setReferenteNome] = useState(profilo.referente_progetto_nome || '')
  const [referenteCognome, setReferenteCognome] = useState(profilo.referente_progetto_cognome || '')
  const [referenteRuolo, setReferenteRuolo] = useState(profilo.referente_progetto_ruolo || '')
  const [descrizione, setDescrizione] = useState(profilo.descrizione || '')

  // --- STATI GESTIONALI ---
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])
  const [fotoUrl, setFotoUrl] = useState(profilo.logo_url || '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isIscrittoRunts, setIsIscrittoRunts] = useState(profilo.is_iscritto_runts || false)
  
  // --- STATI MAGIC AI ---
  const [urlMagic, setUrlMagic] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [descrizioneAttiva, setDescrizioneAttiva] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Raggruppamento Tag
  const tagsRaggruppati = allTags?.reduce((acc: any, tag: any) => {
    const cat = tag.categoria || 'Altro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const handleSelectTag = (tag: any) => {
    setTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])
    setDescrizioneAttiva(tag.description)
    setShowToast(true)
  }

  // 🪄 FUNZIONE MAGIC AI
  const handleMagicOnboarding = async () => {
    if (!urlMagic) return
    setMagicLoading(true)
    setError(null)
    try {
      const result = await magicOnboardingAssociazione(urlMagic, allTags)
      
      if (result.success && result.data) {
        const d = result.data
        // Popolamento atomico degli stati
        if (d.denominazione) setDenominazione(d.denominazione)
        if (d.forma_giuridica) setFormaGiuridica(d.forma_giuridica)
        if (d.descrizione) setDescrizione(d.descrizione)
        if (d.legale_rappresentante_nome) setLegaleNome(d.legale_rappresentante_nome)
        if (d.legale_rappresentante_cognome) setLegaleCognome(d.legale_rappresentante_cognome)
        if (d.tags_suggeriti) setTags(d.tags_suggeriti)
        
        setDescrizioneAttiva("✨ Analisi completata! Ho pre-compilato i campi trovati sul sito e selezionato i settori di intervento suggeriti.")
        setShowToast(true)
      } else {
        setError(result.error || "Non sono riuscito a estrarre dati da questo URL.")
      }
    } catch (err) {
      setError("Errore durante l'analisi AI.")
    } finally {
      setMagicLoading(false)
    }
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // ... (handleUploadLogo e handleSubmit rimangono invariati)
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true)
      setError(null)
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profilo.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
      setFotoUrl(publicUrl)
    } catch (err: any) {
      setError("Errore caricamento immagine: " + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('tags_selezionati', JSON.stringify(tags))
    formData.append('logo_url', fotoUrl)
    formData.append('is_iscritto_runts', String(isIscrittoRunts))
    // Aggiungiamo i campi controllati al formData per sicurezza
    formData.set('denominazione', denominazione)
    formData.set('descrizione', descrizione)
    try {
      const result = await salvaAction(formData)
      if (result?.error) { setError(result.error); setLoading(false); } 
      else { router.push('/profilo'); router.refresh(); }
    } catch (err) { setError("Errore salvataggio."); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 pb-32 max-w-5xl mx-auto px-4 md:px-0">
      
      {/* 🟢 FLOATING TOAST (TOP) */}
      {showToast && descrizioneAttiva && (
        <div className="fixed top-4 left-4 right-4 z-[9999] md:left-auto md:right-8 md:max-w-md animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-progress-shrink" />
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-lg">✨</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Smart Assistant</span>
                  <button type="button" onClick={() => setShowToast(false)} className="text-white/40 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                  </button>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-200">{descrizioneAttiva}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🪄 MAGIC AI BANNER (Professional & Mobile Optimized) */}
      <div className="bg-emerald-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group mt-6">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-40 h-40"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
        </div>
        
        <div className="flex-1 space-y-2 z-10 text-center md:text-left">
          <h3 className="text-2xl font-black tracking-tight">Compilazione Magica</h3>
          <p className="text-emerald-100 text-sm font-medium">Incolla l'URL del sito web dell'ente: l'AI analizzerà le attività e compilerà il profilo per te.</p>
        </div>

        <div className="flex w-full md:w-auto bg-white/10 p-2 rounded-[2rem] gap-2 z-10 backdrop-blur-sm border border-white/10">
          <input 
            type="url" 
            placeholder="https://www.esempio.it" 
            className="bg-transparent border-none text-white placeholder:text-white/40 focus:ring-0 px-6 py-3 w-full md:w-64 font-bold text-sm"
            value={urlMagic}
            onChange={(e) => setUrlMagic(e.target.value)}
          />
          <button 
            type="button"
            onClick={handleMagicOnboarding}
            disabled={magicLoading || !urlMagic}
            className="bg-white text-emerald-900 px-8 py-3 rounded-2xl font-black hover:bg-emerald-50 transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/20 whitespace-nowrap text-sm"
          >
            {magicLoading ? 'Analisi in corso...' : '✨ Analizza'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold border border-red-100 animate-bounce">{error}</div>}

      {/* 📸 LOGO UPLOAD */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center gap-6">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-40 h-40 rounded-[3rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
            {fotoUrl ? <img src={fotoUrl} alt="Logo" className="w-full h-full object-cover" /> 
            : <span className="text-5xl font-black text-slate-200 uppercase">{denominazione?.substring(0,2) || '??'}</span>}
            {uploadingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full" /></div>}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUploadLogo} className="hidden" accept="image/*" />
        <h3 className="text-lg font-black text-slate-900">Logo Istituzionale</h3>
      </div>

      {/* 01. IDENTITÀ & FISCO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-sm font-black">01</span>
          Identità & Fisco
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Denominazione Completa *</label>
            <input type="text" name="denominazione" value={denominazione} onChange={(e) => setDenominazione(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500 transition-all" required />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Forma Giuridica</label>
            <input type="text" name="forma_giuridica" value={formaGiuridica} onChange={(e) => setFormaGiuridica(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Codice Fiscale</label>
            <input type="text" name="codice_fiscale" defaultValue={profilo.codice_fiscale} className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 font-mono font-bold" readOnly />
          </div>
        </div>
      </div>

      {/* 03. SEDE & PERSONE */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-sm font-black">03</span>
          Sede & Governance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Indirizzo</label>
            <input type="text" name="indirizzo" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">CAP</label>
            <input type="text" name="cap" value={cap} onChange={(e) => setCap(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">PR</label>
            <input type="text" name="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-center uppercase" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Nome Legale Rappr.</label>
            <input type="text" name="legale_rappresentante_nome" value={legaleNome} onChange={(e) => setLegaleNome(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Cognome Legale Rappr.</label>
            <input type="text" name="legale_rappresentante_cognome" value={legaleCognome} onChange={(e) => setLegaleCognome(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Nome Referente</label>
            <input type="text" name="referente_progetto_nome" value={referenteNome} onChange={(e) => setReferenteNome(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Cognome Referente</label>
            <input type="text" name="referente_progetto_cognome" value={referenteCognome} onChange={(e) => setReferenteCognome(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 block">Ruolo Referente</label>
            <input type="text" name="referente_progetto_ruolo" value={referenteRuolo} onChange={(e) => setReferenteRuolo(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" />
          </div>
        </div>
      </div>

      {/* 06. AMBITI ART. 5 */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <span className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-sm font-black">06</span>
          Settori di Intervento (Art. 5)
        </h2>
        
        <div className="space-y-10">
          {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
            <div key={categoria} className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <div className="h-px flex-1 bg-slate-100"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{categoria}</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {tagsInCat.map((tag: any) => {
                  const active = tags.includes(tag.id)
                  return (
                    <button key={tag.id} type="button" onClick={() => handleSelectTag(tag)}
                      className={`relative transition-all duration-300 transform rounded-xl ${active ? 'ring-4 ring-slate-900 scale-105 z-10 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                    >
                      <TagBadge nome={tag.name} categoria={tag.categoria} size="md" /> 
                      {active && (
                        <div className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg border-2 border-white z-20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-50 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Missione & Attività</label>
          <textarea 
            name="descrizione" 
            value={descrizione} 
            onChange={(e) => setDescrizione(e.target.value)} 
            rows={6} 
            className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 font-medium resize-none focus:ring-2 focus:ring-emerald-500 transition-all" 
            placeholder="Descrivi il vostro impatto..." 
          />
        </div>
      </div>

      {/* TASTO SALVA PERSISTENTE */}
      <div className="sticky bottom-6 z-50">
        <button type="submit" disabled={loading || uploadingImage}
          className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.5rem] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-lg"
        >
          {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full" /> 
          : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>Aggiorna Profilo Ente</>}
        </button>
      </div>
    </form>
  )
}