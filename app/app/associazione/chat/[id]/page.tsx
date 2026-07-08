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

  const { id: volontarioId } = await params

  // Preleviamo i dati del volontario per l'header
  const { data: volontario } = await supabase
    .from('volontari')
    .select('nome, cognome')
    .eq('id', volontarioId)
    .single()

  if (!volontario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/app/associazione" className="text-blue-600 font-bold hover:underline">
          Volontario non trovato. Torna indietro.
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white border-b p-4 flex-none z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/app/associazione/rete" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            ←
          </Link>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Chat Unificata
            </p>
            <h1 className="font-black text-slate-800 text-lg leading-tight truncate">
              {volontario.nome} {volontario.cognome}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto overflow-hidden relative">
        <SharedChatWidget 
          volontarioId={volontarioId} 
          associazioneId={user.id} 
          currentUserId={user.id} 
        />
      </div>
    </div>
  )
}