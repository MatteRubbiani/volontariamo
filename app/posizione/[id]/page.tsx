import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'
import PosizioneQuestionPanel from '@/components/PosizioneQuestionPanel'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  await parent
  const resolvedParams = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posizione } = await supabase
    .from('posizioni')
    .select('titolo, descrizione, associazione:associazioni(nome)')
    .eq('id', resolvedParams.id)
    .maybeSingle()

  if (!posizione) {
    return {
      title: 'Posizione non trovata | Volontariando',
      description: 'Questa posizione non è disponibile oppure non esiste.',
    }
  }

  const nomeAssociazione =
    (Array.isArray((posizione as any).associazione) ? (posizione as any).associazione[0]?.nome : (posizione as any).associazione?.nome) ||
    'Associazione'
  const title = `${posizione.titolo} | Volontariando`
  const description = (posizione.descrizione || '').replace(/\s+/g, ' ').trim().slice(0, 160)

  return { title, description }
}

export default async function DettaglioPosizioneVolontario({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const from = sp?.from

  const backUrl = from === 'mappa' ? '/esplora?from=mappa' : '/esplora'
  const loginHref = `/auth/login?redirectTo=${encodeURIComponent(`/posizione/${id}`)}`

  const publicSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const cookieStore = await cookies()
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await authSupabase.auth.getUser()

  const { data: userCompData } = user
    ? await authSupabase
        .from('volontario_competenze')
        .select('competenza_id')
        .eq('volontario_id', user.id)
    : { data: [] as { competenza_id: string }[] }
  const competenzeVolontario = userCompData?.map(c => c.competenza_id) || []

  const { data: pos, error } = await publicSupabase
    .from('posizioni')
    .select(`
      *,
      media_associazioni(url),
      associazioni ( id, nome, email_contatto ),
      tags:posizione_tags(tag:tags(name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
    `)
    .eq('id', id)
    .single()

  if (error || !pos) redirect(backUrl)

  const { data: candidatura } = user
    ? await authSupabase
        .from('candidature')
        .select('*')
        .eq('posizione_id', id)
        .eq('volontario_id', user.id)
        .single()
    : { data: null }

  async function inviaCandidatura() {
    'use server'
    const cookieStore = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )
    const { data: { user: u } } = await supabaseAction.auth.getUser()
    if (!u) redirect('/auth/login')

    await supabaseAction.from('candidature').insert({
      posizione_id: id,
      volontario_id: u.id,
      stato: 'in_attesa'
    })
    revalidatePath(`/posizione/${id}`)
  }

  // FUNZIONI DI FORMATTAZIONE PIÙ UMANE E CALDE
  const formattaOra = (ora: string | null) => ora ? ora.substring(0, 5) : '--:--'
  
  const formattaData = (dataString: string | null, tipo: string) => {
    if (!dataString) return 'Data da definire';
    if (tipo === 'una_tantum') {
      try {
        const dateObj = new Date(dataString);
        return dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return dataString;
      }
    }
    // Formato per le ricorrenti
    return `Ogni ${dataString}`;
  }

  const nomeAssociazione = pos.associazioni?.nome || pos.associazioni?.email_contatto || 'Associazione'
  const inizialeAssociazione = nomeAssociazione.charAt(0).toUpperCase()
  
  const competenzeRichieste = pos.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
  const competenzeMatch = competenzeRichieste.filter((c: any) => competenzeVolontario.includes(c.id))
  const competenzeMancanti = competenzeRichieste.filter((c: any) => !competenzeVolontario.includes(c.id))

  const imgUrl = pos.media_associazioni?.url || null;
  const inizialePosizione = pos.titolo ? pos.titolo.charAt(0).toUpperCase() : 'V';
  const statoCandidatura = candidatura?.stato === 'accettata'
    ? 'accettato'
    : candidatura?.stato === 'rifiutata'
      ? 'rifiutato'
      : candidatura?.stato

  // Applichiamo la formattazione calda
  const dataFormattata = formattaData(pos.quando, pos.tipo);

  // Componente per il bottone CTA, riutilizzabile su desktop (sidebar) e mobile (bottom bar)
  const CallToActionButton = ({ className = "" }: { className?: string }) => {
    if (!user) {
      return (
        <Link href={loginHref} className={`flex items-center justify-center bg-slate-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl text-base transition-colors ${className}`}>
          Accedi
        </Link>
      )
    }
    if (!candidatura) {
      return (
        <form action={inviaCandidatura} className={className}>
          <button type="submit" className="flex w-full items-center justify-center bg-slate-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl text-base transition-colors">
            Candidati
          </button>
        </form>
      )
    }
    return (
      <div className={`flex items-center justify-center font-semibold py-3.5 rounded-xl text-sm border ${
        statoCandidatura === 'in_attesa' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        statoCandidatura === 'in_contatto' ? 'bg-blue-50 text-blue-700 border-blue-200' :
        statoCandidatura === 'accettato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        'bg-slate-100 text-slate-500 border-slate-200'
      } ${className}`}>
        {statoCandidatura === 'in_attesa' && 'In Attesa'}
        {statoCandidatura === 'in_contatto' && 'In Contatto'}
        {statoCandidatura === 'accettato' && 'Assegnata'}
        {statoCandidatura === 'rifiutato' && 'Rifiutata'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200">
      
      <div className="w-full h-[35vh] md:h-[50vh] relative bg-slate-100">
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={pos.titolo} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <span className="text-slate-200 text-8xl font-black">{inizialePosizione}</span>
          </div>
        )}
        
        <div className="absolute top-6 left-4 md:left-10 z-10">
          <Link 
            href={backUrl} 
            className="inline-flex items-center justify-center w-10 h-10 bg-white text-slate-900 rounded-full shadow-md hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Aumentato il padding-bottom per garantire che il mobile scorra oltre la sticky bar */}
      <div className="max-w-[1120px] mx-auto px-6 md:px-10 pb-40 md:pb-24">
        
        <div className="flex flex-col md:flex-row pt-8 md:pt-12 md:gap-24">
          
          <div className="w-full md:flex-1">
            
            <div className="mb-8 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-2 mb-4">
                {pos.tipo === 'una_tantum' ? (
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Evento Singolo</span>
                ) : (
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Ricorrente</span>
                )}
              </div>
              
              <h1 className="text-[1.75rem] md:text-4xl font-semibold text-slate-900 leading-[1.15] tracking-tight mb-4">
                {pos.titolo}
              </h1>
              
              <div className="text-sm font-medium text-slate-900 flex flex-wrap items-center gap-2">
                <span className="underline">{pos.dove}</span>
                <span>·</span>
                <span className="text-slate-500">{pos.tipo === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/associazione/${pos.associazioni?.id}`} className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg hover:bg-slate-800 transition-colors">
                {inizialeAssociazione}
              </Link>
              <div>
                <p className="font-semibold text-slate-900 text-base">
                  Organizzato da {nomeAssociazione}
                </p>
                <p className="text-sm text-slate-500">Iscritto a Volontariando</p>
              </div>
            </div>

            <hr className="border-slate-200 my-8" />
            
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-900 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-900 text-base">{pos.dove}</p>
                  <p className="text-sm text-slate-500 mt-0.5">La posizione esatta verrà fornita dopo la candidatura.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-900 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-900 text-base capitalize">{dataFormattata}</p>
                  <p className="text-sm text-slate-500 mt-0.5">Orario previsto: {formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 my-8" />

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Informazioni sull'attività</h2>
              <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed font-normal">
                {pos.descrizione}
              </div>
            </div>

            <hr className="border-slate-200 my-8" />

            {pos.tags && pos.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Settori di intervento</h2>
                <div className="flex flex-wrap gap-3">
                  {pos.tags.map((t: any) => (
                    <TagBadge key={t.tag.name} nome={t.tag.name} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {competenzeRichieste.length > 0 && (
              <>
                <hr className="border-slate-200 my-8" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Competenze richieste</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {competenzeMatch.map((comp: any) => (
                      <CompetenzaBadge key={comp.id} nome={comp.name} />
                    ))}
                    {competenzeMancanti.map((comp: any) => (
                      <div key={comp.id} className="opacity-40">
                        <CompetenzaBadge nome={comp.name} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden md:block w-[340px] flex-shrink-0 relative">
            <div className="sticky top-28 bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
              <div className="mb-6">
                <span className="text-xl font-semibold text-slate-900 capitalize block leading-tight">{dataFormattata}</span>
                <p className="text-sm text-slate-500 mt-1">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CallToActionButton className="w-full col-span-1" />
                <PosizioneQuestionPanel
                  posizioneId={id}
                  associazioneNome={nomeAssociazione}
                  userId={user?.id ?? null}
                  loginHref={loginHref}
                  initialCandidaturaId={candidatura?.id ?? null}
                  buttonClassName="w-full col-span-1"
                />
              </div>
              <p className="text-center text-xs text-slate-500 mt-4">
                L'associazione valuterà il tuo profilo.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 📱 STICKY BOTTOM BAR (SOLO MOBILE) - Fix Layout e Flexbox */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-5 py-4 z-50 flex flex-col gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 truncate capitalize">{dataFormattata}</span>
          <span className="text-sm text-slate-500">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CallToActionButton className="w-full text-sm col-span-1" />
          <PosizioneQuestionPanel
            posizioneId={id}
            associazioneNome={nomeAssociazione}
            userId={user?.id ?? null}
            loginHref={loginHref}
            initialCandidaturaId={candidatura?.id ?? null}
            buttonClassName="w-full col-span-1"
          />
        </div>
      </div>

    </div>
  )
}
