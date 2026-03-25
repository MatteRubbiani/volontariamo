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

  // 2. Risolviamo i parametri di ricerca
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const dove = typeof params.dove === 'string' ? params.dove : ''
  const tipo = typeof params.tipo === 'string' ? params.tipo : ''
  const tagFilter = typeof params.tag === 'string' ? params.tag : ''

  // 3. Recuperiamo TUTTI i tag per il menu a tendina
  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  // 4. LOGICA DI RICERCA INFALLIBILE (A DUE STEP)
  let skipQuery = false
  let validPosizioneIds: string[] | null = null

  // Se l'utente sta cercando un tag specifico, facciamo una pre-query
  if (tagFilter) {
    const { data: tagMatches, error: tagError } = await supabase
      .from('posizione_tags')
      .select('posizione_id')
      .eq('tag_id', tagFilter)
    
    if (!tagError && tagMatches) {
      validPosizioneIds = tagMatches.map(t => t.posizione_id)
      // Se nessun annuncio ha questo tag, possiamo saltare la query principale per risparmiare tempo
      if (validPosizioneIds.length === 0) {
        skipQuery = true
      }
    } else {
      skipQuery = true
    }
  }

  // 5. Query Principale (La eseguiamo solo se non abbiamo già scoperto che ci sono 0 risultati)
  let posizioniGrezze: any[] = []
  
  if (!skipQuery) {
    let query = supabase
      .from('posizioni')
      .select(`*, posizione_tags(tag_id, tags(id, name))`)
      .order('created_at', { ascending: false })

    // Filtriamo per ID delle posizioni trovate tramite il tag (se applicabile)
    if (validPosizioneIds !== null && validPosizioneIds.length > 0) {
      query = query.in('id', validPosizioneIds)
    }

    // Applichiamo gli altri filtri liberi
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

  // 6. Formattiamo i dati pulendo l'array dei tag per il nostro componente PosizioneCard
  const posizioni = posizioniGrezze.map((p: any) => ({
    id: p.id,
    titolo: p.titolo,
    descrizione: p.descrizione,
    tipo: p.tipo,
    dove: p.dove,
    ora_inizio: p.ora_inizio,
    ora_fine: p.ora_fine,
    quando: p.quando,
    // Estraiamo i tag nidificati per renderli un semplice array di oggetti
    tags: p.posizione_tags
      ?.map((pt: any) => pt.tags)
      .filter((tag: any) => tag !== null) || []
  }))

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
        
        {/* BARRA DEI FILTRI (Passiamo i tag per popolare il select) */}
        <FiltriRicerca allTags={allTags || []} />

        {/* CONTATORE RISULTATI */}
        <div className="mb-8 flex justify-between items-end">
          <h2 className="text-2xl font-black text-slate-800">
            {posizioni.length} {posizioni.length === 1 ? 'Posizione Trovata' : 'Posizioni Trovate'}
          </h2>
        </div>

        {/* GRIGLIA DELLE CARD */}
        {posizioni.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posizioni.map((posizione: any) => (
              <PosizioneCard key={posizione.id} posizione={posizione} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-slate-200 shadow-sm">
            <span className="text-6xl block mb-4">🕵️‍♂️</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">Nessuna posizione trovata</h3>
            <p className="text-slate-500">
              {tagFilter || q || dove || tipo 
                ? "Prova a rimuovere qualche filtro per vedere più risultati." 
                : "Al momento le associazioni non hanno ancora pubblicato nulla."}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}