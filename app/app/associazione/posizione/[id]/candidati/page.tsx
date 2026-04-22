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

  // 1. Controllo Autenticazione
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Recupero Posizione (Assicurandoci che sia dell'associazione loggata)
  const { data: posizione, error } = await supabase
    .from('posizioni')
    .select('*, candidature (*)')
    .eq('id', id)
    .eq('associazione_id', user.id)
    .single()

  if (error || !posizione) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-10 w-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800">Posizione non trovata</h2>
        <p className="mt-2 text-slate-500">Non hai i permessi o l'annuncio non esiste.</p>
        <Link href="/app/associazione" className="mt-8 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
          Torna alla Dashboard
        </Link>
      </div>
    )
  }

  // 3. Recupero profili volontari tramite RPC
  const { data: profiliVolontari } = await supabase
    .rpc('get_profili_candidati', { p_posizione_id: id })

  // 4. Generazione link sicuri per le immagini private (se necessario)
  const paths = profiliVolontari
    ?.map((p: any) => p.foto_profilo_url)
    .filter((url: string) => url && !url.startsWith('http')) || []

  let signedUrls: any[] = []
  if (paths.length > 0) {
    const { data } = await supabase.storage.from('avatars').createSignedUrls(paths, 3600)
    if (data) signedUrls = data
  }

  // 5. Mappatura Sicura (Uniamo i dati della candidatura con il profilo corretto)
  const candidatureArricchite = posizione.candidature?.map((cand: any) => {
    const profiloBase = profiliVolontari?.find((p: any) => p.id === cand.volontario_id)
    
    let finalAvatar = profiloBase?.foto_profilo_url
    if (profiloBase?.foto_profilo_url && !profiloBase.foto_profilo_url.startsWith('http')) {
      const linkFirmato = signedUrls.find((s: any) => s.path === profiloBase.foto_profilo_url)
      if (linkFirmato?.signedUrl) finalAvatar = linkFirmato.signedUrl
    }

    return {
      ...cand,
      volontario: {
        profili_volontari: profiloBase ? {
          ...profiloBase,
          foto_profilo_url: finalAvatar
        } : null
      }
    }
  }) || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      {/* HEADER PAGINA */}
      <div className="mb-10 flex flex-col gap-6">
        <Link 
          href="/app/associazione" 
          className="group flex w-max items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-emerald-600"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all group-hover:bg-emerald-50 group-hover:ring-emerald-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </div>
          Torna alla Dashboard
        </Link>
        
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 ring-1 ring-emerald-500/20">
              Gestione Candidati
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {posizione.titolo}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-bold text-slate-700">{candidatureArricchite.length}</span> candidature totali
          </div>
        </div>
      </div>

      {/* COMPONENTE CLIENT INTERATTIVO */}
      <GestioneCandidatiClient 
        candidatureIniziali={candidatureArricchite} 
        posizioneId={posizione.id}
        associazioneId={user.id}
      />
    </div>
  )
}