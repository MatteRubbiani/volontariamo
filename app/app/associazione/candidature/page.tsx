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

  // 2. Recuperiamo tutte le candidature ricevute da questa associazione
  const { data: candidature, error: errorCandidature } = await supabase
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
    .order('created_at', { ascending: false })

  if (errorCandidature || !candidature) {
    console.error("Errore recupero candidature:", errorCandidature?.message)
    return <div className="p-8 text-center text-red-500 font-bold">Impossibile caricare l'Inbox.</div>
  }

  // ... (codice precedente intatto fino al controllo if (errorCandidature || !candidature))

  // 3. ESTRAZIONE PROFILI TRAMITE RPC (Bypass RLS)
  // Troviamo tutte le posizioni uniche in questa inbox
  const idsPosizioni = Array.from(new Set(candidature.map((c: any) => c.posizioni?.id))).filter(Boolean)
  
  let profili: any[] = []
  let signedUrls: any[] = []

  if (idsPosizioni.length > 0) {
    // Lanciamo la vostra RPC in parallelo per tutte le posizioni
    const profiliPromises = idsPosizioni.map(posId => 
      supabase.rpc('get_profili_candidati', { p_posizione_id: posId })
    )
    
    // Aspettiamo che finiscano tutte insieme
    const risultatiProfili = await Promise.all(profiliPromises)
    
    // Uniamo tutti gli array di risultati in un unico grande calderone
    let tuttiIProfili: any[] = []
    risultatiProfili.forEach(res => {
      if (res.data) tuttiIProfili = [...tuttiIProfili, ...res.data]
    })

    // Rimuoviamo eventuali duplicati (se un volontario si è candidato a più posizioni)
    profili = Array.from(new Map(tuttiIProfili.map(p => [p.id, p])).values())

    // Generiamo i signed URLs per le foto caricate nello storage (esattamente come facevate)
    const pathsToSign = profili
      .map(p => p.foto_profilo_url)
      .filter(url => url && !url.startsWith('http'))

    if (pathsToSign.length > 0) {
      const { data } = await supabase.storage.from('avatars').createSignedUrls(pathsToSign, 3600)
      if (data) signedUrls = data
    }
  }

  // 4. MAPPATURA SICURA (Merge)
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
    // 1. IL FIX MAGICO: Sottraiamo l'altezza della Navbar Globale (es. 76px su desktop e la bottom-bar su mobile)
    <div className="h-[calc(100dvh-90px)] lg:h-[calc(100dvh-76px)] overflow-hidden bg-slate-50 flex flex-col">
      
      {/* NAVBAR SUPERIORE (Locale dell'Hub) */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/associazione" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </Link>
            <div>
              <h1 className="font-black text-slate-900 text-xl leading-tight">Hub Candidature</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Inbox Centralizzata</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AGGIUNTO 'overflow-hidden' ANCHE QUI: per evitare che il padding (p-6) causi sbrodolamenti */}
      <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto p-0 lg:p-6 flex flex-col overflow-hidden">
        <InboxCandidatureClient 
          candidatureIniziali={candidatureArricchite} 
          associazioneId={user.id} 
        />
      </div>
    </div>
  )
}