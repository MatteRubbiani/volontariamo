import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import PosizioneCard from '@/components/PosizioneCard'

export default async function DashboardAssociazione() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch delle posizioni e relative entità collegate
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select(`
      *, 
      media_associazioni(url),
      tags:posizione_tags(tag:tags(id, name)),
      competenze:posizione_competenze(competenza:competenze(id, name)),
      candidature(id, stato)
    `)
    .eq('associazione_id', user?.id)
    .order('created_at', { ascending: false })

  const posizioni = posizioniRaw?.map(p => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean),
    competenze: p.competenze?.map((c: any) => c.competenza).filter(Boolean)
  }))

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24">
      
      {/* HEADER SAAS PREMIUM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ricerche Attive
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
            Monitora gli annunci pubblicati e gestisci il flusso delle candidature.
          </p>
        </div>
        
        {/* ACTION BUTTON PRIMARIO */}
        <Link 
          href="/app/associazione/posizione/nuova" 
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-sm shrink-0 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Nuova Posizione</span>
        </Link>
      </div>

      {/* GRIGLIA POSIZIONI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {posizioni?.length === 0 ? (
          
          // EMPTY STATE MINIMALE
          <div className="col-span-full flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-5 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Nessuna ricerca in corso</h3>
            <p className="text-slate-500 font-medium mb-6 max-w-sm text-sm">
              Non hai ancora pubblicato annunci. Inserisci i parametri operativi per avviare la ricerca.
            </p>
            <Link 
              href="/app/associazione/posizione/nuova" 
              className="text-slate-900 bg-white border border-slate-200 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-xs uppercase tracking-wider shadow-xs"
            >
              Crea Scheda Annuncio
            </Link>
          </div>

        ) : (
          posizioni?.map(p => {
            const candidature = p.candidature || []
            const daValutare = candidature.filter((c: any) => c.stato === 'in_attesa' || c.stato === 'in_contatto').length
            const accettati = candidature.filter((c: any) => c.stato === 'accettato').length

            return (
              // SCHEDA UNIFICATA (Card + Pipeline di monitoraggio)
              <div 
                key={p.id} 
                className="flex flex-col bg-white rounded-[2rem] border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                
                {/* BLOCCO SUPERIORE: Informazioni Annuncio */}
                <div className="flex-1">
                  <PosizioneCard 
                    posizione={p} 
                    ruolo="associazione" 
                    layout="horizontal" 
                  />
                </div>

                {/* BLOCCO INFERIORE: Pipeline Metriche e Accesso Candidati */}
                <div className="bg-slate-50/50 border-t border-slate-100 p-3 sm:px-5">
                
<Link 
  href={`/app/associazione/candidature?filterPosizione=${p.id}`}
  className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-xs transition-all duration-200 border border-transparent hover:border-slate-200/60 group"
>
                    <div className="flex items-center gap-6">
                      
                      {/* STAT: Da Valutare */}
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">
                          Da Valutare
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-base font-black ${daValutare > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {daValutare}
                          </span>
                          {daValutare > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      
                      <div className="w-px h-6 bg-slate-200/60" />
                      
                      {/* STAT: Accettati */}
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">
                          Inseriti
                        </span>
                        <span className="text-base font-black text-emerald-600">
                          {accettati}
                        </span>
                      </div>

                    </div>

                    {/* AZIONE DI NAVIGAZIONE */}
                    <div className="text-xs font-bold text-slate-500 group-hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <span>Candidature</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>

                  </Link>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}