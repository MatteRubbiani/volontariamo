import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iltuosito.vercel.app' // Cambialo col tuo dominio

  // 1. Inizializziamo Supabase (usiamo la chiave anonima per i dati pubblici)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 2. Tiriamo giù SOLO gli ID delle posizioni pubbliche e aggiornate
  const { data: posizioni } = await supabase
    .from('posizioni')
    .select('id')

  // 3. Tiriamo giù SOLO gli ID delle associazioni
  const { data: associazioni } = await supabase
    .from('associazioni')
    .select('id')

  // 4. Creiamo le rotte statiche di base
  const routes = ['', '/esplora', '/auth/login', '/auth/registrazione'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 5. Creiamo dinamicamente le rotte per ogni annuncio
  const posizioniRoutes = (posizioni || []).map((pos) => ({
    url: `${baseUrl}/posizione/${pos.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // 6. Creiamo dinamicamente le rotte per ogni associazione
  const associazioniRoutes = (associazioni || []).map((ass) => ({
    url: `${baseUrl}/associazione/${ass.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 7. Uniamo tutto e diamolo in pasto a Google
  return [...routes, ...posizioniRoutes, ...associazioniRoutes]
}