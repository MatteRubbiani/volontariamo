import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import PosizioneCard from '@/components/PosizioneCard'

export default async function DashboardAssociazione() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // 🚨 AGGIORNAMENTO QUERY: Ora chiediamo a Supabase anche l'URL dell'immagine collegata!
  const { data: posizioniRaw } = await supabase
    .from('posizioni')
    .select(`
      *, 
      media_associazioni(url),
      tags:posizione_tags(tag:tags(id, name)),
      competenze:posizione_competenze(competenza:competenze(id, name))
    `)
    .eq('associazione_id', user?.id)
    .order('created_at', { ascending: false })

  // Riformattiamo tutto in modo che la PosizioneCard legga array puliti {id, name}
  // (L'immagine non ha bisogno di formattazione, la Card legge direttamente media_associazioni.url)
  const posizioni = posizioniRaw?.map(p => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean),
    competenze: p.competenze?.map((c: any) => c.competenza).filter(Boolean)
  }))

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Le tue Posizioni</h1>
          <p className="text-slate-500">Gestisci i tuoi annunci di volontariato attivi.</p>
        </div>
        
        {/* IL TASTO AGGIUNGI */}
        <Link 
          href="/app/associazione/posizione/nuova" 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <span className="text-xl">+</span> Aggiungi Posizione
        </Link>
      </div>

      {/* ELENCO POSIZIONI CON LA CARD CONDIVISA E IMMAGINI */}
      <div className="grid md:grid-cols-2 gap-6">
        {posizioni?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Non hai ancora pubblicato nessuna posizione.</p>
            <Link href="/app/associazione/posizione/nuova" className="text-blue-600 font-bold hover:underline mt-2 inline-block">
              Crea la tua prima inserzione ora
            </Link>
          </div>
        ) : (
          posizioni?.map(p => (
            // Passiamo ruolo="associazione" e i dati riformattati (che ora includono l'url dell'immagine)
            <PosizioneCard key={p.id} posizione={p} ruolo="associazione" />
          ))
        )}
      </div>
    </div>
  )
}