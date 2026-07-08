import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReteAssociazionePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const sp = await searchParams
  // Gestione nativa dei tab tramite URL (default: attivi)
  const activeTab = sp?.tab === 'attesa' ? 'attesa' : 'attivi'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Recupero dati CRM
  const { data: reteRaw } = await supabase
    .from('rete_volontari')
    .select(`
      id,
      stato,
      created_at,
      volontari (
        id,
        nome,
        cognome,
        bio,
        citta_residenza,
        email_contatto,
        telefono,
        foto_profilo_url
      )
    `)
    .eq('associazione_id', user.id)
    .order('created_at', { ascending: false })

  const inAttesa = reteRaw?.filter(r => r.stato === 'in_attesa') || []
  const attivi = reteRaw?.filter(r => r.stato === 'attivo') || []

  // ⚡ SERVER ACTION: Gestione stato e redirect intelligente al tab corretto
  async function aggiornaStato(formData: FormData) {
    'use server'
    const idRichiesta = formData.get('id') as string
    const nuovoStato = formData.get('stato') as 'attivo' | 'rifiutato'
    const currentTab = formData.get('tab') as string
    
    const cookieStoreAction = await cookies()
    const supabaseAction = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStoreAction.getAll() } } }
    )
    
    await supabaseAction
      .from('rete_volontari')
      .update({ stato: nuovoStato })
      .eq('id', idRichiesta)
      
    // Ricarica la pagina mantenendo il tab attivo
    redirect(`/app/associazione/rete?tab=${currentTab}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      
      {/* INTESTAZIONE CRM */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestione Rete</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Il tuo database volontari. {attivi.length} membri attivi.
        </p>
      </div>

      {/* SEGMENTED CONTROL (TABS MOBILE-FRIENDLY) */}
      <div className="flex bg-slate-100/70 p-1 rounded-xl mb-6 md:w-max">
        <Link 
          href="/app/associazione/rete?tab=attivi"
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'attivi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Membri Attivi
          <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'attivi' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50'}`}>
            {attivi.length}
          </span>
        </Link>
        <Link 
          href="/app/associazione/rete?tab=attesa"
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'attesa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          In Attesa
          {inAttesa.length > 0 && (
            <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'attesa' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100/50 text-amber-600'}`}>
              {inAttesa.length}
            </span>
          )}
        </Link>
      </div>

      {/* CONTENUTO TAB: MEMBRI ATTIVI */}
      {activeTab === 'attivi' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Header Tabella (Nascosto da mobile) */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex-1">Volontario</div>
            <div className="flex-1 text-center">Telefono</div>
            <div className="flex-1 text-right">Azioni</div>
          </div>

          {attivi.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <svg className="w-10 h-10 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-slate-900 font-bold text-lg">Nessun membro attivo</p>
              <p className="text-slate-500 text-sm mt-1">Quando accetterai i volontari, compariranno qui.</p>
            </div>
          ) : (
            <div>
              {attivi.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  
                  {/* 1. FOTO E NOME */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0 shadow-inner border border-slate-200">
                      {req.volontari?.foto_profilo_url ? (
                        <img src={req.volontari.foto_profilo_url} alt="Profilo" className="w-full h-full object-cover" />
                      ) : (
                        (req.volontari?.nome?.charAt(0) || 'V').toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {req.volontari?.nome} {req.volontari?.cognome}
                      </h3>
                    </div>
                  </div>

                  {/* 2. TELEFONO */}
                  <div className="hidden md:flex flex-1 items-center justify-center text-sm text-slate-700 truncate px-4">
                    {req.volontari?.telefono ? (
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.077-7.077l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        {req.volontari.telefono}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Nessun telefono</span>
                    )}
                  </div>

                  {/* 3. AZIONI (CHAT E RIMUOVI) */}
                  <div className="flex items-center justify-end gap-2 flex-1 shrink-0">
                    <Link 
  href={`/app/associazione/messaggi?volontario=${req.volontari?.id}`} 
  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
  title="Invia Messaggio"
>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
</Link>
                    <form action={aggiornaStato}>
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="stato" value="rifiutato" />
                      <input type="hidden" name="tab" value="attivi" />
                      <button type="submit" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Rimuovi dalla rete">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </form>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENUTO TAB: IN ATTESA */}
      {activeTab === 'attesa' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          <div className="hidden md:flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex-1">Richiedente</div>
            <div className="flex-1 text-right">Azione</div>
          </div>

          {inAttesa.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <svg className="w-10 h-10 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <p className="text-slate-900 font-bold text-lg">Tutto pulito!</p>
              <p className="text-slate-500 text-sm mt-1">Non hai richieste in sospeso da gestire.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inAttesa.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between px-4 md:px-6 py-3 bg-amber-50/10 hover:bg-slate-50 transition-colors">
                  
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0 shadow-inner border border-slate-200">
                      {req.volontari?.foto_profilo_url ? (
                        <img src={req.volontari.foto_profilo_url} alt="Profilo" className="w-full h-full object-cover" />
                      ) : (
                        (req.volontari?.nome?.charAt(0) || 'V').toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                        {req.volontari?.nome} {req.volontari?.cognome}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {req.volontari?.citta_residenza ? `Di ${req.volontari.citta_residenza}` : 'Nuovo utente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 flex-1 shrink-0">
                    <form action={aggiornaStato}>
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="stato" value="rifiutato" />
                      <input type="hidden" name="tab" value="attesa" />
                      <button type="submit" className="px-3 md:px-4 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg transition-colors">
                        Ignora
                      </button>
                    </form>
                    <form action={aggiornaStato}>
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="stato" value="attivo" />
                      <input type="hidden" name="tab" value="attesa" />
                      <button type="submit" className="px-3 md:px-4 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm">
                        Accetta
                      </button>
                    </form>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}