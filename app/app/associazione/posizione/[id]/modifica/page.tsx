import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormPosizione from '@/components/FormPosizione'
import DeletePosizioneButton from '@/components/DeletePosizioneButton'
import { updatePosizione, deletePosizione } from '../../../actions'

export default async function ModificaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. CHIEDIAMO AL DB LA POSIZIONE CON LE SUE RELAZIONI
  const { data: pos } = await supabase
    .from('posizioni')
    .select('*, posizione_tags(tag_id), posizione_competenze(competenza_id)')
    .eq('id', id)
    .single()
    
  if (!user || !pos || pos.associazione_id !== user.id) redirect('/app/associazione')

  // 2. RECUPERIAMO IN PARALLELO TAG, COMPETENZE E LA GALLERIA IMMAGINI CARICATA DALL'UTENTE
  const [ { data: allTags }, { data: allCompetenze }, { data: mediaGallery } ] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('competenze').select('*').eq('is_official', true).order('name'),
    supabase.from('media_associazioni').select('*').eq('associazione_id', user.id).order('created_at', { ascending: false })
  ])

  // 3. ESTRAIAMO GLI ID PER "ACCENDERE" I BOTTONI GIÀ SELEZIONATI NEL FORM
  const tagsSelezionati = pos.posizione_tags?.map((pt: any) => pt.tag_id) || []
  const competenzeSelezionate = pos.posizione_competenze?.map((pc: any) => pc.competenza_id) || []
  
  // Binding delle Server Actions con l'ID corrente
  const actionConId = updatePosizione.bind(null, id)
  const deleteActionConId = deletePosizione.bind(null, id)

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-24 min-h-screen">
      
      {/* HEADER PREMIUM MOBILE-FIRST */}
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <Link 
              href="/app/associazione" 
              className="sm:hidden inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-full text-xs font-black hover:bg-slate-200 active:scale-95 transition-all"
            >
              ←
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
              Modifica Annuncio
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm sm:text-lg pl-10 sm:pl-0">
            Aggiorna i requisiti o rimuovi la posizione.
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-2.5 self-end sm:self-auto w-full sm:w-auto">
          <Link 
            href="/app/associazione" 
            className="hidden sm:inline-flex px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95"
          >
            ← INDIETRO
          </Link>
          
          {/* Componente Foglia Interattivo */}
          <DeletePosizioneButton deleteAction={deleteActionConId} />
        </div>
      </div>
      
      <FormPosizione 
        posizione={pos} 
        tagsDisponibili={allTags || []} 
        tagsSelezionati={tagsSelezionati}
        competenzeDisponibili={allCompetenze || []}
        competenzeSelezionate={competenzeSelezionate}
        mediaDisponibili={mediaGallery || []} /* <-- AGGIUNTA LA PROP MANCANTE */
        salvaAction={actionConId} 
      />
    </div>
  )
}