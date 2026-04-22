import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SharedChatWidget from '@/components/SharedChatWidget'

export default async function AssociazioneChat({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params

  // 1. Recupero dati con il fix per il tipo
  const { data: candidatura, error: candError } = await supabase
    .from('candidature')
    .select(`
      id, 
      stato, 
      volontario_id, 
      posizioni!inner (
        titolo,
        associazione_id
      )
    `)
    .eq('id', id)
    .eq('posizioni.associazione_id', user.id)
    .single()

  const candidaturaAccettata = candidatura?.stato === 'accettato' || candidatura?.stato === 'accettata'

  if (candError || !candidatura || !candidaturaAccettata) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-black text-slate-800 mb-4">Accesso Negato 🔒</h1>
        <Link href="/app/associazione/candidature" className="text-blue-600 font-bold hover:underline">
          ← Torna alle candidature
        </Link>
      </div>
    )
  }

  // FIX TYPESCRIPT: Estraiamo la posizione correttamente gestendo l'eventuale array
  const infoPosizione = Array.isArray(candidatura.posizioni) 
    ? candidatura.posizioni[0] 
    : candidatura.posizioni

  const currentCandidaturaId = id
  const associationId = user.id

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      
      {/* HEADER CHAT */}
      <div className="bg-white border-b p-4 flex-none z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/app/associazione/candidature" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            ←
          </Link>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Volontario ID: {candidatura.volontario_id.substring(0,6)}...
            </p>
            <h1 className="font-black text-slate-800 text-lg leading-tight truncate">
              {/* Usiamo la variabile infoPosizione che abbiamo estratto sopra */}
              {infoPosizione?.titolo || 'Chat Volontario'}
            </h1>
          </div>
        </div>
      </div>

      {/* CHAT REALTIME */}
      <div className="flex-1 w-full max-w-4xl mx-auto overflow-hidden relative">
        <SharedChatWidget candidaturaId={currentCandidaturaId} currentUserId={associationId} />
      </div>

    </div>
  )
}
