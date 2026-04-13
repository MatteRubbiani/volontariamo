import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
// Import locali (Colocation)
import ModalInvitoTeam from './components/ModalInvitoTeam'
import CopyLinkButton from './components/CopyLinkButton'

export default async function TeamPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. Fetch Dipendenti Attivi
  const { data: dipendenti } = await supabase
    .from('impresa_dipendenti')
    .select(`
      id, 
      stato, 
      ruolo_aziendale, 
      volontari ( 
        nome, 
        cognome, 
        email_contatto 
      )
    `)
    .eq('impresa_id', user.id)

  // 2. Fetch Inviti in Attesa (ORA ESTRAIAMO ANCHE IL TOKEN)
  const { data: inviti } = await supabase
    .from('inviti_impresa')
    .select(`id, email, stato, created_at, token`)
    .eq('impresa_id', user.id)
    .eq('stato', 'in_attesa')

  // Uniamo le liste gestendo il fatto che 'volontari' potrebbe essere visto come array
  const teamList = [
    ...(dipendenti || []).map(d => {
      // Trucco per TypeScript: prendiamo il primo elemento se è un array, altrimenti l'oggetto
      const v: any = Array.isArray(d.volontari) ? d.volontari[0] : d.volontari
      
      return {
        id: d.id,
        nome: v ? `${v.nome || ''} ${v.cognome || ''}`.trim() : 'N/A',
        email: v?.email_contatto || 'N/A',
        ruolo: d.ruolo_aziendale || '—',
        stato: 'attivo',
        token: null // I dipendenti attivi non hanno più bisogno del token
      }
    }),
    ...(inviti || []).map(i => ({
      id: i.id,
      nome: 'In Attesa...',
      email: i.email,
      ruolo: '—',
      stato: 'invitato',
      token: i.token // Passiamo il token alla lista per il bottone Copia
    }))
  ]

  const attivi = (dipendenti || []).length
  const inAttesa = (inviti || []).length
  const totali = attivi + inAttesa

  const getStatoBadge = (stato: string) => {
    if (stato === 'attivo') return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✓ Attivo' }
    if (stato === 'invitato') return { bg: 'bg-amber-100', text: 'text-amber-800', label: '⧗ In attesa' }
    return { bg: 'bg-slate-100', text: 'text-slate-600', label: stato }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        
        <section className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Team ESG</h1>
            <p className="mt-2 text-slate-600">Gestisci i membri del tuo team di volontariato aziendale.</p>
          </div>
          <ModalInvitoTeam />
        </section>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Team Totale</p>
            <p className="text-3xl font-black text-slate-900">{totali}</p>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Membri Attivi</p>
            <p className="text-3xl font-black text-slate-900">{attivi}</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-amber-600 mb-2">Inviti Inviati</p>
            <p className="text-3xl font-black text-slate-900">{inAttesa}</p>
          </div>
        </div>

        {teamList.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Dipendente</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 hidden md:table-cell">Ruolo Aziendale</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamList.map((membro) => {
                  const badge = getStatoBadge(membro.stato)
                  return (
                    <tr key={membro.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className={`font-bold ${membro.stato === 'invitato' ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                          {membro.nome}
                        </p>
                        <p className="text-sm text-slate-500">{membro.email}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-slate-700 font-medium">{membro.ruolo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Mostriamo il bottone Copia Link solo per gli invitati */}
                        {membro.stato === 'invitato' && membro.token ? (
                          <CopyLinkButton token={membro.token} />
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Nessun dipendente ancora</h2>
            <p className="text-slate-600">Inizia a costruire il tuo team invitando il primo membro.</p>
          </div>
        )}
      </div>
    </main>
  )
}