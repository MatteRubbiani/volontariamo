import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions'
import FormModificaProfilo from '@/components/FormModificaProfilo'

export default async function ModificaProfilo() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  
  // Carica dati volontario con tags e competenze
  const { data: vol } = await supabase
    .from('volontari')
    .select('*, tags:volontario_tags(tag_id), competenze:volontario_competenze(competenza_id)')
    .eq('id', user?.id)
    .maybeSingle()
    
  // Carica dati associazione (con TUTTI i campi)
  const { data: ass } = await supabase.from('associazioni').select('*').eq('id', user?.id).maybeSingle()
  
  const { data: allTags } = await supabase.from('tags').select('*').order('name')
  const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

  const isVol = !!vol
  const currentTags = vol?.tags?.map((t: any) => t.tag_id) || []
  const currentCompetenze = vol?.competenze?.map((c: any) => c.competenza_id) || []
  
  const profiloData = isVol ? vol : ass

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