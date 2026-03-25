import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions'

export default async function ModificaProfilo() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  const { data: vol } = await supabase.from('volontari').select('*, tags:volontario_tags(tag_id)').eq('id', user?.id).single()
  const { data: ass } = await supabase.from('associazioni').select('*').eq('id', user?.id).single()
  const { data: allTags } = await supabase.from('tags').select('*')

  const isVol = !!vol
  const currentTags = vol?.tags?.map((t: any) => t.tag_id) || []

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-black mb-8">Modifica Profilo</h1>
      <form action={updateProfilo} className="space-y-6 bg-white p-8 rounded-3xl border">
        <input type="hidden" name="role" value={isVol ? 'volontario' : 'associazione'} />
        
        <div>
          <label className="block text-sm font-bold mb-2">Nome {isVol ? 'Completo' : 'Associazione'}</label>
          <input name="nome" defaultValue={isVol ? vol.nome_completo : ass.nome} className="w-full p-4 border rounded-xl" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">{isVol ? 'Bio' : 'Descrizione'}</label>
          <textarea name="bio" defaultValue={isVol ? vol.bio : ass.descrizione} className="w-full p-4 border rounded-xl h-32" />
        </div>

        {isVol && (
          <div>
            <label className="block text-sm font-bold mb-4">I tuoi Interessi (Tag)</label>
            <div className="flex flex-wrap gap-2">
              {allTags?.map(t => (
                <label key={t.id} className={`px-3 py-1 rounded-full text-sm cursor-pointer border ${currentTags.includes(t.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" name="tags" value={t.id} defaultChecked={currentTags.includes(t.id)} className="mr-2" />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl">Salva Modifiche</button>
          <a href="/profilo" className="flex-1 bg-slate-100 text-center font-bold py-4 rounded-xl">Annulla</a>
        </div>
      </form>
    </div>
  )
}