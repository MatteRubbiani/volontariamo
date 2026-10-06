import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import FormPosizioneConPreview from '@/components/FormPosizioneConPreview'
import { createPosizione } from '../../actions'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Database } from '@/types/supabase'

export default async function NuovaPosizionePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Recupero dei soli tag reali dal database
  const { data: rawTags } = await supabase
    .from('tags')
    .select('id, nome, categoria')
    .order('categoria')
    .order('nome')

  const tagsDisponibili = (rawTags || []).map((t) => ({
    id: t.id,
    nome: t.nome,
    name: t.nome, // compatibilità con la UI interna del form
    categoria: t.categoria,
  }))

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 pb-32 font-sans bg-white text-slate-900 antialiased">
      
      {/* HEADER PROFESSIONALE */}
      <div className="mb-12 flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Nuovo annuncio di volontariato
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Compila i dettagli operativi per pubblicare l'opportunità sulla tua bacheca.
          </p>
        </div>

        <Link 
          href="/app/associazione/posizioni" 
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Annulla
        </Link>
      </div>

      {/* Form + Live Preview */}
      <FormPosizioneConPreview 
        tagsDisponibili={tagsDisponibili} 
        competenzeDisponibili={[]} 
        mediaDisponibili={[]} 
        salvaAction={createPosizione} 
      />

    </div>
  )
}