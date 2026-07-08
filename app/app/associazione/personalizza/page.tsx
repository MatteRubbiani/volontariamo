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
  
  // Dati Base Associazione (Solo lettura per la preview)
  const [nomeAssociazione, setNomeAssociazione] = useState('La Tua Associazione')
  const [logoUrl, setLogoUrl] = useState('')
  const [formaGiuridica, setFormaGiuridica] = useState('ETS')

  // Dati Grafica (Modificabili)
  const [coloreBrand, setColoreBrand] = useState('#0f172a')
  const [coverUrl, setCoverUrl] = useState('')
  const [tagline, setTagline] = useState('')
  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')
  const [stats, setStats] = useState([
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' }
  ])

  // CARICAMENTO INIZIALE
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      // 1. Carica nome e logo per la preview
      const { data: assoc } = await supabase.from('associazioni').select('denominazione, logo_url, forma_giuridica').eq('id', user.id).single()
      if (assoc) {
        setNomeAssociazione(assoc.denominazione)
        if (assoc.logo_url) setLogoUrl(assoc.logo_url)
        // CORRETTO: forma_giuridica invece di formaGiuridica
        if (assoc.forma_giuridica) setFormaGiuridica(assoc.forma_giuridica) 
      }

      // 2. Carica i dati grafici
      const { data: grafica } = await supabase.from('associazioni_grafica').select('*').eq('associazione_id', user.id).single()
      if (grafica) {
        if (grafica.colore_brand) setColoreBrand(grafica.colore_brand)
        if (grafica.cover_url) setCoverUrl(grafica.cover_url)
        if (grafica.tagline) setTagline(grafica.tagline)
        if (grafica.mission) setMission(grafica.mission)
        if (grafica.vision) setVision(grafica.vision)
        
        if (grafica.statistiche && grafica.statistiche.length > 0) {
          const loadedStats = [...grafica.statistiche]
          while (loadedStats.length < 3) loadedStats.push({ label: '', value: '' })
          setStats(loadedStats.slice(0, 3))
        }
      }
      setIsLoading(false)
    }
    loadData()
  }, [supabase, router])

  // SALVATAGGIO DATI SICURO
  const handleSave = async () => {
    if (!userId) return
    setIsSaving(true)
    
    const statistichePulite = stats.filter(s => s.label && s.value)

    const { error } = await supabase.from('associazioni_grafica').upsert({
      associazione_id: userId,
      colore_brand: coloreBrand,
      cover_url: coverUrl,
      tagline: tagline,
      mission: mission,
      vision: vision,
      statistiche: statistichePulite,
      updated_at: new Date().toISOString()
    })

    if (error) {
      console.error("Errore durante il salvataggio:", error)
      alert("C'è stato un problema durante il salvataggio. Riprova.")
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Caricamento editor...</div>

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* COLONNA SINISTRA: L'EDITOR (Form) - Ora prende il 35% */}
      <div className="w-full lg:w-[35%] bg-white border-r border-slate-200 h-screen overflow-y-auto p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/associazione/${userId}`} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
            ← Indietro
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Editor Vetrina</h1>
          </div>
        </div>

        <div className="space-y-8 pb-24">
          
          {/* Colore e Cover */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">1. Stile Visivo</h2>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input type="color" value={coloreBrand} onChange={(e) => setColoreBrand(e.target.value)} className="h-14 w-14 rounded-xl cursor-pointer border-0 bg-transparent shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">Colore Principale</p>
                <p className="text-xs text-slate-500">Definisce il tema della tua pagina.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Immagine di Copertina (URL)</label>
              <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Testi */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">2. Messaggio</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tagline (Il tuo motto)</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Es. Costruiamo un futuro migliore" className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">La nostra Mission (Cosa facciamo)</label>
              <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">La nostra Vision (Dove vogliamo arrivare)</label>
              <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>

          {/* Statistiche */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">3. I Numeri</h2>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <input type="text" value={stats[i].value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="Es. 50+" className="w-full bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 mb-2 font-bold text-center outline-none" />
                  <input type="text" value={stats[i].label} onChange={(e) => updateStat(i, 'label', e.target.value)} placeholder="Es. Volontari" className="w-full bg-transparent text-[10px] text-slate-500 uppercase tracking-wider text-center outline-none" />
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* FOOTER EDITOR (Fisso in basso per il 35%) */}
        <div className="fixed bottom-0 left-0 w-full lg:w-[35%] bg-white border-t border-slate-100 p-4 z-50">
          <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 flex justify-center items-center">
            {isSaving ? <span className="animate-pulse">Salvataggio in corso...</span> : 'Pubblica Modifiche'}
          </button>
        </div>
      </div>

      {/* COLONNA DESTRA: LA LIVE PREVIEW (Sticky) - Ora prende il 65% ed è molto più grande */}
      <div className="hidden lg:block lg:w-[65%] bg-slate-100 h-screen overflow-y-auto p-6 md:p-12 relative">
        <div className="sticky top-6 w-full max-w-5xl mx-auto">
          
          {/* MOCKUP DELLA PAGINA PUBBLICA */}
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 transform origin-top hover:scale-[1.01] transition-transform">
            
            {/* HERO PREVIEW */}
            <div 
              className="relative pt-12 pb-20 px-8 text-white transition-colors duration-500" 
              style={{ backgroundColor: coloreBrand }}
            >
              {coverUrl && (
                <div className="absolute inset-0">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40"></div> 
                </div>
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center mt-6">
                <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center text-slate-900 text-4xl font-black shadow-xl overflow-hidden border-4 border-white/20 mb-4">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : nomeAssociazione.charAt(0)}
                </div>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-white/20 mb-2 backdrop-blur-sm">{formaGiuridica}</span>
                <h2 className="text-4xl font-black tracking-tight drop-shadow-md">{nomeAssociazione}</h2>
                {tagline && <p className="mt-3 text-white/90 italic font-medium drop-shadow-md text-lg">"{tagline}"</p>}
              </div>
            </div>

            {/* BODY PREVIEW */}
            <div className="px-10 py-12 bg-white">
              {/* Box Numeri Preview */}
              {stats.some(s => s.label && s.value) && (
                <div className="flex justify-center divide-x divide-slate-100 bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-12 -mt-20 relative z-20 shadow-lg max-w-3xl mx-auto">
                  {stats.filter(s => s.label && s.value).map((s, i) => (
                    <div key={i} className="px-8 text-center flex-1">
                      <div className="text-3xl font-black transition-colors duration-500" style={{ color: coloreBrand }}>{s.value}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mission & Vision Preview */}
              <div className="space-y-8 text-center max-w-3xl mx-auto">
                {mission && (
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">La nostra Mission</h3>
                    <p className="text-base text-slate-700 leading-relaxed">{mission}</p>
                  </div>
                )}
                {vision && (
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">La nostra Vision</h3>
                    <p className="text-base text-slate-700 leading-relaxed">{vision}</p>
                  </div>
                )}
                {!mission && !vision && (
                  <div className="py-12 text-slate-300 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                    Compila Mission e Vision per vederle qui in anteprima.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}