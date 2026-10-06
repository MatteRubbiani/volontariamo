'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Briefcase, EyeOff, Globe, Sparkles, Archive, Trash2, Loader2, FileEdit } from 'lucide-react'
import PosizioneCard from '@/components/PosizioneCard'
import { Database } from '@/types/supabase'

export default function HubPosizioniUnificatoPage() {
  const router = useRouter()
  const [posizioni, setPosizioni] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'attive' | 'bozze' | 'storico'>('attive')

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const resolveImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from('posizioni').getPublicUrl(path)
    return data?.publicUrl || null
  }

  const fetchPosizioniEDashboardData = async () => {
    try {
      setIsLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return router.push('/auth/login')

      // Query pulita con sintassi canonica PostgREST
      const { data, error } = await (supabase.from('posizioni') as any)
        .select(`
          *,
          posizione_tags (
            tags (
              id,
              nome
            )
          ),
          candidature (
            id,
            stato
          )
        `)
        .eq('associazione_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Errore fetch posizioni associazione:", error)
        setPosizioni([])
        return
      }

      const parsedPosizioni = (data || []).map((p: any) => {
        const tagsList = (p.posizione_tags || [])
          .map((pt: any) => pt.tags)
          .filter(Boolean)
          .map((tag: any) => ({
            id: tag.id,
            nome: tag.nome,
            name: tag.nome, // Compatibilità per i componenti che leggono .name
          }))

        return {
          ...p,
          immagine_url: resolveImageUrl(p.immagine_path),
          tags: tagsList,
          candidature: p.candidature || [],
        }
      })

      setPosizioni(parsedPosizioni)
    } catch (err) {
      console.error("Errore fetch posizioni:", err)
      setPosizioni([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { 
    fetchPosizioniEDashboardData() 
  }, [])

  const handleCambiaStato = async (id: string, nuovoStato: 'pubblicata' | 'bozza' | 'archiviata') => {
    const { error } = await (supabase.from('posizioni') as any)
      .update({ stato: nuovoStato })
      .eq('id', id)

    if (!error) {
      setPosizioni(prev => prev.map(p => p.id === id ? { ...p, stato: nuovoStato } : p))
    } else {
      console.error("Errore cambio stato:", error)
    }
  }

  const handleElimina = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo annuncio? Le candidature collegate andranno perse.")) return
    const { error } = await (supabase.from('posizioni') as any)
      .delete()
      .eq('id', id)

    if (!error) {
      setPosizioni(prev => prev.filter(p => p.id !== id))
    } else {
      console.error("Errore eliminazione posizione:", error)
    }
  }

  const odierna = new Date().toISOString().split('T')[0]

  const attive = posizioni.filter(p => 
    ['pubblicata', 'aperta'].includes(p.stato) && 
    (p.tipo === 'ricorrente' || !p.data_esatta || p.data_esatta >= odierna)
  )

  const bozze = posizioni.filter(p => p.stato === 'bozza')

  const storico = posizioni.filter(p => 
    ['archiviata', 'conclusa', 'chiusa'].includes(p.stato) || 
    (['pubblicata', 'aperta'].includes(p.stato) && p.tipo === 'una_tantum' && p.data_esatta && p.data_esatta < odierna)
  )

  const currentItems = activeTab === 'attive' ? attive : activeTab === 'bozze' ? bozze : storico

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-800" /> Caricamento annunci...
      </div>
    )
  }

  return (
    <div className="max-w-[1040px] mx-auto py-10 px-4 sm:px-6 pb-32 font-sans bg-white text-slate-900 antialiased">
      
      {/* HEADER AIRBNB STYLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            I tuoi annunci
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Gestisci le opportunità, monitora le candidature e crea nuovi progetti.
          </p>
        </div>

        <Link
          href="/app/associazione/posizione/nuova"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold tracking-tight shadow-sm hover:bg-slate-800 hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-200 self-start sm:self-auto shrink-0 border border-slate-950"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crea una posizione</span>
        </Link>
      </div>

      {/* TASTI TAB */}
      <div className="flex border-b border-slate-100 gap-6 mb-8 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('attive')} 
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'attive' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Attive ({attive.length})
        </button>
        <button 
          onClick={() => setActiveTab('bozze')} 
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'bozze' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Bozze ({bozze.length})
        </button>
        <button 
          onClick={() => setActiveTab('storico')} 
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'storico' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Cronologia ({storico.length})
        </button>
      </div>

      {/* GRID INTEGRATA */}
      {currentItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentItems.map((p) => {
            const isScadutaTemporale = p.tipo === 'una_tantum' && p.data_esatta && p.data_esatta < odierna
            const candidature = p.candidature || []
            const daValutare = candidature.filter((c: any) => c.stato === 'in_attesa' || c.stato === 'in_contatto').length
            const accettati = candidature.filter((c: any) => c.stato === 'accettato').length

            return (
              <div key={p.id} className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300 hover:border-slate-200">
                
                {/* 1. Anteprima Card Reale */}
                <Link 
                  href={`/app/associazione/messaggi?filterPosizione=${p.id}`}
                  className="flex-1 block group/card bg-white p-1 transition-all duration-200 active:scale-[0.99]"
                >
                  <PosizioneCard 
                    posizione={p} 
                    ruolo="associazione" 
                    layout="horizontal"
                    isHovered={false}
                  />
                </Link>

                {/* 2. PIPELINE DELLE CANDIDATURE */}
                {p.stato !== 'bozza' && (
                  <div className="bg-slate-50/40 border-t border-slate-100/80 p-1.5 sm:px-4">
                    <Link 
                      href={`/app/associazione/messaggi?filterPosizione=${p.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-xs transition-all duration-200 border border-transparent hover:border-slate-200/50 group"
                    >
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">Da Valutare</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-base font-black ${daValutare > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{daValutare}</span>
                            {daValutare > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-200/60" />
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">Inseriti</span>
                          <span className="text-base font-black text-emerald-600">{accettati}</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400 group-hover:text-slate-900 flex items-center gap-1 transition-colors">
                        <span>Gestisci candidati</span>
                        <span className="text-sm">→</span>
                      </div>
                    </Link>
                  </div>
                )}
                
                {/* 3. BARRA CONTROLLI */}
                <div className="bg-white px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-4">
                    {activeTab === 'attive' && (
                      <button 
                        onClick={() => handleCambiaStato(p.id, 'bozza')} 
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Nascondi
                      </button>
                    )}
                    {activeTab === 'bozze' && (
                      <button 
                        onClick={() => handleCambiaStato(p.id, 'pubblicata')} 
                        className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1.5 transition-all"
                      >
                        <Globe className="w-3.5 h-3.5" /> Pubblica
                      </button>
                    )}
                    {activeTab === 'storico' && (
                      <button 
                        onClick={() => {
                          if (isScadutaTemporale) {
                            router.push(`/app/associazione/posizione/${p.id}/modifica?action=reproponi`)
                          } else {
                            handleCambiaStato(p.id, 'pubblicata')
                          }
                        }} 
                        className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-500" /> {isScadutaTemporale ? 'Aggiorna e riproponi' : 'Riattiva'}
                      </button>
                    )}
                    
                    {activeTab !== 'storico' && (
                      <Link 
                        href={`/app/associazione/posizione/${p.id}/modifica`} 
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-slate-400" /> Modifica
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'attive' && (
                      <button 
                        onClick={() => handleCambiaStato(p.id, 'archiviata')} 
                        className="p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-colors" 
                        title="Archivia"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleElimina(p.id)} 
                      className="p-1 text-slate-200 hover:text-red-500 rounded-lg transition-colors" 
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-20 px-4 text-center border border-slate-100 rounded-3xl bg-slate-50/50 max-w-lg mx-auto mt-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/60 shadow-2xs flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5 text-slate-400 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nessun annuncio in questa sezione</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
            Inizia pubblicando la prima opportunità per accogliere nuovi volontari nella tua squadra.
          </p>
          <Link
            href="/app/associazione/posizione/nuova"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Crea la prima posizione</span>
          </Link>
        </div>
      )}
    </div>
  )
}