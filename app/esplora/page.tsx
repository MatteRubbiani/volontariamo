import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaEsplora from '@/components/VistaEsplora'
import { createClient } from '@supabase/supabase-js'

export const metadata = {
  title: 'Esplora la Mappa', 
  description: 'Scopri le opportunità di volontariato vicino a te sulla mappa interattiva.',
}

export default async function EsploraPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Facciamo una query velocissima e super leggera lato server delle ultime 10 posizioni
  // Questo serve ESCLUSIVAMENTE come nutrimento per Googlebot e per il primo caricamento
  const { data: posizioniIniziali } = await supabase
    .from('posizioni')
    .select('*, media_associazioni(url)')
    .order('created_at', { ascending: false })
    .limit(10)

  // 2. Normalizziamo velocemente i dati per passarli puliti al client
  const formattedInitialData = (posizioniIniziali || []).map((pos: any) => ({
    ...pos,
    slug: pos.slug || null,
    associazioni: pos.associazione_id ? { id: pos.associazione_id } : null,
    tags: [],
    competenze: []
  }))

  return (
    <main className="h-[calc(100vh-76px)] w-full overflow-hidden">
      {/* Passiamo i dati pre-caricati al componente client */}
      <VistaEsplora initialData={formattedInitialData} />
    </main>
  )
}