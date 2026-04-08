import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormPosizione from '@/components/FormPosizione'
import { updatePosizione } from '../../../actions'

export default async function ModificaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. CHIEDIAMO AL DB ANCHE LE COMPETENZE DELL'ANNUNCIO
  const { data: pos } = await supabase
    .from('posizioni')
    .select('*, posizione_tags(tag_id), posizione_competenze(competenza_id)')
    .eq('id', id)
    .single()
    
  if (!user || !pos || pos.associazione_id !== user.id) redirect('/app/associazione')

  // 2. RECUPERIAMO IN PARALLELO TUTTI I TAG E TUTTE LE COMPETENZE UFFICIALI
  const [ { data: allTags }, { data: allCompetenze } ] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('competenze').select('*').eq('is_official', true).order('name')
  ])

  // 3. ESTRAIAMO GLI ID PER "ACCENDERE" I BOTTONI GIÀ SELEZIONATI NEL FORM
  const tagsSelezionati = pos.posizione_tags?.map((pt: any) => pt.tag_id) || []
  const competenzeSelezionate = pos.posizione_competenze?.map((pc: any) => pc.competenza_id) || []
  
  const actionConId = updatePosizione.bind(null, id)

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 pb-24 min-h-screen">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Modifica Annuncio</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Aggiorna i requisiti e i dettagli della tua ricerca.</p>
        </div>
        <Link href="/app/associazione" className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors active:scale-95">
          ← INDIETRO
        </Link>
      </div>
      
      <FormPosizione 
        posizione={pos} 
        tagsDisponibili={allTags || []} 
        tagsSelezionati={tagsSelezionati}
        competenzeDisponibili={allCompetenze || []}       // <-- PASSAGGIO MAGICO
        competenzeSelezionate={competenzeSelezionate}     // <-- PASSAGGIO MAGICO
        salvaAction={actionConId} 
      />
    </div>
  )
}