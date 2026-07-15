import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ✨ Sostituisci con il tuo dominio di produzione reale
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://volontariando.work'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Recuperiamo solo le posizioni PUBBLICATE che hanno uno SLUG valido
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('slug, updated_at')
    .eq('stato', 'pubblicato') // Indicizziamo solo i bandi attivi, non le bozze
    .not('slug', 'is', null)

  // 2. Recuperiamo tutte le associazioni che hanno uno SLUG valido
  const { data: associazioni } = await supabase
    .from('associazioni')
    .select('slug, updated_at')
    .not('slug', 'is', null)

  // 3. Pagine statiche istituzionali (Pagine pubbliche che devono stare su Google)
  const staticRoutes = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: '/esplora', priority: 0.9, changefreq: 'daily' as const },
    { path: '/privacy', priority: 0.3, changefreq: 'monthly' as const },
    { path: '/terms', priority: 0.3, changefreq: 'monthly' as const },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changefreq,
    priority: route.priority,
  }))

  // 4. Generiamo i percorsi delle POSIZIONI usando lo SLUG reale
  const posizioniRoutes = (posizioni || []).map((pos) => ({
    url: `${baseUrl}/posizione/${pos.slug}`,
    // Se nel DB c'è updated_at usiamo quello, altrimenti la data di oggi
    lastModified: pos.updated_at ? new Date(pos.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // 5. Generiamo i percorsi delle ASSOCIAZIONI usando lo SLUG reale
  const associazioniRoutes = (associazioni || []).map((ass) => ({
    url: `${baseUrl}/associazione/${ass.slug}`,
    lastModified: ass.updated_at ? new Date(ass.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 6. Uniamo tutto e restituiamo a Google
  return [...staticRoutes, ...posizioniRoutes, ...associazioniRoutes]
}