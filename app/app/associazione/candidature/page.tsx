import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InboxCandidatureClient from '@/components/InboxCandidatureClient'

export default async function HubCandidature() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Controllo Utente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. FETCH PARALLELO: Tutte le candidature + Tutte le posizioni dell'associazione
  const [ { data: candidature, error: errorCandidature }, { data: posizioni } ] = await Promise.all([
    supabase
      .from('candidature')
      .select(`
        id,
        stato,
        created_at,
        volontario_id,
        posizioni!inner (
          id,
          titolo,
          associazione_id
        )
      `)
      .eq('posizioni.associazione_id', user.id)
      .order('created_at', { ascending: false }),
      
    // Fetch indipendente per popolare la tendina di filtro nel Client
    supabase
      .from('posizioni')
      .select('id, titolo')
      .eq('associazione_id', user.id)
      .order('created_at', { ascending: false })
  ])

  if (errorCandidature || !candidature) {
    console.error("Errore recupero candidature:", errorCandidature?.message)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-rose-600">Impossibile caricare l'inbox delle candidature.</p>
        </div>
      </div>
    )
  }

  // 3. Estrazione profili univoci tramite RPC in parallelo
  // Usiamo gli ID delle posizioni trovate nelle candidature per mappare i volontari
  const idsPosizioniCandidati = Array.from(new Set(candidature.map((c: any) => c.posizioni?.id))).filter(Boolean)
  
  let profili: any[] = []
  let signedUrls: any[] = []

  if (idsPosizioniCandidati.length > 0) {
    const profiliPromises = idsPosizioniCandidati.map(posId => 
      supabase.rpc('get_profili_candidati', { p_posizione_id: posId })
    )
    
    const risultatiProfili = await Promise.all(profiliPromises)
    
    let tuttiIProfili: any[] = []
    risultatiProfili.forEach(res => {
      if (res.data) tuttiIProfili = [...tuttiIProfili, ...res.data]
    })

    profili = Array.from(new Map(tuttiIProfili.map(p => [p.id, p])).values())

    const pathsToSign = profili
      .map(p => p.foto_profilo_url)
      .filter(url => url && !url.startsWith('http'))

    if (pathsToSign.length > 0) {
      const { data } = await supabase.storage.from('avatars').createSignedUrls(pathsToSign, 3600)
      if (data) signedUrls = data
    }
  }

  // 4. Mappatura e Merge finale
  const candidatureArricchite = candidature.map((cand: any) => {
    const profiloBase = profili.find(p => p.id === cand.volontario_id)
    
    let finalAvatar = profiloBase?.foto_profilo_url
    if (profiloBase?.foto_profilo_url && !profiloBase.foto_profilo_url.startsWith('http')) {
      const linkFirmato = signedUrls.find(s => s.path === profiloBase.foto_profilo_url)
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
  })

  return (
    <div className="h-[calc(100dvh-90px)] lg:h-[calc(100dvh-76px)] overflow-hidden bg-slate-50 flex flex-col">
      
      {/* HEADER MINIMALE */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shrink-0 z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/app/associazione" 
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight leading-tight">
                Inbox Candidature
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Flusso operativo globale
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CORE CLIENT COMPONENT */}
      <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto p-0 lg:p-6 flex flex-col overflow-hidden">
        <InboxCandidatureClient 
          candidatureIniziali={candidatureArricchite} 
          posizioniDisponibili={posizioni || []} /* 🚨 PROP CRITICA AGGIUNTA */
          associazioneId={user.id} 
        />
      </div>

    </div>
  )
}