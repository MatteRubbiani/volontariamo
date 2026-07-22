import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'
import PannelloCandidatura from '@/components/PannelloCandidatura'
import TastoIndietro from '@/components/TastoIndietro'
import { Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react'

export const revalidate = 3600 
export const dynamicParams = true 

// 🛡️ ESTRAZIONE ID CENTRALIZZATA
function extractShortId(slugWithQueries: string): string {
  const cleanSlug = decodeURIComponent(slugWithQueries).split('?')[0].trim();
  const parts = cleanSlug.split('-');
  const id = parts[parts.length - 1] || cleanSlug;
  return id;
}

// 🛡️ URL IMMAGINI ASSOLUTI
function getAbsoluteImageUrl(url: string | null | undefined): string {
  const fallbackImage = 'https://volontariando.work/opengraph-image.png';
  if (!url) return fallbackImage;
  
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  return `https://kbgguubqwpthsbvnfdnq.supabase.co/storage/v1/object/public/${cleanUrl.replace(/^\//, '')}`;
}

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('slug')
    .not('slug', 'is', null)

  return posizioni?.map((pos) => ({ slug: pos.slug })) || []
}

// 🎯 GENERAZIONE METADATI DINAMICI
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  await parent
  const resolvedParams = await params
  const shortId = extractShortId(resolvedParams.slug || '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .select('titolo, descrizione, associazione_id, immagine_id')
    .ilike('slug', `%${shortId}%`)
    .maybeSingle()

  if (posError || !posizione) {
    return { title: 'Opportunità di Volontariato' }
  }

  const [assocRes, mediaRes] = await Promise.all([
    posizione.associazione_id 
      ? supabase.from('associazioni').select('denominazione').eq('id', posizione.associazione_id).maybeSingle()
      : Promise.resolve({ data: null }),
    posizione.immagine_id
      ? supabase.from('media_associazioni').select('url').eq('id', posizione.immagine_id).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  const nomeAssociazione = assocRes.data?.denominazione || 'Associazione'
  const titoloPulito = posizione.titolo || 'Bando di Volontariato'
  const title = `${titoloPulito} con ${nomeAssociazione}`
  
  const description = (posizione.descrizione || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155) + '...'

  const imageUrl = getAbsoluteImageUrl(mediaRes.data?.url)
  const cleanSlugWithoutQueries = (resolvedParams.slug || '').split('?')[0].trim()

  return {
    title: {
      absolute: `${title} | Volontariando`, 
    },
    description,
    openGraph: {
      title: `${title} | Volontariando`,
      description,
      type: 'article',
      url: `https://volontariando.work/posizione/${cleanSlugWithoutQueries}`,
      siteName: 'Volontariando',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Volontariando`,
      description,
      images: [imageUrl]
    }
  }
}

export default async function DettaglioPosizioneVolontario({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const shortId = extractShortId(slug);
  const cleanSlugWithoutQueries = decodeURIComponent(slug).split('?')[0].trim();

  const publicSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posBase } = await publicSupabase
    .from('posizioni')
    .select('*')
    .ilike('slug', `%${shortId}%`)
    .maybeSingle()

  if (!posBase) {
    redirect('/esplora')
  }

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

  const formattaOra = (ora: string | null) => {
    if (!ora) return null
    return ora.substring(0, 5)
  }
  
  const formattaDataLeggibile = (dataString: string | null, tipo: string) => {
    if (!dataString) return 'Data da definire';
    if (tipo === 'una_tantum') {
      try {
        const dateObj = new Date(dataString);
        return dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
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
  
  const imgUrl = pos.media_associazioni?.url ? getAbsoluteImageUrl(pos.media_associazioni.url) : null;
  const inizialePosizione = pos.titolo ? pos.titolo.charAt(0).toUpperCase() : 'V';
  
  const dataFormattata = formattaDataLeggibile(pos.quando || pos.data_esatta, pos.tipo);
  const oraInizio = formattaOra(pos.ora_inizio);
  const oraFine = formattaOra(pos.ora_fine);
  const orarioFormattato = (oraInizio && oraFine) 
    ? `${oraInizio} - ${oraFine}` 
    : oraInizio 
      ? `Dalle ${oraInizio}` 
      : 'Orario flessibile';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200">
      
      {/* IMMAGINE COPERTINA */}
      <div className="w-full h-[32vh] md:h-[48vh] relative bg-slate-100">
        {imgUrl ? (
          <img src={imgUrl} alt={pos.titolo} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <span className="text-slate-200 text-8xl font-black">{inizialePosizione}</span>
          </div>
        )}
        
        {/* TASTO INDIETRO CON MEMORIA */}
        <div className="absolute top-4 left-4 md:left-10 z-20">
          <TastoIndietro />
        </div>
      </div>

      {/* CORPO CONTENUTO */}
      <div className="max-w-[1120px] mx-auto px-5 md:px-10 pb-36 md:pb-24">
        <div className="flex flex-col md:flex-row pt-6 md:pt-12 md:gap-20">
          
          <div className="w-full md:flex-1">
            <div className="mb-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {pos.tipo === 'una_tantum' ? 'Evento Singolo' : 'Ricorrente'}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-3">
                {pos.titolo}
              </h1>
              <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900">{pos.dove}</span>
              </div>
            </div>

            <Link 
              href={`/associazione/${associazioneSlug}`}
              className="flex items-center gap-3.5 p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs">
                {inizialeAssociazione}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 text-sm truncate">Organizzato da {nomeAssociazione}</p>
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 font-medium">Associazione verificata</p>
              </div>
            </Link>

            <hr className="border-slate-100 my-6" />

            {/* DETTAGLI ORARI E LUOGO */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-800 shrink-0">
                  <MapPin className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{pos.dove}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Indirizzo esatto inviato dopo la candidatura.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-800 shrink-0">
                  <Calendar className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm capitalize">{dataFormattata}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Orario: {orarioFormattato}</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Informazioni sull'attività</h2>
              <div className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-wrap">
                {pos.descrizione}
              </div>
            </div>

            {pos.tags && pos.tags.length > 0 && (
              <>
                <hr className="border-slate-100 my-6" />
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Settori</h2>
                  <div className="flex flex-wrap gap-2">
                    {pos.tags.map((t: any) => (
                      <TagBadge key={t.tag.name} nome={t.tag.name} size="sm" />
                    ))}
                  </div>
                </div>
              </>
            )}

            {competenzeRichieste.length > 0 && (
              <>
                <hr className="border-slate-100 my-6" />
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Competenze richieste</h2>
                  <div className="flex flex-wrap gap-2">
                    {competenzeRichieste.map((comp: any) => (
                      <CompetenzaBadge key={comp.id} nome={comp.name} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SIDEBAR DESKTOP */}
          <div className="hidden md:block w-[340px] flex-shrink-0 relative">
            <div className="sticky top-28 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
              <div>
                <span className="text-2xl font-extrabold text-slate-900 capitalize block leading-tight">{dataFormattata}</span>
                <p className="text-xs font-semibold text-slate-500 mt-1">{orarioFormattato}</p>
              </div>

              <PannelloCandidatura 
                posizioneId={id} 
                slug={cleanSlugWithoutQueries} 
                associazioneId={pos.associazione_id} 
                associazioneNome={nomeAssociazione} 
                competenzeRichieste={competenzeRichieste}
              />
              
              <p className="text-center text-[11px] font-semibold text-slate-400">
                Processo di selezione gestito dall'associazione
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 🔴 BARRA MOBILE PREMIUM STILE AIRBNB / UBER */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99999] bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        
        {/* COLONNA SINISTRA: DATA ED ORARIO */}
        <div className="flex flex-col min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5 text-slate-900">
            <span className="font-extrabold text-sm truncate capitalize leading-snug tracking-tight">
              {dataFormattata}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold truncate leading-none">
              {orarioFormattato}
            </span>
          </div>
        </div>

        {/* COLONNA DESTRA: PULSANTE CANDIDATURA COMPATTO & BILANCIATO */}
        <div className="shrink-0 flex items-center justify-end max-w-[50%]">
          <PannelloCandidatura 
            posizioneId={id} 
            slug={cleanSlugWithoutQueries} 
            associazioneId={pos.associazione_id} 
            associazioneNome={nomeAssociazione} 
            competenzeRichieste={competenzeRichieste}
          />
        </div>

      </div>
    </div>
  )
}