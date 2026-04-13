import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ModalInvitoTeam from './components/ModalInvitoTeam'
import CopyLinkButton from './components/CopyLinkButton'
import DeleteMemberButton from './components/DeleteMemberButton'

export default async function TeamPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. Fetch Dati in Parallelo
  const [dipendentiRes, invitiRes] = await Promise.all([
    supabase
      .from('impresa_dipendenti')
      .select(`id, stato, ruolo_aziendale, volontari ( nome, cognome, email_contatto )`)
      .eq('impresa_id', user.id),
    supabase
      .from('inviti_impresa')
      .select(`id, email, stato, created_at, token`)
      .eq('impresa_id', user.id)
      .eq('stato', 'in_attesa')
  ])

  // 🚨 SISTEMA DI DEBUG PROFESSIONALE: Intercettiamo gli errori di permessi
  const dbError = dipendentiRes.error?.message || invitiRes.error?.message

  // 2. Costruzione della Lista
  const teamList = [
    ...(dipendentiRes.data || []).map(d => {
      const v: any = Array.isArray(d.volontari) ? d.volontari[0] : d.volontari
      return {
        id: d.id,
        // Se l'utente ha accettato con una mail diversa e non ha nome, lo avvisiamo
        nome: v && (v.nome || v.cognome) ? `${v.nome || ''} ${v.cognome || ''}`.trim() : 'Volontario Anonimo',
        // Mostriamo l'email di contatto o un avviso
        email: v?.email_contatto || 'Nessuna email pubblica fornita',
        ruolo: d.ruolo_aziendale || '—',
        stato: 'attivo' as const,
        token: null
      }
    }),
    ...(invitiRes.data || []).map(i => ({
      id: i.id,
      nome: 'In Attesa...',
      email: i.email, // Qui mostriamo l'email a cui abbiamo mandato l'invito
      ruolo: '—',
      stato: 'invitato' as const,
      token: i.token
    }))
  ]

  const attivi = (dipendentiRes.data || []).length
  const inAttesa = (invitiRes.data || []).length

  const getStatoBadge = (stato: string) => {
    if (stato === 'attivo') return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✓ Attivo' }
    return { bg: 'bg-amber-100', text: 'text-amber-800', label: '⧗ In attesa' }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-6xl">
        
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">Team ESG</h1>
            <p className="mt-2 text-slate-500 font-medium">Gestione flotta dipendenti e volontari aziendali.</p>
          </div>
          <ModalInvitoTeam />
        </header>

        {/* BANNER ERRORE DATABASE (Se appare, sappiamo che mancano le RLS) */}
        {dbError && (
          <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-red-800 font-black text-lg mb-1">⚠️ Blocco di Sicurezza Database</h3>
            <p className="text-red-600 font-medium text-sm">
              Il database sta nascondendo i dipendenti. Errore restituito: <code className="bg-white px-2 py-1 rounded text-red-500">{dbError}</code>
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Capacità Team</p>
            <p className="text-4xl font-black text-slate-900">{attivi + inAttesa}</p>
          </div>
          <div className="bg-emerald-500 rounded-[2rem] p-8 shadow-lg shadow-emerald-100">
            <p className="text-[10px] font-black uppercase text-emerald-100 mb-2 tracking-widest">Membri Attivi</p>
            <p className="text-4xl font-black text-white">{attivi}</p>
          </div>
          <div className="bg-white rounded-[2rem] border border-amber-100 p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase text-amber-500 mb-2 tracking-widest">Inviti Pendenti</p>
            <p className="text-4xl font-black text-slate-900">{inAttesa}</p>
          </div>
        </div>

        {teamList.length > 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Dipendente</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 hidden md:table-cell">Posizione</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamList.map((membro) => {
                  const badge = getStatoBadge(membro.stato)
                  return (
                    <tr key={membro.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <p className={`text-lg font-black ${membro.stato === 'invitato' ? 'text-slate-300' : 'text-slate-900'}`}>
                          {membro.nome}
                        </p>
                        <p className={`text-sm font-medium ${membro.email.includes('Nessuna') ? 'text-slate-300 italic' : 'text-slate-400'}`}>
                          {membro.email}
                        </p>
                      </td>
                      <td className="px-8 py-6 hidden md:table-cell">
                        <p className="text-slate-600 font-bold">{membro.ruolo}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                          {membro.stato === 'invitato' && membro.token && (
                            <CopyLinkButton token={membro.token} />
                          )}
                          <DeleteMemberButton id={membro.id} tipo={membro.stato} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center shadow-sm">
            <div className="text-6xl mb-6 grayscale opacity-50">🏎️</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">Il garage è vuoto</h2>
            <p className="text-slate-400 font-medium">Inizia ad invitare i tuoi campioni per scendere in pista.</p>
          </div>
        )}
      </div>
    </main>
  )
}