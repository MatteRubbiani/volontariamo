import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import PosizioneCard from '@/components/PosizioneCard'

export default async function ProfiloAssociazione({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: associazione } = await supabase
    .from('associazioni')
    .select('*')
    .eq('id', id)
    .single()

  if (!associazione) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-black text-slate-800 mb-4">Associazione non trovata 🕵️‍♂️</h1>
        <Link href="/dashboard/volontario" className="text-blue-600 font-bold hover:underline">← Torna agli annunci</Link>
      </div>
    )
  }

  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select('*, tags:posizione_tags(tag:tags(id, name))')
    .eq('associazione_id', id)
    .order('created_at', { ascending: false })

  const posizioni = posizioniRaw?.map(p => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean)
  }))

  const iniziale = (associazione.nome || associazione.email_contatto || 'A').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* HERO SECTION PREMIUM */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-10 pb-40 px-6 relative overflow-hidden">
        {/* Sfondo decorativo */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          
          <Link href="/dashboard/volontario" className="inline-flex items-center gap-2 text-blue-100 hover:text-white font-bold mb-10 transition-colors bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm hover:bg-white/20 border border-white/5">
            ← Torna agli annunci
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
            <div className="w-28 h-28 shrink-0 bg-white rounded-[2rem] flex items-center justify-center text-blue-600 text-6xl font-black shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              {iniziale}
            </div>
            <div className="flex-1">
              <span className="bg-blue-400/30 text-blue-50 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase mb-3 inline-block backdrop-blur-sm border border-blue-300/20">
                Profilo Organizzazione
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                {associazione.nome || 'Associazione Non Definita'}
              </h1>
            </div>
          </div>
          
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl leading-relaxed font-medium">
            {associazione.descirzione || "Questa associazione sta ancora preparando la sua bio ufficiale. Nel frattempo, puoi dare un'occhiata alle posizioni che ha aperto qui sotto!"}
          </p>
          
          {/* BADGES CONTATTI (Pills Stile Vetro) */}
          {(associazione.sito_web || associazione.citta) && (
            <div className="flex flex-wrap gap-3 mt-8">
              {associazione.citta && (
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black/10 text-white text-sm font-bold backdrop-blur-sm border border-white/10 shadow-sm">
                  📍 {associazione.citta}
                </span>
              )}
              {associazione.sito_web && (
                <a href={associazione.sito_web} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 text-sm font-black shadow-lg hover:scale-105 hover:shadow-xl hover:shadow-white/20 transition-all active:scale-95">
                  🔗 Visita il Sito Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTENITORE ANNUNCI (Overlapping più pronunciato) */}
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-20">
        <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100/50">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 border-b border-slate-100 pb-6 gap-4">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
              Posizioni aperte
            </h2>
            <span className="bg-slate-100 text-slate-500 px-5 py-2 rounded-full font-black text-lg border border-slate-200 shadow-inner">
              {posizioni?.length || 0}
            </span>
          </div>
          
          {posizioni && posizioni.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {posizioni.map(p => (
                <PosizioneCard key={p.id} posizione={p} ruolo="volontario" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-black text-xl text-slate-700 mb-2">Nessun annuncio attivo</p>
              <p className="font-medium text-slate-500">L'associazione non ha posizioni aperte al momento.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}