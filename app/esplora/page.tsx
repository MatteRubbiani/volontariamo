import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VistaEsplora from '@/components/VistaEsplora'
import { Database } from '@/types/supabase'

export const metadata = {
  title: 'Esplora la Mappa', 
  description: 'Scopri le opportunità di volontariato vicino a te sulla mappa interattiva.',
}

export default async function EsploraPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const resolveImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from('posizioni').getPublicUrl(path)
    return data?.publicUrl || null
  }

  // 1. Query iniziale SSR pulita: solo annunci pubblicati con coordinate valide
  const { data: posizioniIniziali } = await (supabase.from('posizioni') as any)
    .select(`
      *,
      associazioni:associazione_id (
        id,
        denominazione,
        slug,
        logo_path
      ),
      posizione_tags (
        tags (
          id,
          nome
        )
      )
    `)
    .in('stato', ['pubblicata', 'aperta'])
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  // 2. Normalizzazione completa compatibile con PosizioneCard
  const formattedInitialData = (posizioniIniziali || []).map((pos: any) => {
    const tags = (pos.posizione_tags || [])
      .map((pt: any) => pt.tags)
      .filter(Boolean)
      .map((t: any) => ({
        id: t.id,
        nome: t.nome,
        name: t.nome,
      }))

    const assoc = pos.associazioni ? {
      id: pos.associazioni.id,
      denominazione: pos.associazioni.denominazione,
      slug: pos.associazioni.slug || null,
      logo_url: resolveImageUrl(pos.associazioni.logo_path),
    } : null

    const imgUrl = resolveImageUrl(pos.immagine_path)

    return {
      ...pos,
      slug: pos.slug || null,
      dove: pos.indirizzo_specifico || pos.luogo_nome || pos.comune || '',
      indirizzo_specifico: pos.indirizzo_specifico || pos.luogo_nome || pos.comune || '',
      quando: pos.quando || (pos.tipo === 'una_tantum' ? pos.data_esatta : (pos.giorni_settimana?.join(', ') || '')),
      immagine_url: imgUrl,
      associazioni: assoc,
      associazione: assoc,
      tags,
      competenze: [],
    }
  })

  return (
    <main className="h-[calc(100vh-76px)] w-full overflow-hidden">
      <VistaEsplora initialData={formattedInitialData} />
    </main>
  )
}