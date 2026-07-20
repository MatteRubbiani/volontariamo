'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
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
  // --- STATI CONTROLLATI
  // ==========================================
  const [denominazione, setDenominazione] = useState(profilo.denominazione || '')
  const [formaGiuridica, setFormaGiuridica] = useState(profilo.forma_giuridica || '')
  const [partitaIva, setPartitaIva] = useState(profilo.partita_iva || '')
  const [annoFondazione, setAnnoFondazione] = useState(profilo.anno_fondazione || '')

  const [isIscrittoRunts, setIsIscrittoRunts] = useState(profilo.is_iscritto_runts || false)
  const [runtsRepertorio, setRuntsRepertorio] = useState(profilo.runts_repertorio || '')
  const [runtsSezione, setRuntsSezione] = useState(profilo.runts_sezione || '')
  const [runtsData, setRuntsData] = useState(profilo.runts_data_iscrizione || '')

  const [indirizzo, setIndirizzo] = useState(profilo.indirizzo || '')
  const [cap, setCap] = useState(profilo.cap || '')
  const [provincia, setProvincia] = useState(profilo.provincia || '')
  const [legaleNome, setLegaleNome] = useState(profilo.legale_rappresentante_nome || '')
  const [legaleCognome, setLegaleCognome] = useState(profilo.legale_rappresentante_cognome || '')
  const [referenteNome, setReferenteNome] = useState(profilo.referente_progetto_nome || '')
  const [referenteCognome, setReferenteCognome] = useState(profilo.referente_progetto_cognome || '')
  const [referenteRuolo, setReferenteRuolo] = useState(profilo.referente_progetto_ruolo || '')

  const [emailAssociazione, setEmailAssociazione] = useState(profilo.email_associazione || '')
  const [pec, setPec] = useState(profilo.pec || '')
  const [sitoWeb, setSitoWeb] = useState(profilo.sito_web || '')
  const [telefono, setTelefono] = useState(profilo.telefono || '')

  const [numSoci, setNumSoci] = useState(profilo.num_soci || '')
  const [numVolontari, setNumVolontari] = useState(profilo.num_volontari_attivi || '')
  const [numDipendenti, setNumDipendenti] = useState(profilo.num_dipendenti || '')

  const [descrizione, setDescrizione] = useState(profilo.descrizione || '')

  const [openSection, setOpenSection] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>(tagsIniziali || [])
  
  // 🟢 LOGO MASTER: Legge la colonna principale logo_url o la prop vetrina
  const [fotoUrl, setFotoUrl] = useState(profilo.logo_url || profilo.logo_url_vetrina || '') 
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [urlMagic, setUrlMagic] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<string>('')
  const [aiFields, setAiFields] = useState<string[]>([]) 
  const [descrizioneAttiva, setDescrizioneAttiva] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const handleFieldChange = (fieldKey: string, setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value)
    setAiFields(prev => prev.includes(fieldKey) ? prev.filter(k => k !== fieldKey) : prev)
  }

  const tagsRaggruppati = useMemo(() => {
    return allTags?.reduce((acc: any, tag: any) => {
      const cat = tag.categoria || 'Altro';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tag);
      return acc;
    }, {})
  }, [allTags])

  const handleSelectTag = (tag: any) => {
    setTags(prev => prev.includes(tag.id) ? prev.filter(item => item !== tag.id) : [...prev, tag.id])
    setDescrizioneAttiva(tag.description)
    setShowToast(true)
  }

  const handleMagicOnboarding = async () => {
    if (!urlMagic) return
    setMagicLoading(true)
    setError(null)
    setAiFields([]) 

    setLoadingPhase("Connessione...")
    const timer1 = setTimeout(() => setLoadingPhase("Scraping in corso..."), 1200)

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
        if (d.logo_suggerito) { setFotoUrl(d.logo_suggerito); updatedKeys.push('logo_url'); }
        if (d.tags_suggeriti && d.tags_suggeriti.length > 0) { setTags(d.tags_suggeriti); }
        
        setAiFields(updatedKeys)
        setDescrizioneAttiva("✨ Scansione completata! Campi compilati ed evidenziati.")
        setShowToast(true)
        setOpenSection(1)
      } else {
        setError(result.error || "Estrazione non riuscita su questo dominio.")
      }
    } catch (err) { setError("Errore imprevisto durante l'analisi.") } finally {
      clearTimeout(timer1)
      setMagicLoading(false)
      setLoadingPhase('')
    }
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // 🟢 UPLOAD SU BUCKET 'media_associazioni' / CARTELLE 'images/'
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true)
      setError(null)
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `images/${profilo.id || 'asso'}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('media_associazioni')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media_associazioni')
        .getPublicUrl(fileName)

      setFotoUrl(publicUrl)
      setAiFields(prev => prev.filter(k => k !== 'logo_url'))
    } catch (err: any) { 
      console.error("❌ Error Uploading Logo:", err)
      setError("Errore caricamento logo: " + err.message) 
    } finally { 
      setUploadingImage(false) 
    }
  }

  const handleRemoveLogo = () => {
    setFotoUrl('')
    setAiFields(prev => prev.filter(k => k !== 'logo_url'))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    formData.append('tags_selezionati', JSON.stringify(tags))
    formData.set('logo_url', fotoUrl) // 🟢 Passiamo il valore finale pulito
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
      else { router.push('/app/profilo'); router.refresh(); }
    } catch (err) { setError("Errore di salvataggio interno."); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[540px] mx-auto flex flex-col gap-5 pb-24 font-sans antialiased">
      {/* 🟢 INPUT NASCOSTI DI SICUREZZA */}
      <input type="hidden" name="codice_fiscale" value={profilo.codice_fiscale || ''} />
      <input type="hidden" name="logo_url" value={fotoUrl} />

      {showToast && descrizioneAttiva && (
        <div className="fixed top-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-medium border border-white/5">
            {descrizioneAttiva}
          </div>
        </div>
      )}

      {/* 🪄 ASSISTENTE AI */}
      <div className="border border-slate-100 rounded-3xl p-5 flex flex-col gap-3 shrink-0">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-950">Compilazione Istantanea AI</h3>
          <p className="text-xs text-slate-500 font-normal">Incolla l'URL del vostro sito web per popolare i campi.</p>
        </div>
        <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl gap-2 items-center">
          <input type="url" placeholder="https://www.esempio.it" className="bg-transparent flex-1 text-slate-900 placeholder:text-slate-400 pl-3 py-1 text-xs font-medium outline-none border-none focus:ring-0" value={urlMagic} onChange={(e) => setUrlMagic(e.target.value)} />
          <button type="button" onClick={handleMagicOnboarding} disabled={magicLoading || !urlMagic} className="bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-black transition-all disabled:bg-slate-100 disabled:text-slate-400 shrink-0 min-w-[90px]">
            {magicLoading ? <span className="flex items-center gap-1.5 justify-center"><span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /><span className="text-[10px] truncate max-w-[50px]">{loadingPhase || 'Analisi'}</span></span> : 'Analizza'}
          </button>
        </div>
      </div>

      {error && <div className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 p-4 rounded-2xl">{error}</div>}

      {/* 🟢 SEZIONE 1: IDENTITÀ & LOGO */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 1 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 1 && setOpenSection(1)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">01. Identità & Logo</span>
          {openSection !== 1 && <span className="text-xs font-medium text-slate-800 truncate max-w-[220px]">{denominazione || 'Ente'}</span>}
        </div>

        {openSection === 1 && (
          <div className="flex flex-col gap-4 mt-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div 
  className={`w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group cursor-pointer shadow-xs ${aiFields.includes('logo_url') ? 'ring-2 ring-emerald-500' : ''}`} 
  onClick={() => fileInputRef.current?.click()}
>
  {fotoUrl ? (
    <img src={fotoUrl} className="w-full h-full object-cover" alt="Logo Ente" />
  ) : (
    <span className="text-xs text-slate-400 font-bold">Logo</span>
  )}
  {uploadingImage && (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
      <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
    </div>
  )}
</div>
              <div className="space-y-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-slate-900 block hover:underline">
                  Cambia logo...
                </button>
                {fotoUrl && (
                  <button type="button" onClick={handleRemoveLogo} className="text-[11px] font-medium text-rose-600 block hover:underline">
                    Rimuovi
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleUploadLogo} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input type="text" value={denominazione} onChange={(e) => handleFieldChange('denominazione', setDenominazione, e.target.value)} placeholder="Denominazione Completa *" className={`w-full rounded-xl border px-4 py-2.5 text-xs font-medium outline-none ${aiFields.includes('denominazione') ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'}`} required />
                {aiFields.includes('denominazione') && <span className="absolute right-3 bottom-3 text-[9px] font-bold text-emerald-600 animate-pulse">✨ AI</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formaGiuridica} onChange={(e) => handleFieldChange('forma_giuridica', setFormaGiuridica, e.target.value)} placeholder="Forma Giuridica (es. APS) *" className={`w-full rounded-xl border px-4 py-2.5 text-xs font-medium outline-none ${aiFields.includes('forma_giuridica') ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'}`} required />
                <input type="text" value={partitaIva} onChange={(e) => handleFieldChange('partita_iva', setPartitaIva, e.target.value)} placeholder="Partita IVA (Opzionale)" className={`w-full rounded-xl border px-4 py-2.5 text-xs font-medium outline-none ${aiFields.includes('partita_iva') ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={profilo.codice_fiscale || ''} className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-mono font-medium text-slate-500 cursor-not-allowed" readOnly />
                <input type="number" value={annoFondazione} onChange={(e) => handleFieldChange('anno_fondazione', setAnnoFondazione, e.target.value)} placeholder="Anno Fondazione" className={`w-full rounded-xl border px-4 py-2.5 text-xs font-medium outline-none ${aiFields.includes('anno_fondazione') ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'}`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🟢 SEZIONE 2: REGISTRO RUNTS */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 2 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 2 && setOpenSection(2)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">02. Registro RUNTS</span>
          {openSection !== 2 && <span className="text-xs font-medium text-slate-800">{isIscrittoRunts ? 'Iscritto' : 'Non iscritto'}</span>}
        </div>
        {openSection === 2 && (
          <div className="flex flex-col gap-4 mt-5 animate-in fade-in duration-200">
            <label className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700">L'organizzazione è iscritta al RUNTS?</span>
              <input type="checkbox" checked={isIscrittoRunts} onChange={(e) => setIsIscrittoRunts(e.target.checked)} className="rounded text-slate-900 accent-slate-900 w-4 h-4 focus:ring-0" />
            </label>
            {isIscrittoRunts && (
              <div className="grid grid-cols-1 gap-3 pt-1">
                <input type="text" value={runtsRepertorio} onChange={(e) => setRuntsRepertorio(e.target.value)} placeholder="Numero Repertorio" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={runtsSezione} onChange={(e) => setRuntsSezione(e.target.value)} placeholder="Sezione RUNTS" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" />
                  <input type="date" value={runtsData} onChange={(e) => setRuntsData(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 outline-none" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🟢 SEZIONE 3: SEDE & GOVERNANCE */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 3 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 3 && setOpenSection(3)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">03. Sede & Governance</span>
          {openSection !== 3 && <span className="text-xs font-medium text-slate-800 truncate max-w-[200px]">{indirizzo || 'Geolocalizzazione'}</span>}
        </div>
        {openSection === 3 && (
          <div className="flex flex-col gap-4 mt-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-4 gap-2">
              <input type="text" value={indirizzo} onChange={(e) => handleFieldChange('indirizzo', setIndirizzo, e.target.value)} placeholder="Via e civico" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium col-span-2 outline-none" />
              <input type="text" value={cap} onChange={(e) => handleFieldChange('cap', setCap, e.target.value)} placeholder="CAP" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium col-span-1 outline-none text-center" />
              <input type="text" value={provincia} onChange={(e) => handleFieldChange('provincia', setProvincia, e.target.value)} placeholder="PR" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium col-span-1 outline-none uppercase text-center" maxLength={2} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <input type="text" value={legaleNome} onChange={(e) => handleFieldChange('legale_rappresentante_nome', setLegaleNome, e.target.value)} placeholder="Nome Legale Rappr." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none" />
              <input type="text" value={legaleCognome} onChange={(e) => handleFieldChange('legale_rappresentante_cognome', setLegaleCognome, e.target.value)} placeholder="Cognome Legale Rappr." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              <input type="text" value={referenteNome} onChange={(e) => handleFieldChange('referente_progetto_nome', setReferenteNome, e.target.value)} placeholder="Nome Ref. *" className="w-full rounded-xl border border-slate-200 px-2.5 py-2.5 text-xs font-medium outline-none" required />
              <input type="text" value={referenteCognome} onChange={(e) => handleFieldChange('referente_progetto_cognome', setReferenteCognome, e.target.value)} placeholder="Cognome Ref. *" className="w-full rounded-xl border border-slate-200 px-2.5 py-2.5 text-xs font-medium outline-none" required />
              <input type="text" value={referenteRuolo} onChange={(e) => handleFieldChange('referente_progetto_ruolo', setReferenteRuolo, e.target.value)} placeholder="Ruolo *" className="w-full rounded-xl border border-slate-200 px-2.5 py-2.5 text-xs font-medium outline-none" required />
            </div>
          </div>
        )}
      </div>

      {/* 🟢 SEZIONE 4: CONTATTI & DIGITAL */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 4 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 4 && setOpenSection(4)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">04. Contatti & Digital</span>
          {openSection !== 4 && <span className="text-xs font-medium text-slate-800 truncate max-w-[200px]">{emailAssociazione || 'Recapiti'}</span>}
        </div>
        {openSection === 4 && (
          <div className="flex flex-col gap-3 mt-5 animate-in fade-in duration-200">
            <input type="email" value={emailAssociazione} onChange={(e) => handleFieldChange('email_associazione', setEmailAssociazione, e.target.value)} placeholder="Email Pubblica *" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" required />
            <input type="email" value={pec} onChange={(e) => handleFieldChange('pec', setPec, e.target.value)} placeholder="PEC Ufficiale" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={sitoWeb} onChange={(e) => handleFieldChange('sito_web', setSitoWeb, e.target.value)} placeholder="Sito Web" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" />
              <input type="tel" value={telefono} onChange={(e) => handleFieldChange('telefono', setTelefono, e.target.value)} placeholder="Telefono" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* 🟢 SEZIONE 5: IMPATTO & STATISTICHE */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 5 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 5 && setOpenSection(5)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">05. Statistiche & Risorse</span>
          {openSection !== 5 && <span className="text-xs font-medium text-slate-800">{numVolontari || 0} Volontari attivi</span>}
        </div>
        {openSection === 5 && (
          <div className="grid grid-cols-3 gap-3 mt-5 animate-in fade-in duration-200">
            <div><label className="text-[9px] font-bold uppercase text-slate-400 block mb-1 ml-0.5">Soci</label><input type="number" value={numSoci} onChange={(e) => setNumSoci(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-center outline-none" /></div>
            <div><label className="text-[9px] font-bold uppercase text-slate-400 block mb-1 ml-0.5">Volontari</label><input type="number" value={numVolontari} onChange={(e) => setNumVolontari(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-center outline-none" /></div>
            <div><label className="text-[9px] font-bold uppercase text-slate-400 block mb-1 ml-0.5">Dipendenti</label><input type="number" value={numDipendenti} onChange={(e) => setNumDipendenti(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-center outline-none" /></div>
          </div>
        )}
      </div>

      {/* 🟢 SEZIONE 6: AMBITI ART. 5 & MISSION */}
      <div className={`border rounded-[2rem] p-5 transition-all duration-300 ${openSection === 6 ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/40 cursor-pointer hover:bg-slate-50'}`} onClick={() => openSection !== 6 && setOpenSection(6)}>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">06. Missione & Ambiti CTS</span>
          {openSection !== 6 && <span className="text-xs font-medium text-slate-800">{tags.length} ambiti configurati</span>}
        </div>
        {openSection === 6 && (
          <div className="flex flex-col gap-4 mt-5 animate-in fade-in duration-200">
            <textarea value={descrizione} onChange={(e) => handleFieldChange('descrizione', setDescrizione, e.target.value)} rows={4} className={`w-full rounded-2xl border p-4 text-xs font-medium outline-none resize-none leading-relaxed ${aiFields.includes('descrizione') ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200'}`} placeholder="Descrivi gli scopi istituzionali e la vostra missione statutaria..." />
            <div className="space-y-4 pt-2 border-t border-slate-100 max-h-[220px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
              {tagsRaggruppati && Object.entries(tagsRaggruppati).map(([categoria, tagsInCat]: [string, any]) => (
                <div key={categoria} className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">{categoria}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsInCat.map((tag: any) => {
                      const active = tags.includes(tag.id)
                      return (
                        <button key={tag.id} type="button" onClick={() => handleSelectTag(tag)} className={`px-2.5 py-1.5 rounded-xl border text-left text-[11px] font-medium transition-all ${active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AZIONE DI SALVATAGGIO */}
      <button type="submit" disabled={loading || uploadingImage} className="w-full bg-slate-950 text-white py-4 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 shadow-md flex items-center justify-center gap-2 mt-4 shrink-0">
        {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span>Applica tutte le modifiche</span>}
      </button>
    </form>
  )
}