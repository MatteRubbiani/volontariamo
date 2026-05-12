// src/app/profilo/modifica/components/FormModificaAssociazione.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import TagBadge from '@/components/TagBadge'
import { magicOnboardingAssociazione } from '@/app/ai-actions'

export default function FormModificaAssociazione({ 
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

  // ==========================================
  // --- STATI CONTROLLATI (TUTTE LE 6 SEZIONI)
  // ==========================================
  
  // Card 1: Identità & Fisco
  const [denominazione, setDenominazione] = useState(profilo.denominazione || '')
  const [formaGiuridica, setFormaGiuridica] = useState(profilo.forma_giuridica || '')
  const [partitaIva, setPartitaIva] = useState(profilo.partita_iva || '')
  const [annoFondazione, setAnnoFondazione] = useState(profilo.anno_fondazione || '')

  // Card 2: Registro RUNTS
  const [isIscrittoRunts, setIsIscrittoRunts] = useState(profilo.is_iscritto_runts || false)
  const [runtsRepertorio, setRuntsRepertorio] = useState(profilo.runts_repertorio || '')
  const [runtsSezione, setRuntsSezione] = useState(profilo.runts_sezione || '')
  const [runtsData, setRuntsData] = useState(profilo.runts_data_iscrizione || '')

  // Card 3: Sede & Governance
  const [indirizzo, setIndirizzo] = useState(profilo.indirizzo || '')
  const [cap, setCap] = useState(profilo.cap || '')
  const [provincia, setProvincia] = useState(profilo.provincia || '')
  const [legaleNome, setLegaleNome] = useState(profilo.legale_rappresentante_nome || '')
  const [legaleCognome, setLegaleCognome] = useState(profilo.legale_rappresentante_cognome || '')
  const [referenteNome, setReferenteNome] = useState(profilo.referente_progetto_nome || '')
  const [referenteCognome, setReferenteCognome] = useState(profilo.referente_progetto_cognome || '')
  const [referenteRuolo, setReferenteRuolo] = useState(profilo.referente_progetto_ruolo || '')

  // Card 4: Contatti & Digital
  const [emailAssociazione, setEmailAssociazione] = useState(profilo.email_associazione || '')
  const [pec, setPec] = useState(profilo.pec || '')
  const [sitoWeb, setSitoWeb] = useState(profilo.sito_web || '')
  const [telefono, setTelefono] = useState(profilo.telefono || '')

  // Card 5: Statistiche Ente
  const [numSoci, setNumSoci] = useState(profilo.num_soci || '')
  const [numVolontari, setNumVolontari] = useState(profilo.num_volontari_attivi || '')
  const [numDipendenti, setNumDipendenti] = useState(profilo.num_dipendenti || '')

  // Card 6: Ambiti Art. 5
  const [descrizione, setDescrizione] = useState(profilo.descrizione || '')

  // --- STATI GESTIONALI BASE ---
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])
  const [fotoUrl, setFotoUrl] = useState(profilo.logo_url || '') 
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // --- STATI MAGIC AI (UX PREMIUM) ---
  const [urlMagic, setUrlMagic] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<string>('')
  const [aiFields, setAiFields] = useState<string[]>([]) 
  const [descrizioneAttiva, setDescrizioneAttiva] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Helper per tracciare gli override manuali sui campi AI
  const handleFieldChange = (fieldKey: string, setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value)
    setAiFields(prev => prev.includes(fieldKey) ? prev.filter(k => k !== fieldKey) : prev)
  }

  // Raggruppamento per Categoria dei Tag CTS
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

  // 🪄 ESECUZIONE DELLA COMPILAZIONE MAGICA NATIVA SUL LOGO E TUTTE LE SEZIONI
  const handleMagicOnboarding = async () => {
    if (!urlMagic) return
    setMagicLoading(true)
    setError(null)
    setAiFields([]) 

    setLoadingPhase("Connessione al sito web...")
    const timer1 = setTimeout(() => setLoadingPhase("Deep Scraping delle sottopagine legali..."), 1500)
    const timer2 = setTimeout(() => setLoadingPhase("Mapping semantico e iniezione nativa logo..."), 3500)

    try {
      const result = await magicOnboardingAssociazione(urlMagic, allTags)
      
      if (result.success && result.data) {
        const d = result.data
        const updatedKeys: string[] = []

        if (d.denominazione) { setDenominazione(d.denominazione); updatedKeys.push('denominazione'); }
        if (d.forma_giuridica) { setFormaGiuridica(d.forma_giuridica); updatedKeys.push('forma_giuridica'); }
        if (d.partita_iva) { setPartitaIva(d.partita_iva); updatedKeys.push('partita_iva'); }
        if (d.anno_fondazione) { setAnnoFondazione(d.anno_fondazione); updatedKeys.push('anno_fondazione'); }
        
        if (d.indirizzo) { setIndirizzo(d.indirizzo); updatedKeys.push('indirizzo'); }
        if (d.cap) { setCap(d.cap); updatedKeys.push('cap'); }
        if (d.provincia) { setProvincia(d.provincia); updatedKeys.push('provincia'); }
        if (d.legale_rappresentante_nome) { setLegaleNome(d.legale_rappresentante_nome); updatedKeys.push('legale_rappresentante_nome'); }
        if (d.legale_rappresentante_cognome) { setLegaleCognome(d.legale_rappresentante_cognome); updatedKeys.push('legale_rappresentante_cognome'); }
        if (d.referente_progetto_nome) { setReferenteNome(d.referente_progetto_nome); updatedKeys.push('referente_progetto_nome'); }
        if (d.referente_progetto_cognome) { setReferenteCognome(d.referente_progetto_cognome); updatedKeys.push('referente_progetto_cognome'); }
        if (d.referente_progetto_ruolo) { setReferenteRuolo(d.referente_progetto_ruolo); updatedKeys.push('referente_progetto_ruolo'); }

        if (d.email_associazione) { setEmailAssociazione(d.email_associazione); updatedKeys.push('email_associazione'); }
        if (d.pec) { setPec(d.pec); updatedKeys.push('pec'); }
        if (d.sito_web) { setSitoWeb(d.sito_web); updatedKeys.push('sito_web'); }
        if (d.telefono) { setTelefono(d.telefono); updatedKeys.push('telefono'); }
        
        if (d.descrizione) { setDescrizione(d.descrizione); updatedKeys.push('descrizione'); }

        if (d.logo_suggerito) {
          setFotoUrl(d.logo_suggerito);
          updatedKeys.push('logo_url');
        }

        if (d.tags_suggeriti && d.tags_suggeriti.length > 0) { setTags(d.tags_suggeriti); }
        
        setAiFields(updatedKeys)
        setDescrizioneAttiva("✨ Scansione completata! Ho evidenziato i campi popolati automaticamente e iniettato il logo scovato sul sito. Controllali prima di salvare.")
        setShowToast(true)
      } else {
        setError(result.error || "Non sono riuscito a estrarre dati strutturati da questo URL.")
      }
    } catch (err) { setError("Errore durante la scansione AI.") } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setMagicLoading(false)
      setLoadingPhase('')
    }
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Upload Manuale Logo
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
      
      handleFieldChange('logo_url', setFotoUrl, publicUrl) 
    } catch (err: any) { setError("Errore caricamento logo: " + err.message) } finally { setUploadingImage(false) }
  }

  // Rimozione Immagine Sicura
  const handleRemoveLogo = () => {
    setFotoUrl('')
    setAiFields(prev => prev.filter(k => k !== 'logo_url'))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Invio Form Principale
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    formData.append('tags_selezionati', JSON.stringify(tags))
    formData.append('logo_url', fotoUrl) 
    formData.append('is_iscritto_runts', String(isIscrittoRunts))
    formData.append('role', 'associazione')
    
    formData.set('denominazione', denominazione)
    formData.set('forma_giuridica', formaGiuridica)
    formData.set('partita_iva', partitaIva)
    formData.set('anno_fondazione', annoFondazione)
    formData.set('runts_repertorio', runtsRepertorio)
    formData.set('runts_sezione', runtsSezione)
    formData.set('runts_data_iscrizione', runtsData)
    formData.set('indirizzo', indirizzo)
    formData.set('cap', cap)
    formData.set('provincia', provincia)
    formData.set('legale_rappresentante_nome', legaleNome)
    formData.set('legale_rappresentante_cognome', legaleCognome)
    formData.set('referente_progetto_nome', referenteNome)
    formData.set('referente_progetto_cognome', referenteCognome)
    formData.set('referente_progetto_ruolo', referenteRuolo)
    formData.set('email_associazione', emailAssociazione)
    formData.set('pec', pec)
    formData.set('sito_web', sitoWeb)
    formData.set('telefono', telefono)
    formData.set('num_soci', String(numSoci))
    formData.set('num_volontari_attivi', String(numVolontari))
    formData.set('num_dipendenti', String(numDipendenti))
    formData.set('descrizione', descrizione)

    try {
      const result = await salvaAction(formData)
      if (result?.error) { setError(result.error); setLoading(false); } 
      else { router.push('/profilo'); router.refresh(); }
    } catch (err) { setError("Errore durante il salvataggio del profilo."); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 pb-32 max-w-5xl mx-auto px-4 md:px-0 mt-6">
      
      {/* 🟢 FLOATING TOAST INFORMATIVO */}
      {showToast && descrizioneAttiva && (
        <div className="fixed top-4 left-4 right-4 z-[9999] md:left-auto md:right-8 md:max-w-md animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-progress-shrink" />
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 text-lg">✨</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Smart Assistant</span>
                  <button type="button" onClick={() => setShowToast(false)} className="text-white/40 hover:text-white transition-colors">✕</button>
                </div>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">{descrizioneAttiva}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🪄 BANNER MAGIC AI */}
      <div className="bg-emerald-900 text-white p-8 md:p-10 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group border border-emerald-800/40">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-40 h-40"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
        </div>
        
        <div className="flex-1 space-y-2 text-center md:text-left z-10">
          <h3 className="text-2xl font-black tracking-tight">Compilazione Istantanea AI</h3>
          <p className="text-emerald-100/90 text-sm font-medium leading-snug">
            Incolla l'URL del sito web: l'algoritmo compilerà automaticamente l'anagrafica e inietterà il logo istituzionale.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto bg-white/10 p-2 rounded-[2rem] gap-2 border border-white/10 backdrop-blur-xs z-10">
          <input 
            type="url" 
            placeholder="https://www.esempio.it" 
            className="bg-transparent border-none text-white placeholder:text-white/40 px-6 py-3 w-full md:w-64 font-bold text-sm outline-none focus:ring-0" 
            value={urlMagic} 
            onChange={(e) => setUrlMagic(e.target.value)} 
          />
          <button 
            type="button" 
            onClick={handleMagicOnboarding} 
            disabled={magicLoading || !urlMagic} 
            className="bg-white text-emerald-950 px-8 py-3 rounded-2xl font-black hover:bg-emerald-50 transition-all disabled:opacity-50 text-sm shadow-md flex items-center justify-center min-w-[140px]"
          >
            {magicLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-950 border-t-transparent" />
                <span className="text-xs truncate max-w-[120px]">{loadingPhase || 'Analisi...'}</span>
              </span>
            ) : '✨ Analizza Site'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold border border-red-100">{error}</div>}

      {/* 📸 LOGO UPLOAD COMPLETO DI RIMOZIONE E ADATTAMENTO PERFETTO */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100/80 shadow-xs flex flex-col items-center text-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {/* Contenitore a dimensioni fisse e rigide (w-36 h-36) per evitare che esploda il layout */}
          <div className={`w-36 h-36 rounded-[2.5rem] bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center transition-all duration-500 transform relative ${
              aiFields.includes('logo_url') 
              ? 'ring-4 ring-emerald-500 scale-105 shadow-xl' 
              : 'group-hover:scale-105'
          }`}>
            {fotoUrl ? (
              /* 🛡️ FIX SENIOR: object-contain e p-2 garantiscono che loghi rettangolari o sagomati fittino perfettamente senza tagli o stiramenti */
              <img 
                src={fotoUrl} 
                alt="Logo Ente" 
                className="w-full h-full object-contain p-2 transition-opacity duration-300" 
              />
            ) : (
              <span className="text-5xl font-black text-slate-200 tracking-tighter uppercase">
                {denominazione?.substring(0,2) || '??'}
              </span>
            )}
            
            {uploadingImage && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent animate-spin rounded-full" />
              </div>
            )}
            
            {/* ✨ AI Badge posizionato in modo assoluto per non interferire con l'immagine */}
            {aiFields.includes('logo_url') && (
               <span className="absolute right-2 bottom-2 text-[9px] font-black text-emerald-700 bg-emerald-100/95 border border-emerald-200 px-1.5 py-0.5 rounded-md animate-pulse pointer-events-none z-20">
                 ✨ AI Logo
               </span>
            )}
          </div>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleUploadLogo} className="hidden" accept="image/*" />
        
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Logo Istituzionale</h3>
          {fotoUrl && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline transition-colors block mx-auto cursor-pointer"
            >
              Rimuovi immagine
            </button>
          )}
        </div>
      </div>

      {/* 🏛️ CARD 01: IDENTITÀ & FISCO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/80 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-sm font-black">01</span>
          Identità & Fisco
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Denominazione Completa *</label>
            <input 
              type="text" name="denominazione" value={denominazione} 
              onChange={(e) => handleFieldChange('denominazione', setDenominazione, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('denominazione') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
              required 
            />
            {aiFields.includes('denominazione') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Forma Giuridica (APS, ODV, ecc.)</label>
            <input 
              type="text" name="forma_giuridica" value={formaGiuridica} 
              onChange={(e) => handleFieldChange('forma_giuridica', setFormaGiuridica, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('forma_giuridica') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('forma_giuridica') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Codice Fiscale *</label>
            <input 
              type="text" name="codice_fiscale" defaultValue={profilo.codice_fiscale} 
              className="w-full bg-slate-100/70 text-slate-500 rounded-2xl px-6 py-4 font-mono font-bold border-none outline-none cursor-not-allowed" readOnly 
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Partita IVA (se distinta)</label>
            <input 
              type="text" name="partita_iva" value={partitaIva} 
              onChange={(e) => handleFieldChange('partita_iva', setPartitaIva, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('partita_iva') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('partita_iva') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Anno Fondazione</label>
            <input 
              type="number" name="anno_fondazione" value={annoFondazione} 
              onChange={(e) => handleFieldChange('anno_fondazione', setAnnoFondazione, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('anno_fondazione') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('anno_fondazione') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>
        </div>
      </div>

      {/* 📜 CARD 02: REGISTRO RUNTS */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/80 shadow-xs space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-sm font-black">02</span>
            Registro RUNTS
          </h2>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/80 shrink-0">
            <span className="text-[11px] font-extrabold text-slate-500">Iscritto al Registro?</span>
            <input 
              type="checkbox" checked={isIscrittoRunts} 
              onChange={(e) => setIsIscrittoRunts(e.target.checked)} 
              className="rounded text-emerald-600 w-4.5 h-4.5 focus:ring-0 focus:ring-offset-0 transition-colors border-slate-300" 
            />
          </label>
        </div>
        
        {isIscrittoRunts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-in fade-in duration-300">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Numero Repertorio</label>
              <input 
                type="text" name="runts_repertorio" value={runtsRepertorio} 
                onChange={(e) => setRuntsRepertorio(e.target.value)} 
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
              />
            </div>
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sezione RUNTS</label>
              <input 
                type="text" name="runts_sezione" value={runtsSezione} 
                onChange={(e) => setRuntsSezione(e.target.value)} 
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
              />
            </div>
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Data Iscrizione</label>
              <input 
                type="date" name="runts_data_iscrizione" value={runtsData} 
                onChange={(e) => setRuntsData(e.target.value)} 
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
              />
            </div>
          </div>
        )}
      </div>

      {/* 🏛️ CARD 03: SEDE & GOVERNANCE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/80 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-sm font-black">03</span>
          Sede & Governance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Indirizzo Sede Operativa</label>
            <input 
              type="text" name="indirizzo" value={indirizzo} 
              onChange={(e) => handleFieldChange('indirizzo', setIndirizzo, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('indirizzo') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('indirizzo') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">CAP</label>
            <input 
              type="text" name="cap" value={cap} 
              onChange={(e) => handleFieldChange('cap', setCap, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('cap') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-12' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('cap') && <span className="absolute right-3 bottom-4 text-[9px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.5 rounded-md animate-pulse pointer-events-none">AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">PR (2 lettere)</label>
            <input 
              type="text" name="provincia" value={provincia} 
              onChange={(e) => handleFieldChange('provincia', setProvincia, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold text-center border-none outline-none uppercase transition-all duration-300 ${aiFields.includes('provincia') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950' : 'bg-slate-50'}`} 
              maxLength={2}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nome Legale Rappresentante</label>
            <input 
              type="text" name="legale_rappresentante_nome" value={legaleNome} 
              onChange={(e) => handleFieldChange('legale_rappresentante_nome', setLegaleNome, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('legale_rappresentante_nome') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('legale_rappresentante_nome') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cognome Legale Rappresentante</label>
            <input 
              type="text" name="legale_rappresentante_cognome" value={legaleCognome} 
              onChange={(e) => handleFieldChange('legale_rappresentante_cognome', setLegaleCognome, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('legale_rappresentante_cognome') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('legale_rappresentante_cognome') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nome Referente Operativo</label>
            <input 
              type="text" name="referente_progetto_nome" value={referenteNome} 
              onChange={(e) => handleFieldChange('referente_progetto_nome', setReferenteNome, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('referente_progetto_nome') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('referente_progetto_nome') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cognome Referente</label>
            <input 
              type="text" name="referente_progetto_cognome" value={referenteCognome} 
              onChange={(e) => handleFieldChange('referente_progetto_cognome', setReferenteCognome, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('referente_progetto_cognome') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('referente_progetto_cognome') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ruolo (Coordinatore, Segretario...)</label>
            <input 
              type="text" name="referente_progetto_ruolo" value={referenteRuolo} 
              onChange={(e) => handleFieldChange('referente_progetto_ruolo', setReferenteRuolo, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('referente_progetto_ruolo') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('referente_progetto_ruolo') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>
        </div>
      </div>

      {/* 📞 CARD 04: CONTATTI & DIGITAL */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/80 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-sm font-black">04</span>
          Contatti & Digital
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email Istituzionale Pubblica</label>
            <input 
              type="email" name="email_associazione" value={emailAssociazione} 
              onChange={(e) => handleFieldChange('email_associazione', setEmailAssociazione, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('email_associazione') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('email_associazione') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">PEC (Obbligatoria RUNTS)</label>
            <input 
              type="email" name="pec" value={pec} 
              onChange={(e) => handleFieldChange('pec', setPec, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('pec') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('pec') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sito Web Istituzionale</label>
            <input 
              type="text" name="sito_web" value={sitoWeb} 
              onChange={(e) => handleFieldChange('sito_web', setSitoWeb, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('sito_web') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('sito_web') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Telefono Contatto</label>
            <input 
              type="tel" name="telefono" value={telefono} 
              onChange={(e) => handleFieldChange('telefono', setTelefono, e.target.value)} 
              className={`w-full rounded-2xl px-6 py-4 font-bold border-none outline-none transition-all duration-300 ${aiFields.includes('telefono') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 pr-16' : 'bg-slate-50'}`} 
            />
            {aiFields.includes('telefono') && <span className="absolute right-4 bottom-4 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none">✨ AI</span>}
          </div>
        </div>
      </div>

      {/* 📊 CARD 05: STATISTICHE ENTE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/80 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-sm font-black">05</span>
          Statistiche Ente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Numero Soci</label>
            <input 
              type="number" name="num_soci" value={numSoci} 
              onChange={(e) => setNumSoci(e.target.value)} 
              className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Volontari Attivi</label>
            <input 
              type="number" name="num_volontari_attivi" value={numVolontari} 
              onChange={(e) => setNumVolontari(e.target.value)} 
              className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Staff Dipendente</label>
            <input 
              type="number" name="num_dipendenti" value={numDipendenti} 
              onChange={(e) => setNumDipendenti(e.target.value)} 
              className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none outline-none" 
            />
          </div>
        </div>
      </div>

      {/* 🎯 CARD 06: AMBITI ART. 5 */}
      <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-slate-100/80 shadow-xs space-y-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-sm font-black">06</span>
            Settori di Intervento (Art. 5 CTS)
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed">Seleziona le aree operative dell'ente basate sull'Articolo 5 del Codice Terzo Settore. L'AI applicherà automaticamente i suggerimenti dedotti dal sito.</p>
        </div>

        <div className="space-y-8 min-h-[300px]">
          {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
            <div key={categoria} className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{categoria}</span>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {tagsInCat.map((tag: any) => {
                  const active = tags.includes(tag.id)
                  return (
                    <button 
                      key={tag.id} 
                      type="button" 
                      onClick={() => handleSelectTag(tag)} 
                      className={`transition-all duration-300 rounded-xl ${
                        active 
                          ? 'ring-2 ring-slate-900 scale-105 shadow-xs' 
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <TagBadge nome={tag.name} categoria={tag.categoria} size="md" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-50 relative">
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">La vostra Missione & Attività (Bio)</label>
          <textarea 
            name="descrizione" 
            value={descrizione} 
            onChange={(e) => handleFieldChange('descrizione', setDescrizione, e.target.value)} 
            rows={6} 
            className={`w-full rounded-[2rem] px-8 py-6 font-medium border-none outline-none resize-none transition-all duration-300 ${aiFields.includes('descrizione') ? 'bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950' : 'bg-slate-50'}`} 
            placeholder="Descrivi l'impatto istituzionale, gli scopi statutari e le principali attività rivolte al territorio..." 
          />
          {aiFields.includes('descrizione') && (
            <span className="absolute right-6 bottom-8 text-[10px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse pointer-events-none z-20">✨ AI Bio</span>
          )}
        </div>
      </div>

      {/* TASTO SALVA PERSISTENTE */}
      <div className="sticky bottom-6 z-50 mt-10">
        <button 
          type="submit" 
          disabled={loading || uploadingImage} 
          className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.5rem] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-lg"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full" />
              Sincronizzazione dati in corso...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Aggiorna Profilo Ente
            </>
          )}
        </button>
      </div>
    </form>
  )
}