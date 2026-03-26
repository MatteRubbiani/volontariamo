import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function DettaglioPosizione({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Chi è l'utente?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Prendiamo l'ID dall'URL
  const { id } = await params

  // 3. Carichiamo Dettagli Posizione + Check Candidatura
  const [posRes, candRes] = await Promise.all([
    supabase
      .from('posizioni')
      .select(`*, posizione_tags(tags(id, name))`)
      .eq('id', id)
      .single(),
    supabase
      .from('candidature')
      .select('id, stato')
      .eq('posizione_id', id)
      .eq('volontario_id', user.id)
      .single()
  ])

  const posizione = posRes.data
  const giaCandidato = !!candRes.data

  if (!posizione) {
    return (
      <div className="p-20 text-center font-bold">Posizione non trovata! ❌</div>
    )
  }

  // Pulizia dei tag
  const tags = posizione.posizione_tags?.map((pt: any) => pt.tags).filter(Boolean) || []

  // --- SERVER ACTION: CANDIDATI ---
  async function handleCandidatura() {
    'use server'
    const cookieStore = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user: u } } = await supabaseAction.auth.getUser()
    if (!u) return

    await supabaseAction.from('candidature').insert({
      posizione_id: id,
      volontario_id: u.id,
      stato: 'in_attesa'
    })

    revalidatePath(`/dashboard/volontario/posizione/${id}`)
  }

  // --- SERVER ACTION: ANNULLA CANDIDATURA ---
  async function handleAnnullaCandidatura() {
    'use server'
    const cookieStore = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user: u } } = await supabaseAction.auth.getUser()
    if (!u) return

    await supabaseAction
      .from('candidature')
      .delete()
      .eq('posizione_id', id)
      .eq('volontario_id', u.id)

    revalidatePath(`/dashboard/volontario/posizione/${id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard/volontario" className="text-slate-500 font-black flex items-center gap-2 hover:text-blue-600 transition-colors">
            ← TORNA ALLA BACHECA
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 mb-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
              {posizione.titolo}
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((t: any) => (
              <span key={t.id} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-100">
                #{t.name}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-10 text-slate-700">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-tighter">Dove si svolge</p>
              <p className="font-bold">📍 {posizione.dove}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-tighter">Quando</p>
              <p className="font-bold">📅 {posizione.quando}</p>
              <p className="text-sm text-slate-500 font-bold">Dalle {posizione.ora_inizio?.substring(0,5)} alle {posizione.ora_fine?.substring(0,5)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrizione attività</p>
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-lg">
              {posizione.descrizione}
            </p>
          </div>
        </div>

        {/* BOX CANDIDATURA CON TASTO ANNULLA */}
        <div className={`p-8 md:p-10 rounded-[3rem] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${
          giaCandidato 
            ? 'bg-white border-slate-200 shadow-sm' 
            : 'bg-blue-600 border-blue-600 shadow-xl'
        }`}>
          <div className="text-center md:text-left">
            <h3 className={`text-2xl font-black mb-1 ${giaCandidato ? 'text-slate-800' : 'text-white'}`}>
              {giaCandidato ? 'Candidatura in corso ⏳' : 'Sei la persona giusta?'}
            </h3>
            <p className={`font-bold ${giaCandidato ? 'text-slate-500' : 'text-blue-100'}`}>
              {giaCandidato ? 'L\'associazione sta valutando il tuo profilo.' : 'Invia la tua disponibilità con un click.'}
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            {giaCandidato ? (
              <>
                <div className="px-8 py-4 rounded-2xl bg-green-50 text-green-700 font-black text-lg border border-green-200 w-full text-center">
                  SEI DENTRO ✅
                </div>
                <form action={handleAnnullaCandidatura} className="w-full sm:w-auto">
                  <button 
                    type="submit"
                    className="w-full px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Annulla
                  </button>
                </form>
              </>
            ) : (
              <form action={handleCandidatura} className="w-full">
                <button 
                  type="submit"
                  className="w-full px-10 py-4 rounded-2xl font-black text-lg bg-white text-blue-600 hover:scale-105 active:scale-95 shadow-lg transition-all"
                >
                  CANDIDATI ORA 🚀
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}