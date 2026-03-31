import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PosizioneCard from '@/components/PosizioneCard'
import FiltriRicerca from '@/components/FiltriRicerca'

export default async function DashboardVolontario({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Controllo Autenticazione
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // NUOVO STEP: Recuperiamo i tag di interesse del volontario dal DB
  const { data: userTagsData } = await supabase
    .from('volontario_tags')
    .select('tag_id')
    .eq('volontario_id', user.id)
  
  const userTagIds = userTagsData?.map(t => t.tag_id) || []

  // 2. Risolviamo i parametri di ricerca
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const dove = typeof params.dove === 'string' ? params.dove : ''
  const tipo = typeof params.tipo === 'string' ? params.tipo : ''
  const tagFilter = typeof params.tag === 'string' ? params.tag : ''

  // Controlliamo se l'utente sta effettuando attivamente una ricerca
  const isSearching = Boolean(q || dove || tipo || tagFilter)

  // 3. Recuperiamo TUTTI i tag per il menu a tendina
  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  // 4. LOGICA DI RICERCA A DUE STEP
  let skipQuery = false
  let validPosizioneIds: string[] | null = null

  if (tagFilter) {
    const { data: tagMatches, error: tagError } = await supabase
      .from('posizione_tags')
      .select('posizione_id')
      .eq('tag_id', tagFilter)
    
    if (!tagError && tagMatches) {
      validPosizioneIds = tagMatches.map(t => t.posizione_id)
      if (validPosizioneIds.length === 0) {
        skipQuery = true
      }
    } else {
      skipQuery = true
    }
  }

  // 5. Query Principale
  let posizioniGrezze: any[] = []
  
  if (!skipQuery) {
    let query = supabase
      .from('posizioni')
      .select(`*, posizione_tags(tag_id, tags(id, name))`)
      .order('created_at', { ascending: false })
      .limit(100) // attenzione, ho limitato alle ultime 100 perchè tanto quelle vecchie non le vuole nessuno, da valutare

    if (validPosizioneIds !== null && validPosizioneIds.length > 0) {
      query = query.in('id', validPosizioneIds)
    }

    if (q) {
      query = query.or(`titolo.ilike.%${q}%,descrizione.ilike.%${q}%`)
    }
    if (dove) {
      query = query.ilike('dove', `%${dove}%`)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Errore recupero posizioni:", error.message)
    } else if (data) {
      posizioniGrezze = data
    }
  }

  // 6. Formattiamo i dati
  const posizioni = posizioniGrezze.map((p: any) => ({
    id: p.id,
    titolo: p.titolo,
    descrizione: p.descrizione,
    tipo: p.tipo,
    dove: p.dove,
    ora_inizio: p.ora_inizio,
    ora_fine: p.ora_fine,
    quando: p.quando,
    tags: p.posizione_tags?.map((pt: any) => pt.tags).filter((tag: any) => tag !== null) || []
  }))

  // 7. LA MAGIA DEL MATCHING (Suddivisione tra Suggeriti e Normali)
  let suggested: any[] = []
  let regular: any[] = posizioni

  if (!isSearching && userTagIds.length > 0) {
    // Calcoliamo lo score per ogni posizione
    const scoredPositions = posizioni.map(p => {
      const matchCount = p.tags.filter((t: any) => userTagIds.includes(t.id)).length
      return { ...p, score: matchCount }
    })

    // Ordiniamo in base a chi ha più tag in comune (ordine decrescente)
    scoredPositions.sort((a, b) => b.score - a.score)

    // Prendiamo i primi 3 che hanno almeno un tag in comune
    suggested = scoredPositions.filter(p => p.score > 0).slice(0, 3)
    
    // Tutti gli altri finiscono nella lista regolare
    const suggestedIds = suggested.map(s => s.id)
    regular = scoredPositions.filter(p => !suggestedIds.includes(p.id))
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER DELLA DASHBOARD */}
      <div className="bg-blue-600 text-white pt-20 pb-16 px-6 md:px-12 rounded-b-[3rem] shadow-xl mb-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Trova la tua missione 🎯
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl font-medium">
            Esplora le posizioni aperte dalle associazioni e candidati per fare la differenza.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        {/* BARRA DEI FILTRI */}
        <FiltriRicerca allTags={allTags || []} />

        {/* ---------------- SEZIONE SUGGERITI ---------------- */}
        {!isSearching && suggested.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-800 mb-6 flex items-center gap-3">
              Scelti per te 🎯 
              <span className="text-sm font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest">In evidenza</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {suggested.map((posizione: any) => (
                <PosizioneCard key={posizione.id} posizione={posizione} />
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SEZIONE TUTTI GLI ANNUNCI ---------------- */}
        
        {/* Intestazione condizionale basata sullo stato di ricerca */}
        <div className="mb-8 flex justify-between items-end">
          {isSearching ? (
             <h2 className="text-2xl font-black text-slate-800">
               {regular.length} {regular.length === 1 ? 'Risultato Trovato' : 'Risultati Trovati'}
             </h2>
          ) : (
            suggested.length > 0 && regular.length > 0 && (
              <h2 className="text-2xl font-black text-slate-800 border-t border-slate-200 pt-10 w-full">
                Tutti gli altri annunci
              </h2>
            )
          )}
        </div>

        {/* Griglia Regolare */}
        {regular.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regular.map((posizione: any) => (
              <PosizioneCard key={posizione.id} posizione={posizione} />
            ))}
          </div>
        ) : (
          /* Messaggi di Errore / Vuoto gestiti in modo intelligente */
          <div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-slate-200 shadow-sm">
            <span className="text-6xl block mb-4">🕵️‍♂️</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">Nessuna posizione trovata</h3>
            <p className="text-slate-500">
              {isSearching 
                ? "Prova a rimuovere qualche filtro per vedere più risultati." 
                : "Al momento non ci sono altri annunci da mostrarti."}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}