import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions'
import FormModificaProfilo from '@/components/FormModificaProfilo'
import { redirect } from 'next/navigation'

export default async function ModificaProfilo() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  // 1. IL NUOVO STANDARD: Chiediamo all'Hub chi abbiamo davanti
  const { data: hub } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .maybeSingle()

  if (!hub || !hub.ruolo) redirect('/app/onboarding')
  
  const role = hub.ruolo
  let profiloData = null
  let currentTags: string[] = []
  let currentCompetenze: string[] = []

  // 2. Query chirurgica in base al ruolo esatto
  if (role === 'volontario') {
    const { data: vol } = await supabase
      .from('volontari')
      .select('*, tags:volontario_tags(tag_id), competenze:volontario_competenze(competenza_id)')
      .eq('id', user.id)
      .single()
    profiloData = vol
    currentTags = vol?.tags?.map((t: any) => t.tag_id) || []
    currentCompetenze = vol?.competenze?.map((c: any) => c.competenza_id) || []
    
  } else if (role === 'associazione') {
    const { data: ass } = await supabase
      .from('associazioni')
      .select('*, tags:associazione_tags(tag_id)')
      .eq('id', user.id)
      .single()
    profiloData = ass
    currentTags = ass?.tags?.map((t: any) => t.tag_id) || []
    
  } else if (role === 'impresa') {
    const { data: imp } = await supabase
      .from('imprese')
      .select('*')
      .eq('id', user.id)
      .single()
    profiloData = imp
    // Niente tags relazionali per le imprese per il momento!
  }

  // Fallback di sicurezza
  if (!profiloData) redirect('/app/onboarding')

  // 3. Carica i cataloghi generali per i menu a tendina
  const { data: allTags } = await supabase.from('tags').select('*').order('name')
  const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 pb-24">
      <h1 className="text-4xl font-black mb-10 text-slate-800 tracking-tight">Modifica Profilo</h1>
      
      <FormModificaProfilo 
        ruolo={role} // <-- ATTENZIONE QUI: Non passiamo più un booleano, ma il ruolo esatto!
        profilo={profiloData}
        allTags={allTags || []}
        tagsIniziali={currentTags}
        allCompetenze={allCompetenze || []}
        competenzeIniziali={currentCompetenze}
        salvaAction={updateProfilo}
      />
    </div>
  )
}