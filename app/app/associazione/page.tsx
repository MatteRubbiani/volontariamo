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
  
  // Query intatta: perfetta così com'è
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select(`
      *, 
      media_associazioni(url),
      tags:posizione_tags(tag:tags(id, name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
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
      
      {/* HEADER DASHBOARD PREMIUM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-8 border-b border-slate-100">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Le tue Posizioni</h1>
          <p className="text-slate-500 font-medium mt-2">Gestisci i tuoi annunci di volontariato attivi.</p>
        </div>
        
        {/* TASTO AGGIUNGI: Su mobile prende tutta la larghezza (w-full sm:w-auto) */}
        <Link 
          href="/app/associazione/posizione/nuova" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.25)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuova Posizione
        </Link>
      </div>

      {/* ELENCO POSIZIONI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {posizioni?.length === 0 ? (
          // EMPTY STATE PREMIUM
          <div className="col-span-full flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Nessun annuncio attivo</h3>
            <p className="text-slate-500 font-medium mb-8 max-w-md">Non hai ancora pubblicato nessuna posizione. Crea la tua prima inserzione per trovare i volontari perfetti per la tua causa.</p>
            <Link 
              href="/app/associazione/posizione/nuova" 
              className="text-emerald-700 bg-emerald-50 font-bold px-6 py-3 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              Crea la tua prima inserzione
            </Link>
          </div>
        ) : (
          posizioni?.map(p => (
            <PosizioneCard 
              key={p.id} 
              posizione={p} 
              ruolo="associazione" 
              layout="horizontal" // 🚨 LA MAGIA È TUTTA QUI
            />
          ))
        )}
      </div>
    </div>
  )
}