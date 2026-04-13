import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ImpresaDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch dell'azienda
  const { data: impresa } = await supabase
    .from('imprese')
    .select('id, ragione_sociale, obiettivi_esg')
    .eq('id', user.id)
    .maybeSingle()

  // Fetch dipendenti attivi
  const { data: dipendentiAttivi, count: dipendentiCount } = await supabase
    .from('impresa_dipendenti')
    .select('id', { count: 'exact' })
    .eq('impresa_id', user.id)
    .eq('stato', 'attivo')

  // Fetch ore ESG (da candidature con impresa_sponsor_id)
  const { data: volunteerHours } = await supabase
    .from('candidature')
    .select('id')
    .eq('impresa_sponsor_id', user.id)
    .eq('stato', 'completata')

  const oreESG = (volunteerHours?.length || 0) * 4 // Mock: 4 ore per candidatura

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* HERO / SALUTO */}
        <section className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Ciao, {impresa?.ragione_sociale || 'Azienda'}! 👋
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">
            Monitora l'impatto ESG della tua azienda. Gestisci il tuo team di volontari, supporta le associazioni e partecipa alla formazione CSR.
          </p>
        </section>

        {/* CARD STATISTICHE */}
        <section className="grid gap-6 md:grid-cols-3 mb-10">
          {/* Dipendenti Attivi */}
          <div className="bg-white rounded-3xl border border-violet-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Team ESG</p>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-black text-slate-900">{dipendentiCount || 0}</p>
            <p className="mt-2 text-sm text-slate-500">Dipendenti attivi</p>
          </div>

          {/* Ore ESG */}
          <div className="bg-white rounded-3xl border border-violet-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Impatto Globale</p>
              <span className="text-3xl">⏱️</span>
            </div>
            <p className="text-4xl font-black text-slate-900">{oreESG}</p>
            <p className="mt-2 text-sm text-slate-500">Ore di volontariato</p>
          </div>

          {/* Donazioni (Mock per ora) */}
          <div className="bg-white rounded-3xl border border-violet-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Donazioni</p>
              <span className="text-3xl">💚</span>
            </div>
            <p className="text-4xl font-black text-slate-900">12</p>
            <p className="mt-2 text-sm text-slate-500">Associazioni supportate</p>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Team */}
          <Link href="/app/impresa/team" className="group">
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 text-white h-full flex flex-col justify-between transform group-hover:scale-105">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">Gestione</p>
                <h2 className="text-3xl font-black mb-3">Team ESG</h2>
                <p className="text-violet-100 leading-relaxed">
                  Invita i tuoi dipendenti, monitora le candidature e gestisci il volontariato aziendale.
                </p>
              </div>
              <div className="mt-6 text-2xl">👨‍💼</div>
            </div>
          </Link>

          {/* Donazioni */}
          <Link href="/app/impresa/donazioni" className="group">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 text-white h-full flex flex-col justify-between transform group-hover:scale-105">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">Responsabilità Sociale</p>
                <h2 className="text-3xl font-black mb-3">Donazioni</h2>
                <p className="text-emerald-100 leading-relaxed">
                  Scopri le associazioni che supportano le cause che t'interessano e fai la differenza.
                </p>
              </div>
              <div className="mt-6 text-2xl">🤝</div>
            </div>
          </Link>

          {/* Webinar */}
          <Link href="/app/impresa/webinar" className="group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 text-white h-full flex flex-col justify-between transform group-hover:scale-105">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">Formazione</p>
                <h2 className="text-3xl font-black mb-3">Webinar CSR</h2>
                <p className="text-blue-100 leading-relaxed">
                  Partecipa a sessioni di formazione sulla responsabilità sociale d'impresa e impatto ESG.
                </p>
              </div>
              <div className="mt-6 text-2xl">🎓</div>
            </div>
          </Link>
        </section>
      </div>
    </main>
  )
}
