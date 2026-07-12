import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormPosizioneConPreview from '@/components/FormPosizioneConPreview'
import DeletePosizioneButton from '@/components/DeletePosizioneButton'
import { updatePosizione, deletePosizione } from '../../../actions'
import { ArrowLeft, Layers } from 'lucide-react'

export default async function ModificaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. QUERY DETTAGLIATA CON RELAZIONI
  const { data: pos } = await supabase
    .from('posizioni')
    .select('*, posizione_tags(tag_id), posizione_competenze(competenza_id), media_associazioni(url)')
    .eq('id', id)
    .single()
    
  if (!user || !pos || pos.associazione_id !== user.id) redirect('/app/associazione/posizioni')

  // 2. QUERY PARALLELE DEGLI ASSET COMPLEMENTARI
  const [ { data: allTags }, { data: allCompetenze }, { data: mediaGallery } ] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('competenze').select('*').eq('is_official', true).order('name'),
    supabase.from('media_associazioni').select('*').eq('associazione_id', user.id).order('created_at', { ascending: false })
  ])

  // 3. ESTRAZIONE DEGLI ID SELEZIONATI
  const tagsSelezionati = pos.posizione_tags?.map((pt: any) => pt.tag_id) || []
  const competenzeSelezionate = pos.posizione_competenze?.map((pc: any) => pc.competenza_id) || []
  
  // Binding atomico con l'ID corrente per le Server Actions
  const actionConId = updatePosizione.bind(null, id)
  const deleteActionConId = deletePosizione.bind(null, id)

  return (
    // Allarghiamo il contenitore per ospitare in modo bilanciato la Live Preview a destra
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 pb-32 font-sans bg-white text-slate-900 antialiased">
      
      {/* HEADER MINIMALE ED ELEGANTE */}
      <div className="mb-12 flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 mb-1">
            <Layers className="w-3 h-3 text-slate-400" /> Editor Annunci
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Modifica opportunità esistente
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Modifica i dettagli operativi, i tag logistici o le foto di copertina salvate.
          </p>
        </div>
        
        {/* ACTION CONTROLS */}
        <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <Link 
            href="/app/associazione/posizioni" 
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-semibold transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Annulla
          </Link>
          
          {/* Pulsante distruttivo ereditato */}
          <DeletePosizioneButton deleteAction={deleteActionConId} />
        </div>
      </div>
      
      {/* COMPONENTE CLIENT UNIFICATO CON LIVE PREVIEW IN TEMPO REALE */}
      <FormPosizioneConPreview 
        posizione={pos} 
        tagsDisponibili={allTags || []} 
        tagsSelezionati={tagsSelezionati}
        competenzeDisponibili={allCompetenze || []}
        competenzeSelezionate={competenzeSelezionate}
        mediaDisponibili={mediaGallery || []} 
        salvaAction={actionConId} 
      />
    </div>
  )
}