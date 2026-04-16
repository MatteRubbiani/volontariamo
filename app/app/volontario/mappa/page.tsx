// app/app/volontario/mappa/page.tsx

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import FiltriRicercaV2 from '@/components/FiltriRicercaV2'
import MappaWrapper from '@/components/MappaWrapper'

export default async function VolontarioDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const params = await searchParams;
  const lat = params.lat as string
  const lng = params.lng as string
  const raggio = params.raggio as string || '15'
  const q = params.q as string
  const tipo = params.tipo as string

  let query;

  if (lat && lng) {
    // A. Ricerca Geografica: La RPC restituisce già i dati filtrati
    // Importante: assicurati che la funzione RPC nel DB restituisca 
    // il campo coords come testo usando ST_AsText(coords)
    query = supabase.rpc('cerca_posizioni_vicine', { 
      user_lat: parseFloat(lat), 
      user_lng: parseFloat(lng), 
      raggio_km: parseInt(raggio) 
    })
  } else {
    // B. Caricamento Iniziale: Prendiamo tutto, ma forziamo Coords in formato TESTO
    // Usiamo .select('*, coords::text') per far sì che Supabase ci mandi "POINT(lng lat)"
    query = supabase
      .from('posizioni')
      .select('*, coords') 
      .order('created_at', { ascending: false })
      .limit(50)
  }

  if (q) query = query.ilike('titolo', `%${q}%`)
  if (tipo) query = query.eq('tipo', tipo)
  
  const { data: posizioniTrovate, error } = await query
  // 🔥 AGGIUNGI QUESTI DUE LOG:
  console.log("❌ ERRORE SUPABASE:", error)
  console.log("✅ DATI DAL DB:", posizioniTrovate)

  // DEBUG: Decommenta questa riga nel terminale per vedere cosa arriva dal DB
  // console.log("DATA FROM DB:", posizioniTrovate?.[0]?.coords)

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Mappa Opportunità</h1>
            <p className="text-slate-500 font-bold">
              {lat && lng ? `Risultati nel raggio di ${raggio}km` : "Ultime posizioni caricate in tutta Italia"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600">{posizioniTrovate?.length || 0}</span>
            <p className="text-[10px] font-black uppercase text-slate-400">Posizioni trovate</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3">
            <FiltriRicercaV2 /> 
          </div>

          <div className="w-full lg:w-2/3 h-[600px] sticky top-8">
             <MappaWrapper 
                posizioni={posizioniTrovate || []} 
                userLat={lat ? parseFloat(lat) : undefined} 
                userLng={lng ? parseFloat(lng) : undefined}
                raggioKm={parseInt(raggio)}
             />
          </div>
        </div>
      </div>
    </div>
  )
}