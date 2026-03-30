import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
// 1. IMPORTIAMO IL NOSTRO COMPONENTE MAGICO
import TagBadge from '@/components/TagBadge'

export default async function DettaglioPosizioneVolontario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. QUERY POSIZIONE
  const { data: pos, error } = await supabase
    .from('posizioni')
    .select(`
      *,
      associazioni ( id, nome, email_contatto ),
      tags:posizione_tags(tag:tags(name))
    `)
    .eq('id', id)
    .single()

  // GESTIONE ERRORI CORRETTA E SEPARATA DAL CONTROLLO ESISTENZA
  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 min-h-screen max-w-4xl mx-auto mt-10 rounded-3xl">
        <h1 className="text-3xl font-black mb-4">🚨 Errore Query Supabase!</h1>
        <p className="font-mono bg-white p-4 border border-red-200 rounded-xl">{error.message}</p>
        <Link href="/dashboard/volontario" className="mt-8 inline-block font-bold underline hover:text-red-800">← Torna indietro</Link>
      </div>
    )
  }

  if (!pos) {
    return (
      <div className="p-10 bg-amber-50 text-amber-700 min-h-screen max-w-4xl mx-auto mt-10 rounded-3xl">
        <h1 className="text-3xl font-black mb-4">⚠️ Posizione non trovata</h1>
        <p>Non riesco a trovare la posizione con ID: {id}</p>
        <Link href="/dashboard/volontario" className="mt-8 inline-block font-bold underline hover:text-amber-900">← Torna indietro</Link>
      </div>
    )
  }

  // 2. QUERY CANDIDATURA (Controlliamo se l'utente si è già candidato)
  const { data: candidatura } = await supabase
    .from('candidature')
    .select('*')
    .eq('posizione_id', id)
    .eq('volontario_id', user.id)
    .single()

  // 3. AZIONE PER INVIARE LA CANDIDATURA
  async function inviaCandidatura() {
    'use server'
    const cookieStore = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )
    const { data: { user: u } } = await supabaseAction.auth.getUser()
    if (!u) return

    // Inseriamo la nuova candidatura nel database
    await supabaseAction.from('candidature').insert({
      posizione_id: id,
      volontario_id: u.id,
      stato: 'in_attesa' // Stato iniziale di default
    })

    // Aggiorniamo la pagina per mostrare subito il nuovo stato!
    revalidatePath(`/dashboard/volontario/posizione/${id}`)
    revalidatePath('/dashboard/volontario/candidature') // Aggiorniamo anche la lista candidature
  }

  const formattaOra = (ora: string | null) => ora ? ora.substring(0, 5) : '--:--'
  const nomeAssociazione = pos.associazioni?.nome || pos.associazioni?.email_contatto || 'Associazione Non Definita'
  const iniziale = nomeAssociazione.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        
        <Link href="/dashboard/volontario" className="text-slate-400 font-bold mb-8 inline-block hover:text-blue-600 transition-colors">
          ← Torna agli annunci
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
            <span className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${
              pos.tipo === 'ricorrente' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {pos.tipo.replace('_', ' ')}
            </span>
            
            <Link href={`/associazione/${pos.associazioni?.id}`} className="flex items-center gap-4 group bg-slate-50 py-2 px-4 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                {iniziale}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Organizzato da</p>
                <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                  {nomeAssociazione}
                </p>
              </div>
            </Link>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tighter leading-tight">
            {pos.titolo}
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
            {pos.descrizione}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">📍 Dove</p>
              <p className="font-bold text-slate-700">{pos.dove}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">📅 Quando</p>
              <p className="font-bold text-slate-700">{pos.quando}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">⏳ Orario</p>
              <p className="font-bold text-slate-700">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
            </div>
          </div>

          {/* 2. INSERIMENTO DEL TAG BADGE (con size="lg" per dargli più risalto visivo) */}
          {pos.tags && pos.tags.length > 0 && (
            <div className="mb-12">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Categorie</p>
              <div className="flex flex-wrap gap-3">
                {pos.tags.map((t: any) => (
                  <TagBadge key={t.tag.name} nome={t.tag.name} size="lg" />
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-100 mt-auto">
            {!candidatura ? (
              <form action={inviaCandidatura}> 
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-7 rounded-[2.5rem] text-xl shadow-2xl shadow-emerald-200 transition-all active:scale-[0.98]">
                  CANDIDATI ORA 🚀
                </button>
              </form>
            ) : (
              <div className={`w-full text-center font-black py-7 rounded-[2.5rem] text-xl transition-all border-2 ${
                candidatura.stato === 'in_attesa' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                candidatura.stato === 'accettata' ? 'bg-green-50 text-green-600 border-green-100' :
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                {candidatura.stato === 'in_attesa' && 'IN ATTESA DI RISPOSTA ⏳'}
                {candidatura.stato === 'accettata' && 'CANDIDATURA ACCETTATA ✅'}
                {candidatura.stato === 'rifiutata' && 'CANDIDATURA RIFIUTATA ❌'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}