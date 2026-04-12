import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

export default function ProfiloVolontario({ data, email }: { data: any, email: string }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-slate-100 text-slate-500">
                Profilo Volontario
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                {data.nome_completo || `${data.nome} ${data.cognome}`}
              </h1>
              <p className="text-slate-500 font-medium mt-2">{email}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/profilo/modifica" className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-blue-600 hover:text-blue-600 transition-all">
                MODIFICA PROFILO
              </Link>
              <Link href="/app/volontario" className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                VAI ALLA DASHBOARD
              </Link>
            </div>
          </div>

          <div className="space-y-10">
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">La tua Bio</h2>
              <p className="text-slate-700 font-medium leading-relaxed text-lg">
                {data.bio || "Nessuna bio inserita. Modifica il profilo per farti conoscere meglio!"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">I tuoi Interessi</h2>
                <div className="flex flex-wrap gap-3">
                  {data.tags && data.tags.length > 0 ? (
                    data.tags.map((item: any) => <TagBadge key={item.tag.id} nome={item.tag.name} size="md" />)
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Nessun interesse selezionato.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">I tuoi Superpoteri</h2>
                <div className="flex flex-wrap gap-2.5">
                  {data.competenze && data.competenze.length > 0 ? (
                    data.competenze.map((item: any) => <CompetenzaBadge key={item.competenza.id} nome={item.competenza.name} />)
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Nessuna competenza inserita.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Membro dal {new Date(data.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}