import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaEsplora from '@/components/VistaEsplora'

// ✨ FIX: Lasciamo solo il nome della pagina. Il layout aggiungerà "| Volontariando" in automatico!
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

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="h-[calc(100vh-76px)] w-full overflow-hidden">
      <VistaEsplora />
    </main>
  )
}