import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function DashboardAssociazione() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('*, tags:posizione_tags(tag:tags(name))')
    .eq('associazione_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Le tue Posizioni</h1>
          <p className="text-slate-500">Gestisci i tuoi annunci di volontariato attivi.</p>
        </div>
        
        {/* IL TASTO AGGIUNGI */}
        <Link 
          href="/dashboard/associazione/nuova" 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <span className="text-xl">+</span> Aggiungi Posizione
        </Link>
      </div>

      {/* ELENCO POSIZIONI */}
      <div className="grid gap-6">
        {posizioni?.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Non hai ancora pubblicato nessuna posizione.</p>
            <Link href="/dashboard/associazione/nuova" className="text-blue-600 font-bold hover:underline mt-2 inline-block">
              Crea la tua prima inserzione ora
            </Link>
          </div>
        ) : (
          posizioni?.map(p => (
            <div key={p.id} className="bg-white p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{p.titolo}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm font-bold text-slate-400">
                    <span className="flex items-center gap-1">📍 {p.dove}</span>
                    <span className="flex items-center gap-1">📅 {p.quando}</span>
                  </div>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                    p.tipo === 'ricorrente' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {p.tipo.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <p className="text-slate-600 leading-relaxed mb-6">{p.descrizione}</p>
              
              <div className="flex flex-wrap gap-2">
                {p.tags?.map((t: any) => (
                  <span key={t.tag.name} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                    #{t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}