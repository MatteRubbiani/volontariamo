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
  
  // 1. Carica dati volontario con tags e competenze
  const { data: vol } = await supabase
    .from('volontari')
    .select('*, tags:volontario_tags(tag_id), competenze:volontario_competenze(competenza_id)')
    .eq('id', user.id)
    .maybeSingle()
    
  // 2. Carica dati associazione con i NUOVI TAGS collegati
  const { data: ass } = await supabase
    .from('associazioni')
    .select('*, tags:associazione_tags(tag_id)')
    .eq('id', user.id)
    .maybeSingle()
  
  // 3. Carica i cataloghi generali per i menu a tendina
  const { data: allTags } = await supabase.from('tags').select('*').order('name')
  const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

  // 4. Capiamo chi abbiamo davanti e formattiamo i dati in modo pulito
  const isVol = !!vol
  const isAss = !!ass
  const profiloData = isVol ? vol : ass
  
  // Fallback di sicurezza: se non c'è né l'uno né l'altro, torna all'onboarding
  if (!profiloData) redirect('/app/onboarding')

  // 5. Estrazione intelligente dei Tag (funziona per entrambi!)
  let currentTags: string[] = []
  if (isVol && vol.tags) {
    currentTags = vol.tags.map((t: any) => t.tag_id)
  } else if (isAss && ass.tags) {
    currentTags = ass.tags.map((t: any) => t.tag_id)
  }

  // Le competenze per ora ce l'ha solo il volontario
  const currentCompetenze = vol?.competenze?.map((c: any) => c.competenza_id) || []

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 pb-24">
      <h1 className="text-4xl font-black mb-10 text-slate-800 tracking-tight">Modifica Profilo</h1>
      
      <FormModificaProfilo 
        isVolontario={isVol}
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