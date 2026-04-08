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

  // 2. Recuperiamo Tag e Competenze del Volontario (IL CUORE E LE MANI)
  const [ { data: userTagsData }, { data: userCompData } ] = await Promise.all([
    supabase.from('volontario_tags').select('tag_id').eq('volontario_id', user.id),
    supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', user.id)
  ])
  
  const userTagIds = userTagsData?.map(t => t.tag_id) || []
  const userCompIds = userCompData?.map(c => c.competenza_id) || []

  // 3. Risolviamo i parametri di ricerca
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const dove = typeof params.dove === 'string' ? params.dove : ''
  const tipo = typeof params.tipo === 'string' ? params.tipo : ''
  const tagFilter = typeof params.tag === 'string' ? params.tag : ''

  // Controlliamo se l'utente sta effettuando attivamente una ricerca
  const isSearching = Boolean(q || dove || tipo || tagFilter)

  // 4. Recuperiamo TUTTI i tag per il menu a tendina
  const { data: allTags } = await supabase.from('tags').select('*').order('name')

  // 5. LOGICA DI RICERCA A DUE STEP
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

  // 6. Query Principale POTENZIATA (Peschiamo anche le competenze!)
  let posizioniGrezze: any[] = []
  
  if (!skipQuery) {
    let query = supabase
      .from('posizioni')
      .select(`
        *, 
        posizione_tags(tag_id, tags(id, name)),
        posizione_competenze(competenza_id, competenze(id, name))
      `)
      .order('created_at', { ascending: false })
      .limit(100)

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

  // 7. Formattiamo i dati puliti per la Card
  const posizioni = posizioniGrezze.map((p: any) => ({
    id: p.id,
    titolo: p.titolo,
    descrizione: p.descrizione,
    tipo: p.tipo,
    dove: p.dove,
    ora_inizio: p.ora_inizio,
    ora_fine: p.ora_fine,
    quando: p.quando,
    tags: p.posizione_tags?.map((pt: any) => pt.tags).filter((tag: any) => tag !== null) || [],
    competenze: p.posizione_competenze?.map((pc: any) => pc.competenze).filter((comp: any) => comp !== null) || []
  }))

  // 8. LA MAGIA DEL SUPER MATCHING (Interessi + Competenze)
  let suggested: any[] = []
  let regular: any[] = posizioni

  if (!isSearching && (userTagIds.length > 0 || userCompIds.length > 0)) {
    // Calcoliamo lo score totale (Tag = 1 punto, Competenze = 2 punti)
    const scoredPositions = posizioni.map(p => {
      const tagMatch = p.tags.filter((t: any) => userTagIds.includes(t.id)).length
      const compMatch = p.competenze.filter((c: any) => userCompIds.includes(c.id)).length
      
      const score = tagMatch + (compMatch * 2) // Le competenze valgono doppio!
      return { ...p, score }
    })

    // Ordiniamo dal Match migliore in giù
    scoredPositions.sort((a, b) => b.score - a.score)

    // Suggeriamo i primi 3 che hanno almeno un punto
    suggested = scoredPositions.filter(p => p.score > 0).slice(0, 3)
    
    // Gli altri finiscono nella lista regolare
    const suggestedIds = suggested.map(s => s.id)
    regular = scoredPositions.filter(p => !suggestedIds.includes(p.id))
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER DELLA DASHBOARD */}
      <div className="bg-blue-600 text-white pt-20 pb-16 px-6 md:px-12 rounded-b-[3rem] shadow-lg mb-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
            Esplora le posizioni
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl font-medium">
            Trova l'attività perfetta per te in base alle tue competenze e ai tuoi interessi.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        {/* BARRA DEI FILTRI */}
        <FiltriRicerca allTags={allTags || []} />

        {/* ---------------- SEZIONE SUGGERITI ---------------- */}
        {!isSearching && suggested.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
              Scelti per te
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Alto Match
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {suggested.map((posizione: any) => (
                <PosizioneCard 
                  key={posizione.id} 
                  posizione={posizione} 
                  competenzeVolontario={userCompIds} // <--- PASSAGGIO MAGIC!
                />
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SEZIONE TUTTI GLI ANNUNCI ---------------- */}
        <div className="mb-8 flex justify-between items-end">
          {isSearching ? (
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">
               {regular.length} {regular.length === 1 ? 'Risultato Trovato' : 'Risultati Trovati'}
             </h2>
          ) : (
            suggested.length > 0 && regular.length > 0 && (
              <h2 className="text-2xl font-black text-slate-900 border-t border-slate-200 pt-10 w-full tracking-tight">
                Tutti gli altri annunci
              </h2>
            )
          )}
        </div>

        {/* Griglia Regolare */}
        {regular.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regular.map((posizione: any) => (
              <PosizioneCard 
                key={posizione.id} 
                posizione={posizione} 
                competenzeVolontario={userCompIds} // <--- PASSAGGIO MAGIC!
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE PROFESSIONALE */
          <div className="bg-white p-16 rounded-[3rem] text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-slate-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h3 className="text-xl font-black text-slate-800 mb-2">Nessuna posizione trovata</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              {isSearching 
                ? "Prova a modificare o rimuovere i filtri di ricerca per vedere più risultati." 
                : "Al momento non ci sono annunci disponibili da mostrarti."}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}