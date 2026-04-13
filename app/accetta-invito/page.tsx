import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { accettaInvitoAziendale } from './actions'

// In Next.js 15, searchParams è una Promise
export default async function AccettaInvitoPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ token?: string }> 
}) {
  const params = await searchParams
  const token = params?.token

  if (!token) {
    return <ErrorUI message="Nessun token fornito nell'URL." />
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Cerchiamo l'invito nel database (Query pubblica, saltiamo le RLS col match esatto)
  const { data: invito } = await supabase
    .from('inviti_impresa')
    .select('*, imprese(ragione_sociale)')
    .eq('token', token)
    .eq('stato', 'in_attesa')
    .maybeSingle()

  if (!invito) {
    return <ErrorUI message="Questo link di invito è scaduto, non valido o è già stato utilizzato." />
  }

  const nomeAzienda = invito.imprese?.ragione_sociale || 'un\'azienda'

  // 2. Controlliamo se l'utente è loggato
  const { data: { user } } = await supabase.auth.getUser()

  // STATO A: Utente NON loggato
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl p-10 text-center border border-slate-100">
          <div className="text-6xl mb-6">🏢</div>
          <h1 className="text-2xl font-black text-slate-900 mb-4">Sei stato invitato!</h1>
          <p className="text-slate-600 mb-8 font-medium">
            <strong className="text-violet-600">{nomeAzienda}</strong> ti ha invitato ad unirti al suo programma di impatto sociale.
          </p>
          <div className="space-y-4">
            <a href={`/auth/login?redirectTo=/accetta-invito?token=${token}`} className="block w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg">
              Accedi per continuare
            </a>
            <a href={`/auth/signup?redirectTo=/accetta-invito?token=${token}`} className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-4 rounded-2xl transition-all">
              Crea un nuovo account
            </a>
          </div>
        </div>
      </main>
    )
  }

  // STATO B: Utente Loggato. Recuperiamo il suo ruolo.
  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  if (profilo?.ruolo !== 'volontario') {
    return <ErrorUI message="Solo i volontari possono unirsi al team di un'azienda. Fai logout e accedi con un account volontario." />
  }

  // STATO C: Pronti per accettare
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl p-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤝</div>
          <h1 className="text-2xl font-black text-slate-900">Conferma Invito</h1>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 space-y-4 text-sm font-medium text-slate-600 text-center">
          <p>
            Stai per unirti al Team ESG di <strong className="text-violet-600 block text-lg mt-1">{nomeAzienda}</strong>
          </p>
          <div className="h-px w-12 bg-slate-200 mx-auto"></div>
          <p>
            Sei attualmente connesso come:<br/>
            <strong className="text-slate-900">{user.email}</strong>
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mt-4">
            L'azienda potrà vedere il tuo nome.
          </p>
        </div>

        {/* IL FORM CHE SCATENA LA ACTION */}
        <form action={accettaInvitoAziendale}>
          {/* ECCO IL SEGRETO: L'input nascosto per il token! */}
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-lg">
            ✓ Accetta e Unisciti
          </button>
        </form>
      </div>
    </main>
  )
}

// Piccolo componente utility per mostrare gli errori
function ErrorUI({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl p-10 text-center border border-red-100">
        <div className="text-5xl mb-6">⚠️</div>
        <h1 className="text-xl font-black text-slate-900 mb-4">Impossibile completare</h1>
        <p className="text-slate-600 font-medium mb-8">{message}</p>
        <a href="/" className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 px-8 rounded-2xl transition-all">
          Torna alla Home
        </a>
      </div>
    </main>
  )
}