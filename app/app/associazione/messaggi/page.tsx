import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  // 1. Fetch Parallelo: Candidature (per contesto) + Posizioni (per filtro) + Rete (per contatti diretti)
  const [
    { data: candidature },
    { data: posizioni },
    { data: rete }
  ] = await Promise.all([
    supabase.from('candidature').select('id, stato, volontario_id, posizioni(id, titolo)').eq('posizioni.associazione_id', user.id),
    supabase.from('posizioni').select('id, titolo').eq('associazione_id', user.id),
    supabase.from('rete_volontari').select('volontario_id').eq('associazione_id', user.id)
  ])

  // 2. Prepariamo la lista dei volontari (il nostro "Hub")
  // Usiamo un Map per garantire unicità assoluta per volontario_id
  const hubVolontari = new Map();

  // Aggiungiamo chi si è candidato
  candidature?.forEach(c => {
    hubVolontari.set(c.volontario_id, {
      volontario_id: c.volontario_id,
      posizioni: c.posizioni,
      tipo: 'candidatura'
    });
  });

  // Aggiungiamo chi è nella rete (senza sovrascrivere se già presente)
  rete?.forEach(r => {
    if (!hubVolontari.has(r.volontario_id)) {
      hubVolontari.set(r.volontario_id, {
        volontario_id: r.volontario_id,
        posizioni: { titolo: 'Rete Volontari' },
        tipo: 'rete'
      });
    }
  });

  // 3. Arricchimento profili (Batch unica)
  const vIds = Array.from(hubVolontari.keys());
  const { data: profili } = await supabase.from('volontari').select('id, nome, cognome, foto_profilo_url').in('id', vIds);
  
  const conversazioniArricchite = Array.from(hubVolontari.values()).map(h => ({
    ...h,
    volontario: { profili_volontari: profili?.find(p => p.id === h.volontario_id) }
  }));

  return (
    <div className="h-[calc(100dvh-76px)] overflow-hidden bg-slate-50 flex flex-col">
      <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto lg:p-6 flex flex-col overflow-hidden">
        <HubMessaggiClient 
          conversazioniIniziali={conversazioniArricchite} 
          posizioniDisponibili={posizioni || []} 
          associazioneId={user.id} 
        />
      </div>
    </div>
  )
}