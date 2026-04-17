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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Associazione non trovata</h1>
        <p className="text-slate-500 mb-6">L'organizzazione cercata non è disponibile.</p>
        <Link href="/app/volontario" className="text-blue-600 font-bold hover:underline">← Torna agli annunci</Link>
      </div>
    )
  }

  // Manteniamo la tua query originale
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select('*, media_associazioni(url), tags:posizione_tags(tag:tags(id, name))')
    .eq('associazione_id', id)
    .order('created_at', { ascending: false })

  const posizioni = posizioniRaw?.map(p => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean)
  }))

  const iniziale = (associazione.nome || associazione.email_contatto || 'A').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* HERO SECTION PROFESSIONALE (Pulita, Navy/Slate) */}
      <div className="bg-slate-900 text-white pt-10 pb-44 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          
          <Link href="/app/volontario" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold mb-10 transition-colors text-xs uppercase tracking-widest">
            ← Torna alla ricerca
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8 text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-slate-900 text-5xl md:text-6xl font-black shadow-2xl border-4 border-slate-800/50 transition-transform hover:scale-105">
              {iniziale}
            </div>
            <div className="flex-1 pb-1">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white mb-3 inline-block shadow-lg shadow-blue-900/20">
                Profilo Organizzazione
              </span>
              <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-tight">
                {associazione.nome || 'Associazione'}
              </h1>
            </div>
          </div>
          
          <p className="text-base md:text-xl text-slate-300 max-w-3xl leading-relaxed font-medium mx-auto md:mx-0">
            {associazione.descirzione || "Questa associazione sta ancora preparando la sua bio ufficiale. Scopri le posizioni attive qui sotto!"}
          </p>
          
          {/* BADGES CONTATTI (Icone professionali al posto delle emoji) */}
          {(associazione.sito_web || associazione.citta) && (
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
              {associazione.citta && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-bold backdrop-blur-sm">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  {associazione.citta}
                </div>
              )}
              {associazione.sito_web && (
                <a href={associazione.sito_web} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-black shadow-lg hover:bg-blue-50 transition-all active:scale-95">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                  Sito Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SEZIONE ANNUNCI */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-20">
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-100">
          
          <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
              Posizioni aperte
            </h2>
            <span className="bg-slate-50 text-blue-600 px-5 py-2 rounded-2xl font-black text-xl border border-slate-100">
              {posizioni?.length || 0}
            </span>
          </div>
          
          {posizioni && posizioni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {posizioni.map(p => (
                <PosizioneCard key={p.id} posizione={p} ruolo="volontario" />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="font-black text-lg text-slate-700 mb-1">Nessun annuncio attivo</p>
              <p className="font-medium text-slate-500 text-sm">Questa associazione non ha ricerche aperte al momento.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}