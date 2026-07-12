'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Briefcase, EyeOff, Globe, Sparkles, Archive, Trash2, Loader2, FileEdit } from 'lucide-react'
import PosizioneCard from '@/components/PosizioneCard'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function HubPosizioniUnificatoPage() {
  const router = useRouter()
  const [posizioni, setPosizioni] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'attive' | 'bozze' | 'storico'>('attive')

  const fetchPosizioniEDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data } = await supabase.from('posizioni')
      .select(`
        *, 
        media_associazioni(url),
        tags:posizione_tags(tag:tags(id, name)),
        competenze:posizione_competenze(competenza:competenze(id, name)),
        candidature(id, stato)
      `)
      .eq('associazione_id', user.id)
      .order('created_at', { ascending: false })

    const parsedPosizioni = data?.map(p => ({
      ...p,
      tags: p.tags?.map((t: any) => t.tag).filter(Boolean),
      competenze: p.competenze?.map((c: any) => c.competenza).filter(Boolean)
    }))

    setPosizioni(parsedPosizioni || [])
    setIsLoading(false)
  }

  useEffect(() => { fetchPosizioniEDashboardData() }, [])

  const handleCambiaStato = async (id: string, nuovoStato: 'pubblicata' | 'bozza' | 'archiviata') => {
    const { error } = await supabase.from('posizioni').update({ stato: nuovoStato }).eq('id', id)
    if (!error) {
      setPosizioni(prev => prev.map(p => p.id === id ? { ...p, stato: nuovoStato } : p))
    }
  }

  const handleElimina = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo annuncio? Le candidature collegate andranno perse.")) return
    const { error } = await supabase.from('posizioni').delete().eq('id', id)
    if (!error) {
      setPosizioni(prev => prev.filter(p => p.id !== id))
    }
  }

  const odierna = new Date().toISOString().split('T')[0]

  const attive = posizioni.filter(p => p.stato === 'pubblicata' && (p.tipo === 'ricorrente' || !p.data_esatta || p.data_esatta >= odierna))
  const bozze = posizioni.filter(p => p.stato === 'bozza')
  const storico = posizioni.filter(p => p.stato === 'archiviata' || (p.stato === 'pubblicata' && p.tipo === 'una_tantum' && p.data_esatta && p.data_esatta < odierna))

  const currentItems = activeTab === 'attive' ? attive : activeTab === 'bozze' ? bozze : storico

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-800" /> Allineamento in corso...
      </div>
    )
  }

  return (
    <div className="max-w-[1040px] mx-auto py-12 px-4 sm:px-6 pb-32 font-sans bg-white text-slate-900 antialiased">
      
      {/* HEADER PROFESSIONALE AIRBNB-STYLE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-100">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Control Center Ricerche
          </h1>
          <p className="text-sm text-slate-500 font-normal leading-relaxed max-w-2xl">
            Gestisci in un unico posto la visibilità degli annunci sul territorio e monitora all'istante l'afflusso dei nuovi candidati.
          </p>
        </div>
        <Link 
          href="/app/associazione/posizione/nuova" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Nuovo annuncio
        </Link>
      </div>

      {/* SOTTILI TAB DI FILTRO */}
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
            const isScadutaTemporale = p.tipo === 'una_tantum' && p.data_esatta && p.data_esatta < odierna;
            const candidature = p.candidature || []
            const daValutare = candidature.filter((c: any) => c.stato === 'in_attesa' || c.stato === 'in_contatto').length
            const accettati = candidature.filter((c: any) => c.stato === 'accettato').length

            return (
              <div key={p.id} className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300 hover:border-slate-200">
                
                {/* 1. Anteprima Card Reale - ✨ FIX: Avvolta in Link Reattivo ed Elastico */}
                <Link 
                  href={`/app/associazione/messaggi?filterPosizione=${p.id}`}
                  className="flex-1 block group/card bg-white p-1 transition-all duration-200 active:scale-[0.99]"
                >
                  <PosizioneCard 
                    posizione={p} 
                    ruolo="associazione" 
                    layout="horizontal"
                    isHovered={false} // Lasciamo che gestisca Tailwind internamente l'effetto hover grazie al selettore del padre
                  />
                </Link>

                {/* 2. PIPELINE DELLE CANDIDATURE (Mostrata solo se attiva/storico per evitare bozze vuote) */}
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
                
                {/* 3. BARRA OPERATIVA CONTROLLI */}
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
                          if(isScadutaTemporale) {
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
        <div className="py-24 text-center border border-slate-100 rounded-3xl bg-white max-w-md mx-auto mt-12">
          <Briefcase className="w-6 h-6 mx-auto mb-4 text-slate-300 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-900">Nessun annuncio trovato</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
            Non ci sono posizioni caricate o archiviate in questo tab al momento.
          </p>
        </div>
      )}
    </div>
  )
}