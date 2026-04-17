import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VolontarioDashboard } from '@/components/VolontarioDashboard'

export default async function DashboardVolontario() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Tiriamo giù i dati dell'utente per la personalizzazione
  const [ { data: profile }, { data: userTagsData }, { data: userCompData } ] = await Promise.all([
    supabase.from('volontari').select('nome, citta_residenza').eq('id', user.id).single(),
    supabase.from('volontario_tags').select('tag_id').eq('volontario_id', user.id),
    supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', user.id)
  ])
  
  const userTagIds = userTagsData?.map(t => t.tag_id) || []
  const userCompIds = userCompData?.map(c => c.competenza_id) || []

  // Tiriamo giù le ultime 50 posizioni attive dal DB per popolare il "Feed"
  const { data: posizioniGrezze } = await supabase
    .from('posizioni')
    .select(`
      *, 
      media_associazioni(url),
      associazione:associazioni(id, nome, email_contatto),
      tags:posizione_tags(tag:tags(id, name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Formattiamo per la card
  const posizioni = (posizioniGrezze || []).map((p: any) => {
    const associazioneObj = Array.isArray(p.associazione) ? p.associazione[0] : p.associazione;
    return {
      ...p,
      associazione: associazioneObj || null,
      tags: p.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      competenze: p.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
    }
  })

  return (
    <VolontarioDashboard 
      nomeUtente={profile?.nome || 'Volontario'}
      cittaUtente={profile?.citta_residenza || null}
      posizioni={posizioni}
      userTagIds={userTagIds}
      userCompIds={userCompIds}
    />
  )
}