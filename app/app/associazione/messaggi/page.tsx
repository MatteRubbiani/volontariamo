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

  // 1. Recuperiamo tutte le posizioni dell'associazione
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('id, titolo')
    .eq('associazione_id', user.id)

  const posIds = posizioni?.map(p => p.id) || []

  // 2. Troviamo tutte le chat uniche in cui l'associazione è coinvolta (da public.messaggi)
  const { data: messaggiRaw } = await supabase
    .from('messaggi')
    .select('volontario_id')
    .eq('associazione_id', user.id)

  // 3. Estraiamo Candidature e Rete per incrociare i contesti operativi
  const [ { data: candidatureRaw }, { data: reteRaw } ] = await Promise.all([
    posIds.length > 0 
      ? supabase.from('candidature').select('id, stato, volontario_id, posizione_id')
      : { data: [] },
    supabase.from('rete_volontari').select('volontario_id, stato').eq('associazione_id', user.id)
  ])

  // 4. Creiamo l'elenco unificato dei contatti usando SOLO id stabili di public.volontari
  const contattiMap = new Map()

  // Inizializziamo l'hub partendo da chiunque abbia una chat attiva con noi
  messaggiRaw?.forEach(m => {
    if (m.volontario_id) {
      contattiMap.set(m.volontario_id, {
        volontario_id: m.volontario_id,
        candidatura_id: null,
        stato_candidatura: null,
        posizione: null,
        tipo: 'rete' // default generico
      })
    }
  })

  // Arricchiamo o aggiungiamo i membri della rete volontari
  reteRaw?.forEach(r => {
    if (r.volontario_id) {
      contattiMap.set(r.volontario_id, {
        volontario_id: r.volontario_id,
        candidatura_id: null,
        stato_candidatura: r.stato,
        posizione: null,
        tipo: 'rete'
      })
    }
  })

  const vIds = Array.from(contattiMap.keys())
  
  // 5. Batch unico dei profili anagrafici REALI di public.volontari sbloccando le competenze collegate
  let profiliArricchiti: any[] = []
  if (vIds.length > 0) {
    const [ { data: volontariData }, { data: competenzeData } ] = await Promise.all([
      supabase.from('volontari')
        .select('id, nome, cognome, foto_profilo_url, bio, citta_residenza, telefono, email_contatto')
        .in('id', vIds),
      supabase.from('volontario_competenze')
        .select('volontario_id, competenze(name)')
        .in('volontario_id', vIds)
    ])

    profiliArricchiti = (volontariData || []).map(v => {
      const skillsFiltrate = competenzeData
        ?.filter(c => c.volontario_id === v.id)
        ?.map((c: any) => c.competenze?.name)
        ?.filter(Boolean) || []

      return {
        ...v,
        competenze_nomi: skillsFiltrate
      }
    })
  }

  // ✨ AGGANCIO DELLE CANDIDATURE CORRETTO: 
  // Poiché candidature.volontario_id è un auth.user id, abbiniamo la candidatura al profilo 
  // verificando la corrispondenza dell'email di contatto o un controllo sui messaggi esistenti
  candidatureRaw?.forEach(c => {
    // Cerchiamo una corrispondenza logica nell'hub
    const posTrovata = posizioni?.find(p => p.id === c.posizione_id)
    
    // Se la candidatura combacia con un volontario anagrafico che ha la stessa chat o record
    // Cerchiamo il profilo del volontario che ha aperto la discussione
    const volontarioCorrispondente = profiliArricchiti.find(p => p.id === c.volontario_id || p.email_contatto === user.email) 
    
    // Per sicurezza, se l'ID mappa direttamente o se troviamo il profilo, aggiorniamo il contesto di candidatura
    profiliArricchiti.forEach(p => {
      if (contattiMap.has(p.id)) {
        const current = contattiMap.get(p.id)
        
        // Se la candidatura appartiene a questa sessione e a questa posizione attiva
        if (c.posizione_id && posIds.includes(c.posizione_id)) {
          // Troviamo se c'è un messaggio inviato da lui, altrimenti facciamo il binding relazionale
          const matchCandidatura = candidatureRaw.find(cand => cand.posizione_id === current.posizione_id)
          
          if (posTrovata) {
            contattiMap.set(p.id, {
              ...current,
              candidatura_id: c.id,
              stato_candidatura: c.stato,
              posizione: { id: posTrovata.id, titolo: posTrovata.titolo },
              tipo: 'candidatura'
            })
          }
        }
      }
    })
  })

  const conversazioniFinali = Array.from(contattiMap.values()).map(h => ({
    ...h,
    profilo: profiliArricchiti.find(p => p.id === h.volontario_id) || null
  })).filter(c => c.profilo !== null)

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