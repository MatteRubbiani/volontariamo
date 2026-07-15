import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Metadata, ResolvingMetadata } from 'next'
// Rimossa l'importazione di 'cookies' che rischia di rompere la cache
import Link from 'next/link'
import { FileText, Link2, Quote, Settings2, Sparkles, Users, Heart, Briefcase, Video, Mail, Target, Eye } from 'lucide-react'
import PosizioneCard from '@/components/PosizioneCard'

// ==========================================
// 1. CONFIGURAZIONE ISR (Incremental Static Regeneration)
// ==========================================
export const revalidate = 3600 // La cache scade dopo un'ora (o istantaneamente via API)
export const dynamicParams = true // Permette di generare e mettere in cache nuovi slug non presenti al build time

// ==========================================
// 2. GENERAZIONE STATICA AL BUILD TIME (La vera magia SEO)
// ==========================================
export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Chiediamo a Supabase SOLO gli slug di tutte le associazioni
  const { data: associazioni } = await supabase
    .from('associazioni')
    .select('slug')
    .not('slug', 'is', null) // Ignoriamo chi non ha ancora lo slug

  // Diciamo a Next.js quali HTML statici costruire al momento del "npm run build"
  return associazioni?.map((associazione) => ({
    slug: associazione.slug,
  })) || []
}

