'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PersonalizzaPagina() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // STATI DEL FORM E DELLA PREVIEW
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Dati Base Associazione
  const [nomeAssociazione, setNomeAssociazione] = useState('La Tua Associazione')
  const [logoUrl, setLogoUrl] = useState('')
  const [formaGiuridica, setFormaGiuridica] = useState('ETS')

  // Dati Grafica
  const [coloreBrand, setColoreBrand] = useState('#000000') 
  const [coverUrl, setCoverUrl] = useState('')
  const [tagline, setTagline] = useState('')
  const [chiSiamo, setChiSiamo] = useState('')
  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')
  const [sitoWeb, setSitoWeb] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [stats, setStats] = useState([
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' }
  ])

  // Stato posizioni reali 
  const [posizioni, setPosizioni] = useState<any[]>([])
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  // CARICAMENTO INIZIALE
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)

        const { data: assoc } = await supabase.from('associazioni').select('denominazione, logo_url, forma_giuridica').eq('id', user.id).single()
        if (assoc) {
          setNomeAssociazione(assoc.denominazione)
          if (assoc.logo_url) setLogoUrl(assoc.logo_url)
          if (assoc.forma_giuridica) setFormaGiuridica(assoc.forma_giuridica) 
        }

        const { data: grafica } = await supabase.from('associazioni_grafica').select('*').eq('associazione_id', user.id).single()
        if (grafica) {
          if (grafica.colore_brand) setColoreBrand(grafica.colore_brand)
          if (grafica.cover_url) setCoverUrl(grafica.cover_url)
          if (grafica.tagline) setTagline(grafica.tagline)
          if (grafica.chi_siamo) setChiSiamo(grafica.chi_siamo)
          if (grafica.mission) setMission(grafica.mission)
          if (grafica.vision) setVision(grafica.vision)
          if (grafica.sito_web) setSitoWeb(grafica.sito_web)
          if (grafica.instagram) setInstagram(grafica.instagram)
          if (grafica.facebook) setFacebook(grafica.facebook)
          
          if (grafica.statistiche && grafica.statistiche.length > 0) {
            const loadedStats = [...grafica.statistiche]
            while (loadedStats.length < 3) loadedStats.push({ label: '', value: '' })
            setStats(loadedStats.slice(0, 3))
          }
        }

        const { data: posizioniRaw } = await supabase
          .from('posizioni')
          .select('*, media_associazioni(url)')
          .eq('associazione_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)
          
        if (posizioniRaw) {
          setPosizioni(posizioniRaw)
        }
      } catch (err) {
        console.error("Errore nel caricamento:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [supabase, router])

  // SALVATAGGIO
  const handleSave = async () => {
    if (!userId) return
    setIsSaving(true)
    
    const statistichePulite = stats.filter(s => s.label && s.value)
    const payload = {
      associazione_id: userId,
      colore_brand: coloreBrand,
      cover_url: coverUrl || null,
      tagline: tagline,
      chi_siamo: chiSiamo,
      mission: mission,
      vision: vision,
      sito_web: sitoWeb || null,
      instagram: instagram || null,
      facebook: facebook || null,
      statistiche: statistichePulite,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('associazioni_grafica').upsert(payload)

    if (error) {
      alert(`Errore salvataggio: ${error.message}`)
      setIsSaving(false)
      return
    }
    router.push(`/associazione/${userId}`)
  }

  const updateStat = (index: number, field: 'label' | 'value', val: string) => {
    const newStats = [...stats]
    newStats[index][field] = val
    setStats(newStats)
  }

  // FORMATTAZIONE SICURA ANTI-CRASH
  const formattaOra = (ora: any) => {
    if (typeof ora === 'string' && ora.length >= 5) return ora.substring(0, 5)
    return '--:--'
  }

  const getCompetenzeSicure = (p: any) => {
    if (p.competenze_nomi && Array.isArray(p.competenze_nomi)) return p.competenze_nomi.map((n: string) => ({ name: n }))
    if (p.competenze && Array.isArray(p.competenze)) return p.competenze
    return []
  }

  const inputClass = "w-full bg-white border border-slate-300 text-slate-900 text-[15px] rounded-xl px-4 py-3.5 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 font-medium">Caricamento editor...</div>

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      
      {/* ================= MODALE AI PREMIUM ================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsAiModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-black mb-2">Compilazione assistita</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Inserisci il link del tuo sito web o dei social. Analizzeremo i contenuti per generare Mission, Vision e Chi Siamo automaticamente.</p>
            <input type="url" placeholder="https://www.tuosito.it" className={inputClass + " mb-6"} />
            <button onClick={() => setIsAiModalOpen(false)} className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
              Analizza e Genera
            </button>
          </div>
        </div>
      )}

      {/* ================= COLONNA SINISTRA: EDITOR (35%) ================= */}
      <div className="w-full lg:w-[35%] bg-white border-r border-slate-200 h-screen overflow-y-auto p-6 md:p-10">
        
        <div className="flex items-center gap-4 mb-10">
          <Link href={`/associazione/${userId}`} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-black tracking-tight">Personalizza Pagina</h1>
        </div>

        <div onClick={() => setIsAiModalOpen(true)} className="mb-10 p-6 rounded-2xl bg-slate-900 text-white cursor-pointer hover:bg-black transition-colors group flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" /></svg>
             <span className="text-xs font-bold uppercase tracking-widest">Integrazione AI</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">Scrittura Automatica</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Genera i testi della tua vetrina partendo dal tuo sito web attuale in un click.</p>
        </div>

        <div className="space-y-12 pb-32">
          {/* Stile Visivo */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-black border-b border-slate-100 pb-3">Stile Visivo</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Colore Brand</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input type="color" value={coloreBrand} onChange={(e) => setColoreBrand(e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer border-0 bg-transparent opacity-0 absolute inset-0" />
                  <div className="h-12 w-12 rounded-full border-2 border-slate-200 shadow-sm" style={{ backgroundColor: coloreBrand }}></div>
                </div>
                <span className="text-sm text-slate-500 font-mono uppercase">{coloreBrand}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Immagine di Copertina (URL)</label>
              <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
          </div>

          {/* Testi */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-black border-b border-slate-100 pb-3">Contenuti</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Es. Costruiamo un futuro migliore" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Chi Siamo</label>
              <textarea value={chiSiamo} onChange={(e) => setChiSiamo(e.target.value)} rows={4} placeholder="La vostra storia..." className={`${inputClass} resize-none`} />
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mission</label>
                <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} placeholder="Cosa fate ogni giorno" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vision</label>
                <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={3} placeholder="Il vostro sogno per il futuro" className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>

          {/* Statistiche */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-black border-b border-slate-100 pb-3">Numeri Chiave</h2>
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{i + 1}</span>
                    <h3 className="text-sm font-bold text-slate-800">Statistica {i + 1}</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Valore</label>
                      <input type="text" value={stats[i].value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="Es. 50+, 1999" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cosa rappresenta</label>
                      <input type="text" value={stats[i].label} onChange={(e) => updateStat(i, 'label', e.target.value)} placeholder="Es. Volontari attivi" className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Presenza Online */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-black border-b border-slate-100 pb-3">Presenza Online</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sito Web</label>
              <input type="url" value={sitoWeb} onChange={(e) => setSitoWeb(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Instagram (URL)</label>
                <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Facebook (URL)</label>
                <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full lg:w-[35%] bg-white border-t border-slate-200 p-6 z-50">
          <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center">
            {isSaving ? 'Salvataggio in corso...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>

      {/* ================= COLONNA DESTRA: LIVE PREVIEW (65%) ================= */}
      <div className="hidden lg:block lg:w-[65%] bg-slate-50 h-screen overflow-y-auto p-12 relative">
        <div className="sticky top-6 w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            
            {/* HERO PREVIEW */}
            <div className="relative pt-16 pb-24 px-12 text-white bg-slate-950">
              {coverUrl && (
                <div className="absolute inset-0">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 bg-slate-950/20"></div> 
                </div>
              )}
              
              <div className="relative z-10 flex flex-col items-start gap-6">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold shadow-md overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : nomeAssociazione.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-widest bg-white/20 backdrop-blur-sm">{formaGiuridica}</span>
                    {tagline && <span className="text-white/90 font-medium text-base">· {tagline}</span>}
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">{nomeAssociazione}</h2>
                </div>
              </div>
            </div>

            {/* BODY PREVIEW */}
            <div className="px-12 py-16 bg-white">
              
              {/* Box Numeri */}
              {stats.some(s => s.label && s.value) && (
                <div className="flex flex-wrap justify-start gap-12 md:gap-24 mb-16 border-b border-slate-100 pb-12">
                  {stats.filter(s => s.label && s.value).map((s, i) => (
                    <div key={i}>
                      <div className="text-4xl font-bold tracking-tight" style={{ color: coloreBrand }}>{s.value}</div>
                      <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-16">
                <div className="col-span-2 space-y-12">
                  {chiSiamo && (
                    <section>
                      <h3 className="text-xl font-bold text-black mb-4">Chi Siamo</h3>
                      <p className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">{chiSiamo}</p>
                    </section>
                  )}
                  {(mission || vision) && (
                    <div className="grid grid-cols-2 gap-8">
                      {mission && (
                        <section>
                          <h3 className="text-lg font-bold text-black mb-3">La nostra Mission</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{mission}</p>
                        </section>
                      )}
                      {vision && (
                        <section>
                          <h3 className="text-lg font-bold text-black mb-3">La nostra Vision</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{vision}</p>
                        </section>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  {(sitoWeb || instagram || facebook) && (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Link Utili</h3>
                      <div className="flex flex-col gap-4">
                        {sitoWeb && <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">Sito Web <span className="text-slate-400">↗</span></div>}
                        {instagram && <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">Instagram <span className="text-slate-400">↗</span></div>}
                        {facebook && <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">Facebook <span className="text-slate-400">↗</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* === SEZIONE POSIZIONI APERTE (MOCK SICURO + COLORE REATTIVO) === */}
              <div className="mt-20 border-t border-slate-100 pt-16">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-bold text-black tracking-tight">Posizioni aperte</h3>
                  <span className="bg-slate-100 text-slate-700 px-5 py-1.5 rounded-full font-bold text-lg">
                    {posizioni.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posizioni.length > 0 ? (
                    posizioni.map(p => {
                      const imgUrl = p.media_associazioni?.url || p.immagine?.url || p.immagine_url || null;
                      const iniziale = p.titolo ? String(p.titolo).charAt(0).toUpperCase() : 'V';
                      const compSafe = getCompetenzeSicure(p);

                      return (
                        <div 
                          key={p.id} 
                          className="block group cursor-pointer"
                          style={{ '--brand-color': coloreBrand } as React.CSSProperties} // Variabile CSS Magica!
                        >
                          <div className="rounded-3xl shadow-sm border border-slate-100 transition-all duration-300 overflow-hidden bg-white flex flex-col h-full hover:shadow-xl hover:-translate-y-1">
                            
                            {/* HEADER VISIVO */}
                            <div className="relative shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center w-full h-36 md:h-40 border-b border-slate-100">
                              {imgUrl ? (
                                <img 
                                  src={imgUrl} 
                                  alt={p.titolo || 'Copertina'} 
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center transition-colors duration-500">
                                  <span className="text-slate-300 font-black text-5xl">{iniziale}</span>
                                </div>
                              )}
                            </div>

                            {/* CONTENUTO CARD */}
                            <div className="flex flex-col flex-grow p-5 md:p-6 min-w-0">
                              <div className="flex flex-col mb-3">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                  {p.tipo === 'una_tantum' ? (
                                    <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Evento Singolo
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-900 uppercase tracking-widest">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span> Ricorrente
                                    </span>
                                  )}

                                  {/* Icona che cambia colore al passaggio del mouse grazie alla var CSS */}
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-slate-50 text-slate-400 group-hover:bg-[var(--brand-color)] group-hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                  </div>
                                </div>

                                {/* Titolo che prende il colore brand */}
                                <h3 className="text-lg font-bold mb-1.5 leading-tight transition-colors line-clamp-2 text-slate-900 group-hover:text-[var(--brand-color)]">
                                  {p.titolo || 'Senza Titolo'}
                               </h3>
                                
                                <p className="text-slate-500 text-sm mb-3 line-clamp-2 font-medium leading-relaxed flex-grow">
                                  {p.descrizione || 'Nessuna descrizione presente.'}
                                </p>
                              </div>

                              <div className="mt-auto">
                                {compSafe.length > 0 && (
                                  <div className="flex items-center gap-1.5 mb-4 w-full overflow-hidden">
                                    {compSafe.slice(0, 2).map((comp: any, idx: number) => (
                                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200">
                                        <span className="truncate">{comp.name || comp}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                                  <div className="flex items-center text-xs font-bold text-slate-700 min-w-0 gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                    <span className="truncate">{p.dove || 'Da definire'}</span>
                                  </div>
                                  <div className="flex items-center text-xs font-bold text-slate-700 min-w-0 gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="flex-shrink-0">{p.quando || 'Da definire'} · {formattaOra(p.ora_inizio)}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-1 md:col-span-2 p-12 border border-slate-200 rounded-3xl bg-slate-50 text-center">
                      <p className="text-slate-500 text-sm font-medium">Nessun annuncio attivo al momento.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  )
}