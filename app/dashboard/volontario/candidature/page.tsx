import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MieCandidature() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  )

  // 1. Controllo Utente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Recuperiamo le candidature del volontario loggato, unendo i dati della posizione
  const { data: candidature, error } = await supabase
    .from('candidature')
    .select(`
      id,
      stato,
      created_at,
      posizione_id,
      posizioni (
        titolo,
        dove,
        quando
      )
    `)
    .eq('volontario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Errore recupero candidature:", error.message)
  }

  // Funzione per i colori dei badge di stato
  const getBadgeStyle = (stato: string) => {
    switch (stato) {
      case 'accettata':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rifiutata':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'accettata': return 'Accettata 🎉'
      case 'rifiutata': return 'Chiusa ❌'
      default: return 'In Attesa ⏳'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/volontario" className="text-slate-500 font-black flex items-center gap-2 hover:text-blue-600 transition-colors">
            ← TORNA ALLA BACHECA
          </Link>
          <h1 className="font-black text-slate-800 text-xl">Le Mie Candidature</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        {!candidature || candidature.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Nessuna candidatura</h2>
            <p className="text-slate-500 mb-6 font-medium">Non ti sei ancora candidato a nessuna posizione.</p>
            <Link href="/dashboard/volontario" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all">
              Esplora Annunci
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {candidature.map((cand: any) => (
              <div key={cand.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg border border-slate-100 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getBadgeStyle(cand.stato)}`}>
                      {getStatoLabel(cand.stato)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Inviata il {new Date(cand.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {cand.posizioni?.titolo || 'Posizione rimossa'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                    <span>📍 {cand.posizioni?.dove}</span>
                    <span>📅 {cand.posizioni?.quando}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Link 
                    href={`/dashboard/volontario/posizione/${cand.posizione_id}`}
                    className="px-6 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold border border-slate-200 hover:bg-slate-100 text-center transition-colors"
                  >
                    Vedi Dettagli
                  </Link>
                  
                  {/* Tasto Chat: Visibile solo se la candidatura è accettata! */}
                  {cand.stato === 'accettata' && (
                    <Link 
                      href={`/dashboard/volontario/chat/${cand.id}`}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-200 text-center transition-all"
                    >
                      Apri Chat 💬
                    </Link>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}