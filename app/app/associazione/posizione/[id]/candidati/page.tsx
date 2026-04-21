import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GestioneCandidatiClient from '@/components/GestioneCandidatiClient'

export default async function PaginaCandidati({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const { id } = await params 
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. Recupero Posizione
  const { data: posizione, error } = await supabase
    .from('posizioni')
    .select('*, candidature (*)')
    .eq('id', id)
    .eq('associazione_id', user.id)
    .single()

  if (error || !posizione) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold">Posizione non trovata.</h2>
        <Link href="/app/associazione" className="text-emerald-600 underline">Torna indietro</Link>
      </div>
    )
  }

  // 2. Recupero profili
  const { data: profiliVolontari } = await supabase
    .rpc('get_profili_candidati', { p_posizione_id: id })

    // 🚨 AGGIUNGI QUESTA RIGA PER IL DEBUG:
  console.log("🔥 DEBUG PROFILI:", profiliVolontari);
  
  // 3. Generazione link sicuri (solo se serve)
  const paths = profiliVolontari
    ?.map((p: any) => p.avatar_url)
    .filter((url: string) => url && !url.startsWith('http')) || []

  let signedUrls: any[] = []
  if (paths.length > 0) {
    const { data } = await supabase.storage.from('avatars').createSignedUrls(paths, 3600)
    if (data) signedUrls = data
  }

  // 4. Mappatura Sicura (Qui era l'errore che faceva sparire i dati)
  const candidatureArricchite = posizione.candidature?.map((cand: any) => {
    const profiloBase = profiliVolontari?.find((p: any) => p.id === cand.volontario_id)
    
    let finalAvatar = profiloBase?.avatar_url
    if (profiloBase?.avatar_url && !profiloBase.avatar_url.startsWith('http')) {
      const linkFirmato = signedUrls.find(s => s.path === profiloBase.avatar_url)
      if (linkFirmato?.signedUrl) finalAvatar = linkFirmato.signedUrl
    }

    return {
      ...cand,
      volontario: {
        profili_volontari: profiloBase ? {
          ...profiloBase,
          avatar_url: finalAvatar
        } : null
      }
    }
  }) || []

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mb-8 flex flex-col gap-4">
        <Link href="/app/associazione" className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-sm transition-colors group w-max">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Torna alla Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] bg-emerald-50 px-3 py-1 rounded-full">Gestione Candidati</span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">{posizione.titolo}</h1>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {candidatureArricchite.length} candidature totali
          </div>
        </div>
      </div>

      <GestioneCandidatiClient 
        candidatureIniziali={candidatureArricchite} 
        posizioneId={posizione.id}
      />
    </div>
  )
}