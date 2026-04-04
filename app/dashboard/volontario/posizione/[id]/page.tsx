import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

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

  const { data: userCompData } = await supabase
    .from('volontario_competenze')
    .select('competenza_id')
    .eq('volontario_id', user.id)
  
  const competenzeVolontario = userCompData?.map(c => c.competenza_id) || []

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

  if (error || !pos) redirect('/dashboard/volontario')

  const { data: candidatura } = await supabase
    .from('candidature')
    .select('*')
    .eq('posizione_id', id)
    .eq('volontario_id', user.id)
    .single()

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
  }

  const formattaOra = (ora: string | null) => ora ? ora.substring(0, 5) : '--:--'
  const nomeAssociazione = pos.associazioni?.nome || pos.associazioni?.email_contatto || 'Associazione'
  const iniziale = nomeAssociazione.charAt(0).toUpperCase()
  
  const competenzeRichieste = pos.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
  const competenzeMatch = competenzeRichieste.filter((c: any) => competenzeVolontario.includes(c.id))
  const competenzeMancanti = competenzeRichieste.filter((c: any) => !competenzeVolontario.includes(c.id))

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER DINAMICO MOBILE-FIRST */}
      <div className="max-w-4xl mx-auto p-4 md:p-10 pt-6 md:pt-12">
        
        <Link href="/dashboard/volontario" className="text-slate-400 text-sm font-bold mb-6 inline-flex items-center gap-2 hover:text-blue-600 transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Torna agli annunci
        </Link>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          
          {/* TOP BAR: TIPO E ASSOCIAZIONE */}
          <div className="p-6 md:p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white">
            
            <div className="flex items-center gap-2">
               {pos.tipo === 'una_tantum' ? (
                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Evento Singolo
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Ricorrente
                </span>
              )}
            </div>
            
            <Link href={`/associazione/${pos.associazioni?.id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm border border-slate-200">
                {iniziale}
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Organizzato da</p>
                <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-none">
                  {nomeAssociazione}
                </p>
              </div>
            </Link>
          </div>

          <div className="p-6 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-[1.1]">
              {pos.titolo}
            </h1>

            {/* INFO GRID: ADATTIVA PER MOBILE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-10">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">📍 Dove</p>
                <p className="font-bold text-slate-700 text-sm truncate">{pos.dove}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">📅 Quando</p>
                <p className="font-bold text-slate-700 text-sm">{pos.quando}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">⏳ Orario</p>
                <p className="font-bold text-slate-700 text-sm">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
              </div>
            </div>

            {/* DESCRIZIONE */}
            <div className="prose prose-slate max-w-none mb-10">
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                {pos.descrizione}
              </p>
            </div>

            {/* SKILLS & TAGS BOX */}
            <div className="space-y-8 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
              
              {/* COMPETENZE */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Competenze Richieste</p>
                {competenzeRichieste.length > 0 ? (
                  <div className="grid gap-4">
                    {competenzeMatch.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {competenzeMatch.map((comp: any) => (
                          <CompetenzaBadge key={comp.id} nome={comp.name} />
                        ))}
                      </div>
                    )}
                    {competenzeMancanti.length > 0 && (
                      <div className="flex flex-wrap gap-2 opacity-60">
                        {competenzeMancanti.map((comp: any) => (
                          <CompetenzaBadge key={comp.id} nome={comp.name} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic">Nessun requisito specifico.</p>
                )}
              </div>

              {/* TAGS */}
              <div className="space-y-3 pt-6 border-t border-slate-200/50">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Settori</p>
                <div className="flex flex-wrap gap-2">
                  {pos.tags?.map((t: any) => (
                    <TagBadge key={t.tag.name} nome={t.tag.name} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="mt-10">
              {!candidatura ? (
                <form action={inviaCandidatura}> 
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 md:py-6 rounded-2xl md:rounded-[2rem] text-lg md:text-xl shadow-xl shadow-blue-100 transition-all active:scale-[0.97]">
                    Candidati ora
                  </button>
                </form>
              ) : (
                <div className={`w-full text-center font-black py-5 md:py-6 rounded-2xl md:rounded-[2rem] text-sm md:text-base border-2 ${
                  candidatura.stato === 'in_attesa' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  candidatura.stato === 'accettata' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {candidatura.stato === 'in_attesa' && 'CANDIDATURA IN ATTESA ⏳'}
                  {candidatura.stato === 'accettata' && 'POSIZIONE ASSEGNATA ✅'}
                  {candidatura.stato === 'rifiutata' && 'NON SELEZIONATO'}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}