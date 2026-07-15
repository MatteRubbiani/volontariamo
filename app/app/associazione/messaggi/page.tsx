import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import HubMessaggiClient from '@/components/HubMessaggiClient'

export default async function HubMessaggi() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. Recuperiamo le posizioni
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('id, titolo')
    .eq('associazione_id', user.id)

  const posIds = posizioni?.map(p => p.id) || []

  // 2. ASSICURIAMOCI DI ESTRARRE LA COLONNA 'letto' DAL DB
  const { data: messaggiRaw } = await supabase
    .from('messaggi')
    .select('volontario_id, posizione_id, created_at, testo, mittente_id, letto')
    .eq('associazione_id', user.id)
    .order('created_at', { ascending: false })

  const volontariIdsNeiMessaggi = Array.from(
    new Set(messaggiRaw?.map(m => m.volontario_id).filter(Boolean) as string[])
  )

  if (volontariIdsNeiMessaggi.length === 0) {
    return (
      <div className="h-[calc(100dvh-64px)] bg-white overflow-hidden flex flex-col font-sans text-slate-900 antialiased">
        <div className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto flex flex-col overflow-hidden">
          <HubMessaggiClient 
            conversazioniIniziali={[]} 
            posizioniDisponibili={posizioni || []} 
            associazioneId={user.id} 
          />
        </div>
      </div>
    )
  }

  // 3. Recupero anagrafiche e candidature
  const [ { data: profiliData }, { data: candidatureRaw } ] = await Promise.all([
    supabase
      .from('volontari')
      .select('id, nome, cognome, foto_profilo_url, bio, citta_residenza, telefono, email_contatto, volontario_competenze(competenze(name))')
      .in('id', volontariIdsNeiMessaggi),
    posIds.length > 0 
      ? supabase
          .from('candidature')
          .select('id, stato, volontario_id, posizione_id, volontario:volontario_id(email)')
          .in('posizione_id', posIds)
      : Promise.resolve({ data: [] })
  ])

  const profiliMap = new Map((profiliData || []).map(p => [p.id, p]))
  const contattiMap = new Map()

  messaggiRaw?.forEach(m => {
    if (!m.volontario_id) return
    
    const chiaveDiscussione = m.volontario_id

    if (!contattiMap.has(chiaveDiscussione)) {
      let profiloVolontario = profiliMap.get(m.volontario_id)
      
      if (!profiloVolontario) {
        profiloVolontario = { 
          id: m.volontario_id, 
          nome: 'Utente', 
          cognome: 'Sconosciuto', 
          email_contatto: null,
          foto_profilo_url: null,
          bio: null,
          citta_residenza: null,
          telefono: null,
          volontario_competenze: [] 
        }
      }

      const candidaturaCollegata = candidatureRaw?.find(c => {
        const emailCandidato = (c.volontario as any)?.email
        return emailCandidato && emailCandidato === profiloVolontario?.email_contatto
      })
      
      const contestoPosizioneId = candidaturaCollegata?.posizione_id || m.posizione_id
      const posDettaglio = posizioni?.find(p => p.id === contestoPosizioneId)

      // 🚨 LA NUOVA LOGICA INFALLIBILE SUL CAMPO 'LETTO' 🚨
      // Cerchiamo se c'è ALMENO UN messaggio in tutta la cronologia di questo utente
      // che ci è stato inviato (mittente_id !== user.id) e che nel DB risulta NON letto.
      // Usiamo (msg.letto === false || msg.letto === null) per gestire eventuali valori nulli.
      const haMessaggiNonLetti = messaggiRaw.some(msg => 
        msg.volontario_id === m.volontario_id && 
        msg.mittente_id !== user.id && 
        (msg.letto === false || msg.letto === null)
      )

      contattiMap.set(chiaveDiscussione, {
        chiave_id: chiaveDiscussione,
        volontario_id: m.volontario_id,
        posizione_id: contestoPosizioneId || null,
        candidatura_id: candidaturaCollegata?.id || null,
        stato_candidatura: candidaturaCollegata?.stato || null,
        posizione: posDettaglio ? { id: posDettaglio.id, titolo: posDettaglio.titolo } : null,
        tipo: candidaturaCollegata ? 'candidatura' : contestoPosizioneId ? 'richiesta_info' : 'generale',
        
        // 👉 IL DATO ESTRATTO DAL DATABASE
        non_letto: haMessaggiNonLetti,
        
        ultimo_messaggio_testo: m.testo,
        ultimo_messaggio_data: m.created_at,
        profilo: {
          ...profiloVolontario,
          competenze_nomi: profiloVolontario.volontario_competenze?.map((c: any) => c.competenze?.name).filter(Boolean) || []
        }
      })
    }
  })

  const conversazioniFinali = Array.from(contattiMap.values())
    .sort((a, b) => new Date(b.ultimo_messaggio_data).getTime() - new Date(a.ultimo_messaggio_data).getTime())

  return (
    <div className="h-[calc(100dvh-64px)] bg-white overflow-hidden flex flex-col font-sans text-slate-900 antialiased">
      <div className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto flex flex-col overflow-hidden">
        <HubMessaggiClient 
          conversazioniIniziali={conversazioniFinali} 
          posizioniDisponibili={posizioni || []} 
          associazioneId={user.id} 
        />
      </div>
    </div>
  )
}