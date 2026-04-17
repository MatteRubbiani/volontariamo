import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaEsplora from '@/components/VistaEsplora'

export const metadata = {
  title: 'Esplora la Mappa | Volontariando',
  description: 'Scopri le opportunità di volontariato vicino a te sulla mappa interattiva.',
}

export default async function EsploraPage() {
  // Verifichiamo solo se l'utente è loggato per passargli il contesto corretto,
  // ma la pagina rimane visibile a tutti!
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="h-[calc(100vh-76px)] w-full overflow-hidden">
      {/* Montiamo la super mappa che abbiamo costruito! */}
      <VistaEsplora />
    </main>
  )
}