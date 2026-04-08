import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import PosizioneCard from '@/components/PosizioneCard'

export default async function EsploraPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Query estesa: prendiamo associazione, tags e competenze per popolare la PosizioneCard
  const { data: posizioniRaw, error } = await supabase
    .from('posizioni')
    .select(`
      *,
      associazione:associazioni(id, nome, email_contatto),
      tags:posizione_tags(tag:tags(id, name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
    `)
    // .eq('stato', 'attiva') // SCOMMENTA questo solo se nel DB la colonna 'stato' è effettivamente popolata
    .order('created_at', { ascending: false })

  // Riformattiamo i dati in modo che la PosizioneCard li digerisca perfettamente
  const items = posizioniRaw?.map((p) => {
    const associazioneObj = Array.isArray(p.associazione) ? p.associazione[0] : p.associazione;
    
    return {
      ...p,
      associazione: associazioneObj || null,
      tags: p.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      competenze: p.competenze?.map((c: any) => c.competenza).filter(Boolean) || []
    }
  }) || []

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
        
        <div className="mb-10 md:mb-12">
          <p className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
            Discovery pubblica
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Esplora opportunità di volontariato
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg font-medium">
            Scopri posizioni aperte, settori di impatto e associazioni che cercano volontari.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-red-700 shadow-sm">
            <p className="font-bold text-lg">Errore di connessione al database:</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-2xl font-black text-slate-900">Nessuna posizione trovata al momento</h2>
            <p className="mt-2 text-slate-500 font-medium">Torna presto, nuove opportunità vengono pubblicate ogni giorno.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((posizione) => (
              <PosizioneCard 
                key={posizione.id} 
                posizione={posizione} 
                ruolo="volontario" // Passiamo "volontario" per mantenere il layout base della card
              />
            ))}
          </div>
        )}

      </section>
    </main>
  )
}