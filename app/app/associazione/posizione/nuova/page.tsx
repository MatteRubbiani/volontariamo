import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import FormPosizione from '@/components/FormPosizione'
import { createPosizione } from '../../actions'
import { redirect } from 'next/navigation'

export default async function NuovaPosizionePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Scarichiamo in parallelo tag, competenze E la galleria media dell'associazione!
  const [ { data: allTags }, { data: allCompetenze }, { data: mediaGallery } ] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('competenze').select('*').eq('is_official', true).order('name'),
    supabase.from('media_associazioni').select('*').eq('associazione_id', user.id).order('created_at', { ascending: false })
  ])

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 pb-24">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Pubblica Posizione</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Crea un annuncio e trova i volontari perfetti.</p>
        </div>
        <Link href="/app/associazione" className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors active:scale-95">
          ← INDIETRO
        </Link>
      </div>

      {/* Passiamo i nuovi dati al form */}
      <FormPosizione 
        tagsDisponibili={allTags || []} 
        competenzeDisponibili={allCompetenze || []}
        mediaDisponibili={mediaGallery || []} 
        salvaAction={createPosizione} 
      />
    </div>
  )
}