// ==========================================
// 🎯 GENERAZIONE METADATI SEO & SOCIAL DINAMICI
// ==========================================
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

  const { data: associazione } = await supabase
    .from('associazioni')
    .select('denominazione, forma_giuridica, logo_url, grafica:associazioni_grafica(tagline, cover_url)')
    .eq('slug', resolvedParams.slug)
    .maybeSingle()

  if (!associazione) {
    return {
      title: 'Profilo Associazione', // ✨ Rimosso "| Volontariando"
    }
  }

  const denominazione = associazione.denominazione || 'Associazione'
  const formaGiuridica = associazione.forma_giuridica ? ` (${associazione.forma_giuridica})` : ''
  
  // ✨ Solo il nome dell'associazione. Il layout farà il resto!
  const title = `${denominazione}${formaGiuridica}`
  
  const tagline = (associazione.grafica as any)?.tagline || `Scopri i progetti di utilità sociale e i bandi di volontariato aperti di ${denominazione}.`
  const description = tagline.replace(/\s+/g, ' ').trim().slice(0, 155) + '...'

  const logoUrl = associazione.logo_url || 'https://volontariando.work/opengraph-image.png'
  const coverUrl = (associazione.grafica as any)?.cover_url || logoUrl

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Volontariando`, // Per i social lo teniamo completo
      description,
      type: 'profile',
      url: `https://volontariando.work/associazione/${resolvedParams.slug}`,
      siteName: 'Volontariando',
      images: [{ url: coverUrl, width: 1200, height: 630, alt: `Copertina di ${denominazione}` }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Volontariando`,
      description,
      images: [coverUrl]
    }
  }
}
// ==========================================
// BLOCCHI READ-ONLY PUBBLICI
// ==========================================
const Blocks = {
  hero: ({ content }: any) => {
    const coverY = content.coverY ?? 50
    const coverZoom = content.coverZoom ?? 1
    const logoX = content.logoX ?? 50
    const logoY = content.logoY ?? 50
    const logoZoom = content.logoZoom ?? 1

    return (
      <div className="relative w-full pt-4 pb-4">
        <div className="w-full h-32 md:h-48 rounded-[2rem] bg-slate-100 overflow-hidden relative shadow-sm border border-slate-100/50 z-0">
          {content.coverUrl && (
            <img 
              src={content.coverUrl} 
              className="w-full h-full object-cover" 
              style={{ objectPosition: `50% ${coverY}%`, transform: `scale(${coverZoom})` }} 
              alt="Copertina" 
            />
          )}
        </div>
        
        <div className="px-4 md:px-8 relative -mt-10 md:-mt-12 flex flex-col items-start z-20">
          {content.logoUrl ? (
            <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-white rounded-3xl shadow-lg border-[4px] border-white overflow-hidden relative">
              <img 
                src={content.logoUrl} 
                className="w-full h-full object-cover" 
                style={{ objectPosition: `${logoX}% ${logoY}%`, transform: `scale(${logoZoom})` }} 
                alt="Logo" 
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-white rounded-3xl shadow-lg border-[4px] border-white flex items-center justify-center text-4xl font-bold text-slate-200">
              {content.title?.charAt(0) || 'A'}
            </div>
          )}
          <div className="mt-4 w-full space-y-1">
            {content.eyebrow && <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-400 block">{content.eyebrow}</span>}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{content.title}</h1>
            {content.subtitle && <p className="text-base md:text-lg text-slate-600 font-light max-w-2xl leading-relaxed whitespace-pre-wrap">{content.subtitle}</p>}
          </div>
        </div>
      </div>
    )
  },

  about: ({ content }: any) => (
    <section className="px-2">
      <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">{content.title || 'Chi Siamo'}</h3>
      <p className="text-lg text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{content.body}</p>
    </section>
  ),

  stats: ({ content }: any) => {
    const items = content.items || []
    if (items.length === 0) return null
    return (
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 py-4 border-y border-slate-50 w-full text-center">
        {items.map((stat: any, i: number) => stat.value && stat.label && (
          <div key={i} className="min-w-[120px] flex flex-col items-center">
            <div className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 mb-1 leading-none">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 px-4">{stat.label}</div>
          </div>
        ))}
      </div>
    )
  },

  gallery: ({ content }: any) => {
    const rawImages = content.items || []
    const images = rawImages.filter(Boolean)
    if (images.length === 0) return null

    const getGridLayout = () => {
      const count = images.length
      if (count === 1) return 'grid-cols-1'
      if (count === 2) return 'grid-cols-2 gap-4'
      if (count === 3) return 'grid-cols-3 gap-4'
      if (count === 4) return 'grid-cols-2 gap-4'
      return 'grid-cols-3 gap-3 md:gap-4 auto-rows-[120px] md:auto-rows-[160px]'
    }

    const getImageStyle = (index: number) => {
      const count = images.length
      if (count === 1) return 'w-full h-64 md:h-80 rounded-[2rem]'
      if (count === 2 || count === 3) return 'w-full aspect-[4/3] rounded-2xl md:rounded-[1.75rem]'
      if (count === 4) return 'w-full aspect-video rounded-2xl'
      if (index === 0) return 'col-span-2 row-span-2 rounded-[2rem]'
      return 'col-span-1 row-span-1 rounded-2xl md:rounded-3xl'
    }

    return (
      <section className={`grid ${getGridLayout()} px-2`}>
        {images.map((img: string, i: number) => (
          <img key={i} src={img} className={`${getImageStyle(i)} w-full h-full object-cover shadow-sm`} alt="Galleria" />
        ))}
      </section>
    )
  },

  mission: ({ content }: any) => (
    <section className="px-2">
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-3">{content.title || 'La nostra Mission'}</h3>
      <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap">{content.body}</p>
    </section>
  ),

  vision: ({ content }: any) => (
    <section className="px-2">
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-3">{content.title || 'La nostra Vision'}</h3>
      <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap">{content.body}</p>
    </section>
  ),

  donations: ({ content }: any) => {
    if (!content.iban && !content.cf) return null
    return (
      <section className="bg-gradient-to-br from-rose-50/50 to-white p-6 md:p-8 rounded-[2.5rem] border border-rose-100/60 mx-2">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">{content.title || 'Sostieni la nostra causa'}</h3>
        {content.description && <p className="text-slate-600 font-light mb-6 max-w-2xl text-base whitespace-pre-wrap">{content.description}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.iban && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Donazione Bancaria</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{content.ibanLabel || 'IBAN Associazione'}</p>
                <p className="text-xs font-mono text-slate-500 tracking-tight mt-1 select-all break-all">{content.iban}</p>
              </div>
            </div>
          )}
          {content.cf && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Dona il 5x1000</span>
                <p className="font-bold text-slate-900 text-sm mt-1">Codice Fiscale Associazione</p>
                <p className="text-lg font-mono font-black text-slate-800 mt-1 select-all">{content.cf}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  },

  projects: ({ content }: any) => {
    const items = content.items?.filter((p: any) => p.title || p.img) || []
    if (items.length === 0) return null
    return (
      <section className="px-2">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-6">{content.title || 'I nostri progetti d’impatto'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((proj: any, i: number) => (
            <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
              {proj.img && <img src={proj.img} className="w-full h-44 shrink-0 object-cover" alt={proj.title} />}
              <div className="p-5 flex-1 flex flex-col gap-1">
                <h4 className="font-bold text-slate-900 text-lg leading-snug">{proj.title || 'Progetto'}</h4>
                <p className="text-sm text-slate-500 font-light leading-relaxed whitespace-pre-wrap">{proj.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  },

  testimonials: ({ content }: any) => {
    const items = content.items?.filter((t: any) => t.quote) || []
    if (items.length === 0) return null
    return (
      <section className="px-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{content.title || 'La voce di chi vive l’associazione'}</h3>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map((test: any, i: number) => (
            <div key={i} className="snap-start shrink-0 w-[90%] md:w-[65%] bg-slate-50 p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between border border-slate-100/50 min-h-[200px]">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-slate-300 transform" style={{ transform: 'scaleY(-1)' }} />
                <p className="text-base md:text-lg font-light text-slate-800 leading-relaxed italic whitespace-pre-wrap">{test.quote}</p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                {test.avatarUrl && <img src={test.avatarUrl} className="w-11 h-11 rounded-full border border-white shadow-md object-cover shrink-0" alt={test.author} />}
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-none">{test.author || 'Volontario'}</p>
                  {test.role && <p className="text-xs text-slate-400 font-medium mt-1">{test.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  },

  video: ({ content }: any) => {
    if (!content.url) return null
    const getEmbedUrl = (url: string) => {
      if (url.includes('youtube.com/embed/')) return url
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
      const match = url.match(regExp)
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url
    }
    const embedUrl = getEmbedUrl(content.url)
    return (
      <section className="space-y-4 px-2">
        {content.title && <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{content.title}</h3>}
        <div className="w-full aspect-video rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-md">
          <iframe src={embedUrl} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </section>
    )
  },

  faq: ({ content }: any) => {
    const items = content.items?.filter((f: any) => f.q) || []
    if (items.length === 0) return null
    return (
      <section className="space-y-6 max-w-3xl px-2">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">Domande frequenti</h3>
        {items.map((item: any, i: number) => (
          <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <h4 className="text-lg font-bold text-slate-900 mb-1">{item.q}</h4>
            <p className="text-base text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{item.a}</p>
          </div>
        ))}
      </section>
    )
  },

  documents: ({ content }: any) => {
    const items = content.items?.filter((doc: any) => doc.url) || []
    if (items.length === 0) return null
    return (
      <section className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 mx-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Documenti Utili</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((doc: any, i: number) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 shrink-0 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block whitespace-pre-wrap break-words text-sm leading-snug">{doc.nome || 'Documento'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">PDF Scaricabile</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    )
  },

  links: ({ content }: any) => {
    if (!content.website && !content.instagram && !content.facebook) return null
    return (
      <div className="bg-white py-2 px-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Link Utili</h3>
        <div className="flex flex-wrap gap-2">
          {content.website && (
            <a href={content.website.startsWith('http') ? content.website : `https://${content.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-800">
              <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Sito Web
            </a>
          )}
          {content.instagram && (
            <a href={`https://instagram.com/${content.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-800">
              <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Instagram
            </a>
          )}
          {content.facebook && (
            <a href={content.facebook.startsWith('http') ? content.facebook : `https://${content.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-800">
              <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Facebook
            </a>
          )}
        </div>
      </div>
    )
  },

  contacts: ({ content }: any) => (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 mx-2">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Mettiti in contatto</span>
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">{content.title || 'Vieni a trovarci o scrivici'}</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-600 font-light leading-relaxed">
          {content.address && <div className="flex gap-2"><strong>Sede:</strong><span className="font-normal text-slate-800">{content.address}</span></div>}
          {content.email && <div className="flex gap-2"><strong>Email:</strong><span className="font-normal text-slate-800">{content.email}</span></div>}
          {content.phone && <div className="flex gap-2"><strong>Tel:</strong><span className="font-normal text-slate-800">{content.phone}</span></div>}
        </div>
      </div>
      
      <form className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invia un messaggio rapido</p>
        <input type="email" placeholder="La tua email..." className="w-full bg-slate-50 rounded-xl border border-slate-100 outline-none text-xs px-3 py-2 text-slate-800" required />
        <textarea placeholder="Come possiamo aiutarti?" className="w-full bg-slate-50 rounded-xl border border-slate-100 outline-none text-xs px-3 py-2 text-slate-800 resize-none h-16" required />
        <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold text-center transition-colors">Invia Messaggio</button>
      </form>
    </section>
  ),

  partners: ({ content }: any) => {
    const items = content.items?.filter(Boolean) || []
    if (items.length === 0) return null
    return (
      <section className="space-y-4 text-center py-2 px-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partner e Sponsor</p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-75 grayscale items-center pt-1">
          {items.map((partner: string, i: number) => (
             <span key={i} className="font-bold text-base text-slate-700 bg-slate-50/60 px-4 py-2 rounded-2xl border border-slate-100/50">{partner}</span>
          ))}
        </div>
      </section>
    )
  },

  positions: ({ positions, brandColor }: any) => (
    <div className="pt-4 px-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Posizioni aperte</h3>
        <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full font-bold text-base">{positions?.length || 0}</span>
      </div>
      {positions?.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {positions.map((p: any) => (
            <div key={p.id} className="snap-start shrink-0 w-[85%] md:w-[45%]">
              <PosizioneCard posizione={p} ruolo="volontario" coloreBrand={brandColor} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ),
}

// ==========================================
// LOGICA DI FALLBACK
// ==========================================
function createFallbackLayout(associazione: any, grafica: any) {
  const blocks = []
  
  blocks.push({ id: 'f-hero', type: 'hero', content: { title: associazione.denominazione, eyebrow: associazione.forma_giuridica, subtitle: grafica.tagline, coverUrl: grafica.cover_url, logoUrl: associazione.logo_url, brandColor: grafica.colore_brand || '#111827' } })
  
  if (grafica.statistiche?.length > 0) {
    blocks.push({ id: 'f-stats', type: 'stats', content: { items: grafica.statistiche } })
  }
  if (grafica.chi_siamo) {
    blocks.push({ id: 'f-about', type: 'about', content: { title: 'Chi Siamo', body: grafica.chi_siamo } })
  }
  if (grafica.mission) {
    blocks.push({ id: 'f-mission', type: 'mission', content: { title: 'La nostra Mission', body: grafica.mission } })
  }
  if (grafica.vision) {
    blocks.push({ id: 'f-vision', type: 'vision', content: { title: 'La nostra Vision', body: grafica.vision } })
  }
  if (grafica.immagini_gallery?.length > 0) {
    blocks.push({ id: 'f-gallery', type: 'gallery', content: { items: grafica.immagini_gallery } })
  }
  if (grafica.faq?.length > 0) {
    blocks.push({ id: 'f-faq', type: 'faq', content: { items: grafica.faq } })
  }
  if (grafica.documenti?.length > 0) {
    blocks.push({ id: 'f-docs', type: 'documents', content: { items: grafica.documenti } })
  }
  if (grafica.sito_web || grafica.instagram || grafica.facebook) {
    blocks.push({ id: 'f-links', type: 'links', content: { website: grafica.sito_web, instagram: grafica.instagram, facebook: grafica.facebook } })
  }
  if (grafica.partner?.length > 0) {
    blocks.push({ id: 'f-partners', type: 'partners', content: { items: grafica.partner } })
  }

  blocks.push({ id: 'f-positions', type: 'positions', content: {} })
  return blocks
}

// ==========================================
// COMPONENTE PAGINA
// ==========================================
export default async function ProfiloAssociazione({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: associazione } = await supabase
    .from('associazioni')
    .select('*, grafica:associazioni_grafica(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (!associazione) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Associazione non trovata</div>

  const associazioneId = associazione.id
  const grafica = associazione.grafica || {}
  const coloreBrand = grafica.colore_brand || '#111827'
  
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select('*, media_associazioni(url), tags:posizione_tags(tag:tags(id, name))')
    .eq('associazione_id', associazioneId)
    .order('created_at', { ascending: false })

  const posizioni = posizioniRaw?.map(p => ({ 
    ...p, 
    slug: p.slug || null,
    associazioni: {
      denominazione: associazione.denominazione,
      slug: associazione.slug
    },
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean) 
  })) || []

  const parsedConfig = typeof grafica.layout_config === 'string' ? JSON.parse(grafica.layout_config) : grafica.layout_config
  const layout = parsedConfig && Array.isArray(parsedConfig) && parsedConfig.length > 0 
    ? parsedConfig 
    : createFallbackLayout(associazione, grafica)

  // ========================================================
  // ✨ GENERAZIONE DATI STRUTTURATI SCHEMA.ORG (JSON-LD)
  // ========================================================
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://volontariando.work'
  
  // 1. Schema Base per la NGO (Organizzazione Non Profit)
  const schemaNGO: any = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: associazione.denominazione,
    url: `${baseUrl}/associazione/${slug}`,
    logo: associazione.logo_url || `${baseUrl}/opengraph-image.png`,
    sameAs: [
      grafica.sito_web,
      grafica.instagram ? `https://instagram.com/${grafica.instagram.replace('@', '')}` : null,
      grafica.facebook
    ].filter(Boolean)
  }

  // Aggiungiamo i contatti se l'associazione li ha inseriti nel database
  if (grafica.email || grafica.phone || grafica.address) {
    schemaNGO.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: grafica.email || undefined,
      telephone: grafica.phone || undefined,
      address: grafica.address ? {
        '@type': 'PostalAddress',
        streetAddress: grafica.address,
        addressCountry: 'IT'
      } : undefined
    }
  }

  // 2. Schema Opzionale FAQPage (se l'associazione ha configurato delle domande frequenti)
  let schemaFAQ: any = null
  const faqBlock = layout.find((block: any) => block.type === 'faq')
  const faqItems = faqBlock?.content?.items?.filter((f: any) => f.q && f.a) || []

  if (faqItems.length > 0) {
    schemaFAQ = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item: any) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-32 text-slate-900">
      {/* ✨ Dati Strutturati iniettati per i motori di ricerca */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaNGO) }}
      />
      {schemaFAQ && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <main className="max-w-[860px] mx-auto pt-8 px-4 md:px-0 flex flex-col gap-4 md:gap-8">
        {layout.map((block: any) => {
          const BlockComponent = Blocks[block.type as keyof typeof Blocks]
          if (!BlockComponent) return null
          
          return (
            <div key={block.id} className="w-full py-1">
              <BlockComponent 
                content={block.content} 
                positions={posizioni} 
                brandColor={coloreBrand} 
              />
            </div>
          )
        })}
      </main>
    </div>
  )
}