import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'
import PannelloCandidatura from '@/components/PannelloCandidatura' // ✨ Guarda come si legge bene ora!

// ==========================================
// 🚀 CONFIGURAZIONE ENTERPRISE PER L'ISR
// ==========================================
export const revalidate = 3600 
export const dynamicParams = true 

// ==========================================
// 📦 GENERAZIONE PARAMETRI STATICI AL BUILD TIME
// ==========================================
export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('slug')
    .eq('stato', 'pubblicato')
    .not('slug', 'is', null)

  return posizioni?.map((pos) => ({
    slug: pos.slug,
  })) || []
}

// 🚨 GENERAZIONE METADATI SEO & SOCIAL OTTIMIZZATI PER LO SLUG
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
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
    .select('titolo, descrizione, associazioni(denominazione)')
    .eq('slug', resolvedParams.slug)
    .maybeSingle()

  if (!posizione) {
    return {
      title: 'Posizione non trovata | Volontariando',
      description: 'Questa posizione non è disponibile oppure non esiste.',
    }
  }

  const nomeAssociazione = (posizione as any).associazioni?.denominazione || 'Associazione'
  const title = `${posizione.titolo} | ${nomeAssociazione}`
  const description = (posizione.descrizione || '').replace(/\s+/g, ' ').trim().slice(0, 160)

  return { 
    title, 
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Volontariando',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

export default async function DettaglioPosizioneVolontario({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const publicSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✨ INTERCETTIAMO IL DATO TRAMITE SLUG STATICO
  const { data: posBase, error: posError } = await publicSupabase
    .from('posizioni')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (posError || !posBase) redirect('/esplora')

  const id = posBase.id 

  const [associazioneResult, immagineResult, tagsResult, competenzeResult] = await Promise.all([
    publicSupabase
      .from('associazioni')
      .select('id, denominazione, email_associazione, slug')
      .eq('id', posBase.associazione_id)
      .maybeSingle(),
    posBase.immagine_id
      ? publicSupabase
          .from('media_associazioni')
          .select('url')
          .eq('id', posBase.immagine_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    publicSupabase
      .from('posizione_tags')
      .select('tag_id')
      .eq('posizione_id', id),
    publicSupabase
      .from('posizione_competenze')
      .select('competenza_id')
      .eq('posizione_id', id),
  ])

  const tagIds = (tagsResult.data || []).map((row: any) => row.tag_id)
  const competenzaIds = (competenzeResult.data || []).map((row: any) => row.competenza_id)

  const [tagCatalogResult, competenzeCatalogResult] = await Promise.all([
    tagIds.length
      ? publicSupabase
          .from('tags')
          .select('id, name')
          .in('id', tagIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    competenzaIds.length
      ? publicSupabase
          .from('competenze')
          .select('id, name')
          .in('id', competenzaIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const tagById = new Map((tagCatalogResult.data || []).map((tag: any) => [tag.id, tag.name]))
  const competenzaById = new Map((competenzeCatalogResult.data || []).map((comp: any) => [comp.id, comp.name]))

  const pos = {
    ...posBase,
    associazioni: associazioneResult.data,
    media_associazioni: immagineResult.data,
    tags: (tagsResult.data || []).map((row: any) => ({
      tag: { name: tagById.get(row.tag_id) || '' },
    })),
    competenze: (competenzeResult.data || []).map((row: any) => ({
      competenza: { id: row.competenza_id, name: competenzaById.get(row.competenza_id) || '' },
    })),
  }

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
    return `Ogni ${dataString}`;
  }

  const nomeAssociazione = pos.associazioni?.denominazione || pos.associazioni?.email_associazione || 'Associazione'
  const associazioneSlug = pos.associazioni?.slug || pos.associazioni?.id
  const inizialeAssociazione = nomeAssociazione.charAt(0).toUpperCase()
  const competenzeRichieste = pos.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
  const imgUrl = pos.media_associazioni?.url || null;
  const inizialePosizione = pos.titolo ? pos.titolo.charAt(0).toUpperCase() : 'V';
  const dataFormattata = formattaData(pos.quando, pos.tipo);

  // Generazione dei dati strutturati per i motori di ricerca (JSON-LD)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://volontariando.work';
  let jsonLd = {}

  if (pos.tipo === 'una_tantum') {
    const startDate = pos.data_esatta ? `${pos.data_esatta}T${pos.ora_inizio || '08:00'}:00` : new Date().toISOString()
    const endDate = pos.data_esatta && pos.ora_fine ? `${pos.data_esatta}T${pos.ora_fine}:00` : undefined

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: pos.titolo,
      description: pos.descrizione,
      startDate: startDate,
      endDate: endDate,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: imgUrl ? [imgUrl] : [],
      location: {
        '@type': 'Place',
        name: pos.dove,
        address: {
          '@type': 'PostalAddress',
          addressLocality: pos.dove,
          addressCountry: 'IT',
        },
      },
      offers: {
        '@type': 'Offer',
        url: `${baseUrl}/posizione/${slug}`,
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString()
      },
      organizer: {
        '@type': 'NGO',
        name: nomeAssociazione,
        url: `${baseUrl}/associazione/${associazioneSlug}`
      },
    }
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: pos.titolo,
      description: pos.descrizione,
      datePosted: new Date().toISOString(),
      employmentType: 'VOLUNTEER',
      image: imgUrl ? imgUrl : undefined,
      hiringOrganization: {
        '@type': 'NGO',
        name: nomeAssociazione,
        sameAs: `${baseUrl}/associazione/${associazioneSlug}`
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: pos.dove,
          addressCountry: 'IT',
        },
      },
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="w-full h-[35vh] md:h-[50vh] relative bg-slate-100">
        {imgUrl ? (
          <img src={imgUrl} alt={pos.titolo} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <span className="text-slate-200 text-8xl font-black">{inizialePosizione}</span>
          </div>
        )}
        
        <div className="absolute top-6 left-4 md:left-10 z-10">
          <Link href="/esplora" className="inline-flex items-center justify-center w-10 h-10 bg-white text-slate-900 rounded-full shadow-md hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-6 md:px-10 pb-40 md:pb-24">
        <div className="flex flex-col md:flex-row pt-8 md:pt-12 md:gap-24">
          <div className="w-full md:flex-1">
            <div className="mb-8 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-black uppercase tracking-widest ${pos.tipo === 'una_tantum' ? 'text-slate-500' : 'text-slate-900'}`}>
                  {pos.tipo === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}
                </span>
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
              <Link href={`/associazione/${associazioneSlug}`} className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg hover:bg-slate-800 transition-colors">
                {inizialeAssociazione}
              </Link>
              <div>
                <p className="font-semibold text-slate-900 text-base">Organizzato da {nomeAssociazione}</p>
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
                    {competenzeRichieste.map((comp: any) => (
                      <CompetenzaBadge key={comp.id} nome={comp.name} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* COLONNA DESKTOP INTERATTIVA (PannelloCandidatura) */}
          <div className="hidden md:block w-[340px] flex-shrink-0 relative">
            <div className="sticky top-28 bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
              <div className="mb-6">
                <span className="text-xl font-semibold text-slate-900 capitalize block leading-tight">{dataFormattata}</span>
                <p className="text-sm text-slate-500 mt-1">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</p>
              </div>
              <PannelloCandidatura 
                posizioneId={id} 
                slug={slug} 
                associazioneId={pos.associazione_id} 
                associazioneNome={nomeAssociazione} 
                competenzeRichieste={competenzeRichieste}
              />
              <p className="text-center text-xs text-slate-500 mt-4">L'associazione valuterà il tuo profilo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER MOBILE INTERATTIVO */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-5 py-4 z-50 flex flex-col gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 truncate capitalize">{dataFormattata}</span>
          <span className="text-sm text-slate-500">{formattaOra(pos.ora_inizio)} - {formattaOra(pos.ora_fine)}</span>
        </div>
        <PannelloCandidatura 
          posizioneId={id} 
          slug={slug} 
          associazioneId={pos.associazione_id} 
          associazioneNome={nomeAssociazione} 
          competenzeRichieste={competenzeRichieste}
        />
      </div>
    </div>
  )
}