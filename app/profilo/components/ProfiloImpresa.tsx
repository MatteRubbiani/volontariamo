import Link from 'next/link'

export default function ProfiloImpresa({ data, email }: { data: any, email: string }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-12">
          
          {/* HEADER PROFILO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-violet-100 text-violet-700">
                Profilo Impresa
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                {data.ragione_sociale}
              </h1>
              <p className="text-slate-500 font-medium mt-2">{data.email_contatto || email}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/profilo/modifica" className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-violet-600 hover:text-violet-600 transition-all">
                MODIFICA PROFILO
              </Link>
              <Link href="/app/impresa" className="px-6 py-3 bg-violet-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all">
                VAI ALLA DASHBOARD
              </Link>
            </div>
          </div>

          <div className="space-y-10">
            {/* MISSION AZIENDALE */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Impatto Sociale & Mission</h2>
              <p className="text-slate-700 font-medium leading-relaxed text-lg">
                {data.mission || "Nessuna mission inserita. Raccontaci l'impatto sociale della tua azienda!"}
              </p>
            </div>

            {/* GRIGLIA DETTAGLI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* DETTAGLI SOCIETARI */}
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Dettagli Aziendali</h2>
                <ul className="space-y-4">
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Partita IVA</span>
                    <span className="font-medium text-slate-800">{data.partita_iva || 'Non specificata'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Dimensione</span>
                    <span className="font-medium text-slate-800">
                      {data.fascia_dipendenti ? `${data.fascia_dipendenti} Dipendenti` : 'Non specificata'}
                    </span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sito Web</span>
                    {data.sito_web ? (
                      <a href={data.sito_web.startsWith('http') ? data.sito_web : `https://${data.sito_web}`} target="_blank" rel="noopener noreferrer" className="font-medium text-violet-600 hover:underline">
                        {data.sito_web}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-800">Non specificato</span>
                    )}
                  </li>
                </ul>
              </div>

              {/* SEDE */}
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Sede Operativa</h2>
                <ul className="space-y-4">
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Città</span>
                    <span className="font-medium text-slate-800">{data.citta || 'Non specificata'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Indirizzo</span>
                    <span className="font-medium text-slate-800">{data.indirizzo_sede || 'Non specificato'}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Partner dal {new Date(data.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}