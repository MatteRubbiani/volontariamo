import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge' // <-- TORNATO IL NOSTRO BADGE ORIGINALE

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

  // 1. CHIEDIAMO LE COMPETENZE DEL VOLONTARIO PER IL MATCHING
  const { data: userCompData } = await supabase
    .from('volontario_competenze')
    .select('competenza_id')
    .eq('volontario_id', user.id)
  
  const competenzeVolontario = userCompData?.map(c => c.competenza_id) || []

  // 2. QUERY POSIZIONE (ORA CON LE COMPETENZE)
  const { data: pos, error } = await supabase
    .from('posizioni')
    .select(`
      *,
      associazioni ( id, nome, email_contatto ),
      tags:posizione_tags(tag:tags(name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
    `)
    .eq('id', id)
    .single()

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

  // 3. QUERY CANDIDATURA
  const { data: candidatura } = await supabase
    .from('candidature')
    .select('*')
    .eq('posizione_id', id)
    .eq('volontario_id', user.id)
    .single()

  // 4. AZIONE CANDIDATURA
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

    await supabaseAction.from('candidature').insert({
      posizione_id: id,
      volontario_id: u.id,
      stato: 'in_attesa'
    })

    revalidatePath(`/dashboard/volontario/posizione/${id}`)
    revalidatePath('/dashboard/volontario/candidature')
  }

  const formattaOra = (ora: string | null) => ora ? ora.substring(0, 5) : '--:--'
  const nomeAssociazione = pos.associazioni?.nome || pos.associazioni?.email_contatto || 'Associazione Non Definita'
  const iniziale = nomeAssociazione.charAt(0).toUpperCase()
  
  // Estraiamo l'array pulito delle competenze richieste e le dividiamo per match
  const competenzeRichieste = pos.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
  const competenzeMatch = competenzeRichieste.filter((c: any) => competenzeVolontario.includes(c.id))
  const competenzeMancanti = competenzeRichieste.filter((c: any) => !competenzeVolontario.includes(c.id))

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pt-12">
        
        <Link href="/dashboard/volontario" className="text-slate-400 font-bold mb-8 inline-block hover:text-blue-600 transition-colors">
          ← Torna agli annunci
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100">
          
          {/* HEADER ANNUNCIO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
            <span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
              pos.tipo === 'ricorrente' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {pos.tipo.replace('_', ' ')}
            </span>
            
            <Link href={`/associazione/${pos.associazioni?.id}`} className="flex items-center gap-4 group bg-slate-50 py-2.5 px-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xl group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                {iniziale}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Organizzato da</p>
                <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                  {nomeAssociazione}
                </p>
              </div>
            </Link>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
            {pos.titolo}
          </h1>

          {/* HIGHLIGHTS (Dove, Quando, Ora) */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">📍</div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dove</p>
                <p className="font-bold text-slate-700 text-sm">{pos.dove}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">📅</div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quando</p>
                <p className="font-bold text-slate-700 text-sm">{pos.quando}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">⏳</div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Orario</p>
                <p className="font-bold text-slate-700 text-sm">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
              </div>
            </div>
          </div>

          {/* DESCRIZIONE */}
          <div className="prose prose-slate max-w-none mb-12">
            <p className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
              {pos.descrizione}
            </p>
          </div>

          {/* SEZIONE COMPETENZE E TAGS (IL CUORE E LE MANI) */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            
            {/* COMPETENZE (Superpoteri) - DIVISE PER MATCH */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Requisiti Pratici (Competenze)</p>
              {competenzeRichieste.length > 0 ? (
                <div className="space-y-4">
                  {/* Quelle che l'utente HA */}
                  {competenzeMatch.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Hai queste competenze:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {competenzeMatch.map((comp: any) => (
                          <CompetenzaBadge key={comp.id} nome={comp.name} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Quelle che all'utente MANCANO */}
                  {competenzeMancanti.length > 0 && (
                    <div className={competenzeMatch.length > 0 ? "pt-2" : ""}>
                      <p className="text-xs font-bold text-rose-500 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Ti mancano:
                      </p>
                      <div className="flex flex-wrap gap-2 opacity-60">
                        {competenzeMancanti.map((comp: any) => (
                          <CompetenzaBadge key={comp.id} nome={comp.name} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 italic">Nessuna competenza specifica richiesta.</p>
              )}
            </div>

            {/* TAGS (Interessi) */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Ambiti dell'attività</p>
              {pos.tags && pos.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {pos.tags.map((t: any) => (
                    <TagBadge key={t.tag.name} nome={t.tag.name} size="md" />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 italic">Nessun ambito specificato.</p>
              )}
            </div>

          </div>

          {/* BOTTONE CANDIDATURA */}
          <div className="pt-8 border-t border-slate-100 mt-auto">
            {!candidatura ? (
              <form action={inviaCandidatura}> 
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[2rem] text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                  CANDIDATI ORA 🚀
                </button>
              </form>
            ) : (
              <div className={`w-full text-center font-black py-6 rounded-[2rem] text-xl transition-all border-2 shadow-sm ${
                candidatura.stato === 'in_attesa' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                candidatura.stato === 'accettata' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                'bg-rose-50 text-rose-600 border-rose-200'
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