import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge' // <--- IMPORTIAMO LE COMPETENZE

export default async function ProfiloPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // QUERY POTENZIATA: Peschiamo Tag E Competenze!
  const { data: vol } = await supabase
    .from('volontari')
    .select('*, tags:volontario_tags(tag:tags(id, name)), competenze:volontario_competenze(competenza:competenze(id, name))')
    .eq('id', user.id)
    .single()

  const { data: ass } = await supabase
    .from('associazioni')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: imp } = await supabase
    .from('imprese')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!vol && !ass && !imp) redirect('/app/onboarding')

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-12">
          
          {/* HEADER PROFILO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-slate-100 text-slate-500">
                Profilo {vol ? 'Volontario' : 'Associazione'}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                {vol ? vol.nome_completo : ass?.nome}
              </h1>
              <p className="text-slate-500 font-medium mt-2">{user.email}</p>
            </div>
            
            {/* AZIONI PROFILO */}
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/profilo/modifica"
                className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95"
              >
                MODIFICA PROFILO
              </Link>
              <Link 
                href={vol ? "/app/volontario" : ass ? "/app/associazione" : "/app/impresa"}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                VAI ALLA DASHBOARD
              </Link>
            </div>
          </div>

          {/* CONTENUTO SPECIFICO */}
          <div className="space-y-10">
            {/* BIO / DESCRIZIONE */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                {vol ? 'La tua Bio' : 'Descrizione Associazione'}
              </h2>
              <p className="text-slate-700 font-medium leading-relaxed text-lg">
                {vol ? (vol.bio || "Nessuna bio inserita. Modifica il profilo per farti conoscere meglio dalle associazioni!") : ass?.descrizione}
              </p>
            </div>

            {/* SEZIONI VOLONTARIO: TAG E COMPETENZE */}
            {vol && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* I TAG (IL CUORE) */}
                <div>
                  <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">I tuoi Interessi</h2>
                  <div className="flex flex-wrap gap-3">
                    {vol.tags && vol.tags.length > 0 ? (
                      vol.tags.map((item: any) => (
                        <TagBadge key={item.tag.id} nome={item.tag.name} size="md" />
                      ))
                    ) : (
                      <p className="text-sm font-medium text-slate-400 italic">Nessun interesse selezionato.</p>
                    )}
                  </div>
                </div>

                {/* LE COMPETENZE (LE MANI) - NUOVA SEZIONE! */}
                <div>
                  <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">I tuoi Superpoteri</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {vol.competenze && vol.competenze.length > 0 ? (
                      vol.competenze.map((item: any) => (
                        <CompetenzaBadge key={item.competenza.id} nome={item.competenza.name} />
                      ))
                    ) : (
                      <p className="text-sm font-medium text-slate-400 italic">Nessuna competenza inserita.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* DATA ISCRIZIONE */}
            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Membro dal {new Date(vol ? vol.created_at : ass?.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}