import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormPosizione from '@/components/FormPosizione'
import { updatePosizione } from '../../../actions'

export default async function ModificaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() } } })

  const { data: { user } } = await supabase.auth.getUser()
  
  // Recuperiamo posizione + tag_id associati
  const { data: pos } = await supabase.from('posizioni').select('*, posizione_tags(tag_id)').eq('id', id).single()
  // Tutti i tag disponibili per il db
  const { data: allTags } = await supabase.from('tags').select('*')

  if (!user || !pos || pos.associazione_id !== user.id) redirect('/dashboard/associazione')

  const tagsSelezionati = pos.posizione_tags.map((pt: any) => pt.tag_id)
  const actionConId = updatePosizione.bind(null, id)

  return (
    <div className="max-w-4xl mx-auto p-10 bg-slate-50 min-h-screen">
      <Link href="/dashboard/associazione" className="text-slate-400 font-bold mb-6 block">← Annulla</Link>
      <h1 className="text-4xl font-black text-slate-800 mb-10 tracking-tighter">Modifica Annuncio</h1>
      
      <FormPosizione 
        posizione={pos} 
        tagsDisponibili={allTags || []} 
        tagsSelezionati={tagsSelezionati}
        salvaAction={actionConId} 
      />
    </div>
  )
}