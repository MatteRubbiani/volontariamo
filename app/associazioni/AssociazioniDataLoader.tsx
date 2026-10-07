import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaMappaAssociazioni from '@/components/VistaMappaAssociazioni'
import { Database } from '@/types/supabase'

export default async function AssociazioniDataLoader() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll() } 
      } 
    }
  )

  const resolveImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from('posizioni').getPublicUrl(path)
    return data?.publicUrl || null
  }

  // Fetch dei dati allineato al nuovo schema
  const { data: associazioniRaw, error } = await supabase
    .from('associazioni')
    .select(`
      id,
      denominazione,
      codice_fiscale,
      comune_legale,
      provincia_legale,
      indirizzo_legale,
      logo_path,
      slug,
      lat_legale,
      lng_legale,
      sezione_runts,
      is_verificata
    `)
    .eq('is_verificata', true)
    .not('lat_legale', 'is', null)
    .not('lng_legale', 'is', null)
    .limit(20)

  if (error) {
    console.error('Errore fetch mappa associazioni:', error)
  }

  // Normalizzazione retrocompatibile per VistaMappaAssociazioni
  const associazioniIniziali = (associazioniRaw || []).map((a) => ({
    ...a,
    lat: a.lat_legale,
    lng: a.lng_legale,
    comune: a.comune_legale,
    provincia: a.provincia_legale,
    indirizzo: a.indirizzo_legale,
    logo_url: resolveImageUrl(a.logo_path),
  }))

  return <VistaMappaAssociazioni initialData={associazioniIniziali} />
}