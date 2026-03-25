import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import FormPosizione from './FormPosizione' // Importiamo il componente interattivo

export default async function NuovaPosizionePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: allTags } = await supabase.from('tags').select('*')

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Pubblica Posizione</h1>
          <p className="text-slate-500 mt-2">Crea un annuncio professionale per i tuoi volontari.</p>
        </div>
        <Link href="/dashboard/associazione" className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">
          ← Annulla
        </Link>
      </div>

      {/* Qui carichiamo il form che abbiamo creato prima */}
      <FormPosizione allTags={allTags || []} />
    </div>
  )
}