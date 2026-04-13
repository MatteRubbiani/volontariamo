import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VolontarioDashboard } from './components/VolontarioDashboard'

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

  // 2. Recuperiamo Tag e Competenze del Volontario
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

  // 6. Query Principale POTENZIATA
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

  return (
    <VolontarioDashboard 
      posizioniGrezze={posizioni}
      allTags={allTags || []}
      userTagIds={userTagIds}
      isSearching={isSearching}
    />
  )
}