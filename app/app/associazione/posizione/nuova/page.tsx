import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import FormPosizioneConPreview from '@/components/FormPosizioneConPreview'
import { createPosizione } from '../../actions'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function NuovaPosizionePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Recupero dati parallelo dal database
  const [ { data: allTags }, { data: allCompetenze }, { data: mediaGallery } ] = await Promise.all([
    supabase.from('tags').select('id, name, categoria, description').order('categoria').order('name'),
    supabase.from('competenze').select('id, name, is_official').eq('is_official', true).order('name'),
    supabase.from('media_associazioni').select('*').eq('associazione_id', user.id).order('created_at', { ascending: false })
  ])

  return (
    // Allarghiamo la pagina a max-w-6xl per permettere il layout a due colonne affiancate
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 pb-32 font-sans bg-white text-slate-900 antialiased">
      
      {/* HEADER PROFESSIONALE DESATURATO */}
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

      {/* NUOVO ARCHITETTURA: Form + Live Preview nello stesso componente client */}
      <FormPosizioneConPreview 
        tagsDisponibili={allTags || []} 
        competenzeDisponibili={allCompetenze || []}
        mediaDisponibili={mediaGallery || []} 
        salvaAction={createPosizione} 
      />

    </div>
  )
}