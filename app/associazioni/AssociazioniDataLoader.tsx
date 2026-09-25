import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaMappaAssociazioni from '@/components/VistaMappaAssociazioni'

export default async function AssociazioniDataLoader() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll() } 
      } 
    }
  )

  // Fetch dei dati Supabase
  const { data: associazioniIniziali } = await supabase
    .from('associazioni')
    .select('id, denominazione, codice_fiscale, comune, logo_url, slug, lat, lng, sezione_runts, claimed')
    .eq('claimed', true)
    .not('lat', 'is', null)
    .limit(20)

  return <VistaMappaAssociazioni initialData={associazioniIniziali || []} />
}