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

  const { data: associazione } = await supabase
    .from('associazioni')
    .select('*, grafica:associazioni_grafica(*)')
    .eq('id', id)
    .single()

  if (!associazione) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center font-sans">
        <h1 className="text-3xl font-bold text-black mb-2">Associazione non trovata</h1>
        <Link href="/app/volontario" className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          Torna agli annunci
        </Link>
      </div>
    )
  }

  const grafica = associazione.grafica || {}
  const coloreBrand = grafica.colore_brand || '#000000' // Usato come accento
  const coverUrl = grafica.cover_url || null
  const tagline = grafica.tagline || null
  const chiSiamo = grafica.chi_siamo || null
  const mission = grafica.mission || null
  const vision = grafica.vision || null
  const sitoWeb = grafica.sito_web || associazione.sito_web || null
  const instagram = grafica.instagram || null
  const facebook = grafica.facebook || null
  const statistiche = (grafica.statistiche || []).filter((s: any) => s.label && s.value)

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
      const { data: req } = await supabase.from('rete_volontari').select('stato').eq('volontario_id', user.id).eq('associazione_id', id).single()
      if (req) statusRete = req.stato
    }
  }

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
      await supabaseAction.from('rete_volontari').insert({ volontario_id: currentUser.id, associazione_id: id, stato: 'in_attesa' })
      revalidatePath(`/associazione/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      
      {/* HERO SEMPRE SCURA ED ELEGANTE (STILE AIRBNB/LUXURY) */}
      <div className="relative pt-20 pb-32 px-6 text-white bg-slate-950">
        {coverUrl && (
          <div className="absolute inset-0">
             <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-40" />
             <div className="absolute inset-0 bg-slate-950/20"></div>
          </div>
        )}
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-16">
            <Link href="/app/volontario" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
              ←
            </Link>
            {/* PULSANTE MODIFICA */}
{isOwner && (
  <Link 
    href="/app/associazione/personalizza" 
    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all backdrop-blur-md"
  >
    Modifica Vetrina
  </Link>
)}
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-8">
            <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 bg-white rounded-3xl flex items-center justify-center text-black text-5xl font-bold shadow-2xl overflow-hidden">
              {associazione.logo_url ? <img src={associazione.logo_url} alt="Logo" className="w-full h-full object-cover" /> : iniziale}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-4 mb-3">
                <span className="px-3 py-1 rounded-md text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-md">
                  {associazione.forma_giuridica || 'Organizzazione'}
                </span>
                {tagline && <span className="text-white/80 font-medium text-lg hidden md:block">· {tagline}</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">{associazione.denominazione}</h1>
            </div>

            {/* CALL TO ACTION VOLONTARI */}
{isVolontario && (
  <div className="mt-4 md:mt-0 shrink-0">
    {!statusRete ? (
      <form action={uniscitiAllaRete}>
        <button 
          type="submit" 
          className="px-8 py-4 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-[0.98]"
        >
          Unisciti alla Rete
        </button>
      </form>
    ) : (
      <div className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md font-bold text-sm uppercase tracking-widest text-white/70">
        {statusRete === 'in_attesa' ? 'Richiesta in attesa' : statusRete === 'attivo' ? 'Già nella Rete' : 'Richiesta rifiutata'}
      </div>
    )}
  </div>
)}
          </div>
        </div>
      </div>

      {/* CONTENUTO INFERIORE */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 md:px-16 py-12 md:py-20">

            {/* Box Numeri con accento colore */}
            {statistiche.length > 0 && (
              <div className="flex flex-wrap justify-start gap-12 md:gap-24 mb-16 border-b border-slate-100 pb-12">
                {statistiche.map((s: any, idx: number) => (
                  <div key={idx}>
                    <div className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: coloreBrand }}>{s.value}</div>
                    <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="md:col-span-2 space-y-16">
                {chiSiamo && (
                  <section>
                    <h3 className="text-2xl font-bold text-black mb-4">Chi Siamo</h3>
                    <p className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">{chiSiamo}</p>
                  </section>
                )}
                {(mission || vision) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {mission && (
                      <section>
                        <h3 className="text-xl font-bold text-black mb-4">La nostra Mission</h3>
                        <p className="text-base text-slate-600 leading-relaxed">{mission}</p>
                      </section>
                    )}
                    {vision && (
                      <section>
                        <h3 className="text-xl font-bold text-black mb-4">La nostra Vision</h3>
                        <p className="text-base text-slate-600 leading-relaxed">{vision}</p>
                      </section>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                {(sitoWeb || instagram || facebook) && (
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 sticky top-8">
                    <h3 className="text-sm font-bold text-black mb-6 uppercase tracking-widest">Link Utili</h3>
                    <div className="flex flex-col gap-5">
                      {sitoWeb && <a href={sitoWeb} target="_blank" rel="noreferrer" className="text-base font-semibold text-black hover:underline flex items-center justify-between group">Sito Web <span>↗</span></a>}
                      {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="text-base font-semibold text-black hover:underline flex items-center justify-between group">Instagram <span>↗</span></a>}
                      {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="text-base font-semibold text-black hover:underline flex items-center justify-between group">Facebook <span>↗</span></a>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sezione Posizioni aperte */}
            <div className="mt-20 border-t border-slate-100 pt-16">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-bold text-black">Posizioni aperte</h3>
                <span className="bg-slate-100 text-slate-700 px-5 py-1.5 rounded-full font-bold text-lg">{posizioni?.length || 0}</span>
              </div>
              {posizioni && posizioni.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posizioni.map(p => (
    <PosizioneCard 
      key={p.id} 
      posizione={p} 
      ruolo="volontario" 
      coloreBrand={coloreBrand} // 🔥 PASSAGGIO MAGICO!
    />
  ))}
                </div>
              ) : (
                <div className="p-12 border border-slate-200 rounded-3xl bg-slate-50 text-center">
                  <p className="text-slate-500">Nessun annuncio attivo al momento.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}