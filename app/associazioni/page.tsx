import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaMappaAssociazioni from '@/components/VistaMappaAssociazioni'

export const metadata = {
  title: 'Esplora Associazioni | Volontariando', 
  description: 'Scopri le associazioni e gli Enti del Terzo Settore attivi sul tuo territorio.',
}

export default async function AssociazioniPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Pre-carichiamo solo le associazioni GIA' RIVENDICATE e con coordinate reali
  const { data: associazioniIniziali } = await supabase
    .from('associazioni')
    .select('id, denominazione, codice_fiscale, comune, logo_url, slug, lat, lng, sezione_runts, claimed')
    .eq('claimed', true)
    .not('lat', 'is', null)
    .limit(20)

  return (
    <main className="h-[calc(100vh-3.5rem)] w-full overflow-hidden relative bg-slate-100">
      <VistaMappaAssociazioni initialData={associazioniIniziali || []} />
    </main>
  )
}