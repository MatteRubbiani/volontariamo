import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfiloPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Cerchiamo i dati nelle due tabelle con i relativi tag
  const { data: vol } = await supabase
    .from('volontari')
    .select('*, tags:volontario_tags(tag:tags(id, name))')
    .eq('id', user.id)
    .single()

  const { data: ass } = await supabase
    .from('associazioni')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se non ha nessuno dei due profili, rimandalo all'onboarding
  if (!vol && !ass) redirect('/onboarding')

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl border shadow-sm p-8 md:p-12">
        
        {/* HEADER PROFILO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-slate-100 text-slate-600">
              Profilo {vol ? 'Volontario' : 'Associazione'}
            </span>
            <h1 className="text-4xl font-black text-slate-900">
              {vol ? vol.nome_completo : ass?.nome}
            </h1>
            <p className="text-slate-500">{user.email}</p>
          </div>
          
          {/* AZIONI PROFILO */}
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/profilo/modifica"
              className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              Modifica Profilo
            </Link>
            <Link 
              href={vol ? "/dashboard/volontario" : "/dashboard/associazione"}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              Vai alla Dashboard
            </Link>
          </div>
        </div>

        {/* CONTENUTO SPECIFICO */}
        <div className="space-y-8">
          {/* BIO / DESCRIZIONE */}
          <div>
            <h2 className="text-lg font-bold mb-3">Descrizione</h2>
            <p className="text-slate-600 leading-relaxed italic">
              "{vol ? (vol.bio || "Nessuna bio inserita") : ass?.descrizione}"
            </p>
          </div>

          {/* TAGS (Solo per Volontari) */}
          {vol && (
            <div>
              <h2 className="text-lg font-bold mb-4">I tuoi Interessi</h2>
              <div className="flex flex-wrap gap-2">
                {vol.tags && vol.tags.length > 0 ? (
                  vol.tags.map((item: any) => (
                    <span 
                      key={item.tag.id} 
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100"
                    >
                      #{item.tag.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Nessun tag selezionato.</p>
                )}
              </div>
            </div>
          )}

          {/* DATA ISCRIZIONE */}
          <div className="pt-6 border-t">
            <p className="text-xs text-slate-400 italic">
              Membro dal: {new Date(vol ? vol.created_at : ass?.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}