import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import ChatModalButton from '@/components/ChatModalButton' // 🚨 IMPORTIAMO IL NOSTRO BOTTONE MAGICO

export default async function GestioneCandidature() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Controllo Utente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Recuperiamo le candidature SOLO per le posizioni create da questa associazione
  const { data: candidature, error } = await supabase
    .from('candidature')
    .select(`
      id,
      stato,
      created_at,
      volontario_id,
      posizioni!inner (
        id,
        titolo,
        associazione_id
      )
    `)
    .eq('posizioni.associazione_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Errore recupero candidature associazione:", error.message)
  }

  // --- SERVER ACTION: AGGIORNA STATO CANDIDATURA ---
  async function aggiornaStato(formData: FormData) {
    'use server'
    const candidaturaId = formData.get('candidaturaId') as string
    const nuovoStato = formData.get('nuovoStato') as string

    const cookieStore = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    await supabaseAction
      .from('candidature')
      .update({ stato: nuovoStato })
      .eq('id', candidaturaId)

    // Ricarichiamo la pagina per vedere il nuovo stato
    revalidatePath('/app/associazione/candidature')
  }

  // Stili per i badge
  const normalizzaStato = (stato: string) => {
    if (stato === 'accettata') return 'accettato'
    if (stato === 'rifiutata') return 'rifiutato'
    return stato
  }

  const getBadgeStyle = (stato: string) => {
    switch (stato) {
      case 'accettato': return 'bg-green-100 text-green-700 border-green-200'
      case 'rifiutato': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'accettato': return 'Accettata 🎉'
      case 'rifiutato': return 'Rifiutata ❌'
      default: return 'Nuova Richiesta 🔔'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* NAVBAR SUPERIORE */}
      <div className="bg-white border-b p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/app/associazione" className="text-slate-500 font-black flex items-center gap-2 hover:text-blue-600 transition-colors">
            ← TORNA ALLA DASHBOARD
          </Link>
          <h1 className="font-black text-slate-800 text-xl">Gestione Candidature</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {!candidature || candidature.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
            <div className="text-5xl mb-4">🏜️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Tutto tranquillo</h2>
            <p className="text-slate-500 font-medium">Non hai ancora ricevuto candidature per i tuoi annunci.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {candidature.map((cand: any) => {
              const statoNormalizzato = normalizzaStato(cand.stato)
              return (
              <div key={cand.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:shadow-md">
                
                {/* Info Candidatura */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getBadgeStyle(statoNormalizzato)}`}>
                      {getStatoLabel(statoNormalizzato)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Inviata il {new Date(cand.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">
                    {cand.posizioni?.titolo}
                  </h3>
                  
                  <div className="bg-slate-50 inline-block px-4 py-2 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Candidato</p>
                    <p className="font-bold text-slate-700 text-sm">
                      Volontario ID: <span className="font-mono text-xs">{cand.volontario_id.substring(0,8)}...</span>
                    </p>
                  </div>
                </div>

                {/* Azioni dell'Associazione */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {statoNormalizzato === 'in_attesa' ? (
                    <>
                      <form action={aggiornaStato} className="flex-1 lg:flex-none">
                        <input type="hidden" name="candidaturaId" value={cand.id} />
                        <input type="hidden" name="nuovoStato" value="rifiutato" />
                        <button type="submit" className="w-full px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 transition-colors">
                          Rifiuta
                        </button>
                      </form>

                      <form action={aggiornaStato} className="flex-1 lg:flex-none">
                        <input type="hidden" name="candidaturaId" value={cand.id} />
                        <input type="hidden" name="nuovoStato" value="accettato" />
                        <button type="submit" className="w-full px-8 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-200 transition-all">
                          Accetta
                        </button>
                      </form>
                    </>
                  ) : statoNormalizzato === 'accettato' ? (
                    <div className="flex gap-3 w-full lg:w-auto">
                      <div className="px-6 py-4 rounded-2xl bg-green-50 text-green-700 font-bold border border-green-200 flex-1 lg:flex-none text-center">
                        Accettata ✅
                      </div>
                      
                      {/* 🚨 SOSTITUZIONE: DA LINK AL NOSTRO NUOVO BOTTONE MODAL */}
                      <ChatModalButton 
                        candidaturaId={cand.id} 
                        associazioneId={user.id} 
                        titoloPosizione={cand.posizioni?.titolo || ''} 
                      />
                      
                    </div>
                  ) : (
                    <div className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold border border-slate-200 w-full lg:w-auto text-center">
                      Candidatura Chiusa
                    </div>
                  )}

                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}