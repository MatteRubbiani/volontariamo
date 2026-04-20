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

  const [ { data: allTags }, { data: allCompetenze }, { data: mediaGallery } ] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('competenze').select('*').eq('is_official', true).order('name'),
    supabase.from('media_associazioni').select('*').eq('associazione_id', user.id).order('created_at', { ascending: false })
  ])

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-24">
      
      {/* HEADER OTTIMIZZATO MOBILE */}
      <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Pubblica Posizione</h1>
          <p className="text-slate-500 font-medium mt-2">Crea un annuncio e trova i volontari perfetti.</p>
        </div>
        <Link 
          href="/app/associazione" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors active:scale-95 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Indietro
        </Link>
      </div>

      <FormPosizione 
        tagsDisponibili={allTags || []} 
        competenzeDisponibili={allCompetenze || []}
        mediaDisponibili={mediaGallery || []} 
        salvaAction={createPosizione} 
      />
    </div>
  )
}