import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { FileText, Link2, Quote, Settings2, Sparkles, Users } from 'lucide-react'
import PosizioneCard from '@/components/PosizioneCard'

// ==========================================
// 1. BLOCCHI READ-ONLY (Gemelli dell'Editor)
// ==========================================

const Blocks = {
  hero: ({ content }: any) => (
    <div className="relative w-full pt-4 pb-8">
      <div className="w-full h-32 md:h-48 rounded-[2rem] bg-slate-100 overflow-hidden relative shadow-sm border border-slate-100/50">
        {content.coverUrl && <img src={content.coverUrl} className="w-full h-full object-cover" alt="Copertina" />}
      </div>
      <div className="px-4 md:px-8 relative -mt-10 md:-mt-12 flex flex-col items-start">
        {content.logoUrl ? (
          <img src={content.logoUrl} className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-white rounded-3xl shadow-lg border-[4px] border-white z-10 object-cover" alt="Logo" />
        ) : (
          <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-white rounded-3xl shadow-lg border-[4px] border-white z-10 flex items-center justify-center text-4xl font-bold text-slate-200">
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
  ),

  about: ({ content }: any) => (
    <section className="px-2">
      <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">{content.title || 'Chi Siamo'}</h3>
      <p className="text-lg text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{content.body}</p>
    </section>
  ),

  stats: ({ content }: any) => {
    const items = content.items || []
    if (items.length === 0) return null
    return (
      <div className="flex flex-wrap gap-12 md:gap-24 border-b border-slate-100 pb-12 pt-4 px-2">
        {items.map((stat: any, i: number) => stat.value && stat.label && (
          <div key={i} className="min-w-[120px]">
            <div className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 mb-2">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>
    )
  },

  gallery: ({ content }: any) => {
    const images = content.items || []
    if (images.filter(Boolean).length === 0) return null
    
    // Classes for the Bento Grid layout
    const cellClasses = [
      "col-span-2 row-span-2 rounded-[2rem]",
      "col-span-1 row-span-1 rounded-3xl",
      "col-span-1 row-span-1 rounded-3xl",
      "col-span-1 row-span-1 rounded-3xl",
      "col-span-1 row-span-1 rounded-3xl",
      "col-span-1 row-span-1 rounded-3xl"
    ]

    return (
      <section className="grid grid-cols-3 gap-3 md:gap-4 auto-rows-[120px] md:auto-rows-[180px] px-2">
        {cellClasses.map((cls, i) => {
          const img = images[i]
          return img ? (
            <img key={i} src={img} className={`${cls} w-full h-full object-cover shadow-sm`} alt="Galleria" />
          ) : (
            <div key={i} className={`${cls} bg-transparent`} /> // Empty space preserver
          )
        })}
      </section>
    )
  },

  missionVision: ({ content }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-16 pt-4 px-2">
      {content.mission && (
        <section>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6">{content.missionTitle || 'Mission'}</h3>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap">{content.mission}</p>
        </section>
      )}
      {content.vision && (
        <section>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6">{content.visionTitle || 'Vision'}</h3>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap">{content.vision}</p>
        </section>
      )}
    </div>
  ),

  faq: ({ content }: any) => {
    const items = content.items || []
    if (items.length === 0) return null
    return (
      <section className="space-y-6 max-w-3xl px-2">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-8">Domande frequenti</h3>
        {items.map((item: any, i: number) => item.q && item.a && (
          <div key={i} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
            <h4 className="text-lg font-bold text-slate-900 mb-2">{item.q}</h4>
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
      <section className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 mx-2">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Documenti Utili</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((doc: any, i: number) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="w-12 h-12 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block truncate">{doc.nome || 'Documento'}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">PDF Scaricabile</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    )
  },

  links: ({ content }: any) => (
    <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 mx-2">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Link Utili</h3>
      <div className="flex flex-col sm:flex-row flex-wrap gap-4">
        {content.website && <a href={content.website.startsWith('http') ? content.website : `https://${content.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-300 transition-all text-sm font-bold text-slate-900"><Link2 className="w-4 h-4 text-slate-400" /> Sito Web</a>}
        {content.instagram && <a href={`https://instagram.com/${content.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-300 transition-all text-sm font-bold text-slate-900"><Link2 className="w-4 h-4 text-slate-400" /> Instagram</a>}
        {content.facebook && <a href={content.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-300 transition-all text-sm font-bold text-slate-900"><Link2 className="w-4 h-4 text-slate-400" /> Facebook</a>}
      </div>
    </div>
  ),

  partners: ({ content }: any) => {
    const items = content.items?.filter(Boolean) || []
    if (items.length === 0) return null
    return (
      <section className="border-t border-slate-100 pt-12 mt-12 text-center px-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Collaborano con noi</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-60 items-center">
          {items.map((partner: string, i: number) => (
            <span key={i} className="font-bold text-lg text-slate-900">{partner}</span>
          ))}
        </div>
      </section>
    )
  },

  positions: ({ positions, brandColor }: any) => (
    <div className="mt-8 pt-12 px-2">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Posizioni aperte</h3>
        <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-full font-bold text-base">{positions?.length || 0}</span>
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
// 2. LOGICA DI FALLBACK (Per vecchi profili)
// ==========================================
function createFallbackLayout(associazione: any, grafica: any) {
  const blocks = []
  
  // Hero
  blocks.push({ type: 'hero', content: { title: associazione.denominazione, eyebrow: associazione.forma_giuridica, subtitle: grafica.tagline, coverUrl: grafica.cover_url, logoUrl: associazione.logo_url, brandColor: grafica.colore_brand || '#111827' } })
  
  // Numeri (Se esistono)
  if (grafica.statistiche && Array.isArray(grafica.statistiche) && grafica.statistiche.length > 0) {
    blocks.push({ type: 'stats', content: { items: grafica.statistiche } })
  }
  
  // Chi Siamo
  if (grafica.chi_siamo) {
    blocks.push({ type: 'about', content: { title: 'Chi Siamo', body: grafica.chi_siamo } })
  }

  // Mission / Vision
  if (grafica.mission || grafica.vision) {
    blocks.push({ type: 'missionVision', content: { missionTitle: 'Mission', mission: grafica.mission, visionTitle: 'Vision', vision: grafica.vision } })
  }

  // Galleria
  if (grafica.immagini_gallery && Array.isArray(grafica.immagini_gallery) && grafica.immagini_gallery.length > 0) {
    blocks.push({ type: 'gallery', content: { items: grafica.immagini_gallery } })
  }

  // FAQ
  if (grafica.faq && Array.isArray(grafica.faq) && grafica.faq.length > 0) {
    blocks.push({ type: 'faq', content: { items: grafica.faq } })
  }

  // Documenti
  if (grafica.documenti && Array.isArray(grafica.documenti) && grafica.documenti.length > 0) {
    blocks.push({ type: 'documents', content: { items: grafica.documenti } })
  }

  // Link & Partner
  if (grafica.sito_web || grafica.instagram || grafica.facebook) {
    blocks.push({ type: 'links', content: { website: grafica.sito_web, instagram: grafica.instagram, facebook: grafica.facebook } })
  }
  if (grafica.partner && Array.isArray(grafica.partner) && grafica.partner.length > 0) {
    blocks.push({ type: 'partners', content: { items: grafica.partner } })
  }

  // Posizioni sempre alla fine
  blocks.push({ type: 'positions', content: {} })

  return blocks
}

// ==========================================
// 3. PAGINA PRINCIPALE PUBBLICA
// ==========================================

export default async function ProfiloAssociazione({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: associazione } = await supabase.from('associazioni').select('*, grafica:associazioni_grafica(*)').eq('id', id).single()
  if (!associazione) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Associazione non trovata</div>

  const grafica = associazione.grafica || {}
  const coloreBrand = grafica.colore_brand || '#111827'
  
  // Posizioni
  const { data: posizioniRaw } = await supabase.from('posizioni').select('*, media_associazioni(url), tags:posizione_tags(tag:tags(id, name))').eq('associazione_id', id).order('created_at', { ascending: false })
  const posizioni = posizioniRaw?.map(p => ({ ...p, tags: p.tags?.map((t: any) => t.tag).filter(Boolean) })) || []

  // Auth Control per il bottone Edit
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === id;

  // Elaborazione Layout config
  const parsedConfig = typeof grafica.layout_config === 'string' ? JSON.parse(grafica.layout_config) : grafica.layout_config;
  const layout = parsedConfig && Array.isArray(parsedConfig) && parsedConfig.length > 0 
    ? parsedConfig 
    : createFallbackLayout(associazione, grafica);

  return (
    <div className="min-h-screen bg-white font-sans pb-32">
      {/* Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* TOP BAR (Solo per l'owner) */}
      {isOwner && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-[860px] mx-auto flex items-center justify-between p-3 px-4 md:px-0">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Vista Pubblica
            </span>
            <Link href="/app/associazione/personalizza" className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-slate-100 transition-colors">
              Modifica Vetrina
            </Link>
          </div>
        </div>
      )}

      {/* RENDERIZZAZIONE DINAMICA CANVAS */}
      <main className="max-w-[860px] mx-auto pt-6 px-4 md:px-0 flex flex-col gap-6 md:gap-10">
        {layout.map((block: any) => {
          const BlockComponent = Blocks[block.type as keyof typeof Blocks]
          if (!BlockComponent) return null
          
          return (
            <div key={block.id} className="w-full">
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