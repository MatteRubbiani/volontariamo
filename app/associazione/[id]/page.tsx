import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import PosizioneCard from '@/components/PosizioneCard'

export default async function ProfiloAssociazione({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Recupero Dati Associazione + Dati Grafica (JOIN)
  const { data: associazione } = await supabase
    .from('associazioni')
    .select('*, grafica:associazioni_grafica(*)')
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

  // Estrazione sicura dei dati grafici (con fallback)
  const grafica = associazione.grafica || {}
  const bgColoreBrand = grafica.colore_brand || '#0f172a'
  const coverUrl = grafica.cover_url || null
  const tagline = grafica.tagline || null
  const statistiche = (grafica.statistiche || []).filter((s: any) => s.label && s.value)

  // 2. Controllo Utente Corrente (Per logica pulsanti)
  const { data: { user } } = await supabase.auth.getUser()
  
  let isOwner = false
  let isVolontario = false
  let statusRete = null

  if (user) {
    const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
    
    if (profilo?.ruolo === 'associazione' && user.id === id) {
      isOwner = true
    } else if (profilo?.ruolo === 'volontario') {
      isVolontario = true
      // Controllo se è già nella rete
      const { data: req } = await supabase
        .from('rete_volontari')
        .select('stato')
        .eq('volontario_id', user.id)
        .eq('associazione_id', id)
        .single()
      if (req) statusRete = req.stato
    }
  }

  // 3. Recupero Posizioni
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select('*, media_associazioni(url), tags:posizione_tags(tag:tags(id, name))')
    .eq('associazione_id', id)
    .order('created_at', { ascending: false })

  const posizioni = posizioniRaw?.map(p => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean)
  }))

  const iniziale = (associazione.nome_breve || associazione.denominazione || 'A').charAt(0).toUpperCase()

  // ⚡ SERVER ACTION: Gestisce il click sul bottone "Unisciti alla Rete"
  async function uniscitiAllaRete() {
    'use server'
    const cookieStoreAction = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStoreAction.getAll() } } }
    )
    
    const { data: { user: currentUser } } = await supabaseAction.auth.getUser()
    
    if (currentUser) {
      await supabaseAction.from('rete_volontari').insert({
        volontario_id: currentUser.id,
        associazione_id: id,
        stato: 'in_attesa'
      })
      revalidatePath(`/associazione/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* HERO SECTION DINAMICA */}
      <div 
        className="text-white pt-10 pb-44 px-6 relative overflow-hidden transition-all duration-300"
        style={{ backgroundColor: bgColoreBrand }}
      >
        {/* Cover Immagine Sfondo (Senza colore sopra) */}
        {coverUrl && (
          <div className="absolute inset-0">
             <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-slate-900/40"></div>
          </div>
        )}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          
          <div className="flex justify-between items-center mb-10">
            <Link href="/app/volontario" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold transition-colors text-xs uppercase tracking-widest">
              ← Torna alla ricerca
            </Link>

            {/* PULSANTE MODIFICA */}
            {isOwner && (
              <Link href="/app/associazione/personalizza" className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/20 rounded-xl text-sm font-bold transition-all backdrop-blur-md shadow-sm">
                ✨ Personalizza Pagina
              </Link>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8 text-center md:text-left">
            
            {/* LOGO ASSOCIAZIONE */}
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-slate-900 text-5xl md:text-6xl font-black shadow-2xl border-4 border-white/20 transition-transform hover:scale-105 overflow-hidden">
              {associazione.logo_url ? (
                <img src={associazione.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                iniziale
              )}
            </div>
            
            <div className="flex-1 pb-1">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-white/20 text-white mb-3 inline-block shadow-sm backdrop-blur-md">
                {associazione.forma_giuridica || 'Profilo Organizzazione'}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                {associazione.denominazione}
              </h1>
              {/* TAGLINE DINAMICA */}
              {tagline && (
                <p className="text-white/90 text-base md:text-lg font-medium mt-2 italic">
                  "{tagline}"
                </p>
              )}
            </div>

            {/* CALL TO ACTION VOLONTARI */}
            {isVolontario && (
              <div className="mt-4 md:mt-0 shrink-0">
                {!statusRete ? (
                  <form action={uniscitiAllaRete}>
                    <button type="submit" className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-lg shadow-xl shadow-white/10 hover:scale-105 transition-all active:scale-95">
                      🤝 Unisciti alla Rete
                    </button>
                  </form>
                ) : statusRete === 'in_attesa' ? (
                  <div className="px-8 py-4 rounded-2xl bg-amber-500/30 border border-amber-300/50 text-amber-100 font-bold text-lg backdrop-blur-md cursor-default">
                    ⏳ Richiesta inviata
                  </div>
                ) : statusRete === 'attivo' ? (
                  <div className="px-8 py-4 rounded-2xl bg-green-500/30 border border-green-300/50 text-green-100 font-bold text-lg backdrop-blur-md cursor-default">
                    ✅ Sei nella Rete
                  </div>
                ) : (
                  <div className="px-8 py-4 rounded-2xl bg-red-500/30 border border-red-300/50 text-red-100 font-bold text-lg backdrop-blur-md cursor-default">
                    ❌ Richiesta rifiutata
                  </div>
                )}
              </div>
            )}
          </div>
          
          <p className="text-base md:text-xl text-white/90 max-w-3xl leading-relaxed font-medium mx-auto md:mx-0">
            {associazione.descrizione || "Benvenuti sulla nostra pagina ufficiale. Scopri le posizioni attive qui sotto!"}
          </p>
          
          {/* CONTATTI */}
          {(associazione.sito_web || associazione.email_associazione) && (
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
              {associazione.email_associazione && (
                <a href={`mailto:${associazione.email_associazione}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold backdrop-blur-sm hover:bg-white/20 transition-colors">
                  ✉️ {associazione.email_associazione}
                </a>
              )}
              {associazione.sito_web && (
                <a href={associazione.sito_web} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-black shadow-lg hover:bg-slate-100 transition-all active:scale-95">
                  🔗 Sito Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BLOCCO CENTRALE CON NUMERI E ANNUNCI */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-20">
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col gap-10">
          
          {/* STATISTICHE DINAMICHE */}
          {statistiche.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              {statistiche.map((s: any, idx: number) => (
                <div key={idx} className="flex flex-col border-r border-slate-200/60 last:border-0">
                  <span className="text-3xl md:text-4xl font-black" style={{ color: bgColoreBrand }}>
                    {s.value}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* POSIZIONI APERTE */}
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                Posizioni aperte
              </h2>
              <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl font-black text-lg">
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
              <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="font-black text-lg text-slate-700 mb-1">Nessun annuncio attivo</p>
                <p className="font-medium text-slate-500 text-sm">Questa associazione non ha ricerche aperte al momento.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}