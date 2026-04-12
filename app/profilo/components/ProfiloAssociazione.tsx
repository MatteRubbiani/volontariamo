import Link from 'next/link'
import TagBadge from '@/components/TagBadge'

export default function ProfiloAssociazione({ data, email }: { data: any, email: string }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-12">
          
          {/* HEADER PROFILO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-green-100 text-green-700">
                Profilo Associazione {data.forma_giuridica ? `· ${data.forma_giuridica}` : ''}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                {data.nome}
              </h1>
              <p className="text-slate-500 font-medium mt-2">{data.email_contatto || email}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/profilo/modifica" className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-green-600 hover:text-green-600 transition-all">
                MODIFICA PROFILO
              </Link>
              <Link href="/app/associazione" className="px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all">
                VAI ALLA DASHBOARD
              </Link>
            </div>
          </div>

          <div className="space-y-10">
            {/* MISSIONE / DESCRIZIONE */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">La nostra Mission</h2>
              <p className="text-slate-700 font-medium leading-relaxed text-lg">
                {data.descrizione || "Nessuna descrizione inserita. Racconta la vostra missione per attirare più volontari!"}
              </p>
            </div>

            {/* GRIGLIA DETTAGLI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* CONTATTI E REFERENTE */}
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Contatti & Sede</h2>
                <ul className="space-y-4">
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Referente</span>
                    <span className="font-medium text-slate-800">{data.nome_referente || 'Non specificato'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Indirizzo</span>
                    <span className="font-medium text-slate-800">{data.indirizzo_sede}, {data.citta}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Telefono</span>
                    <span className="font-medium text-slate-800">{data.telefono || 'Non specificato'}</span>
                  </li>
                </ul>
              </div>

              {/* DETTAGLI LEGALI E SOCIAL */}
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Informazioni Aggiuntive</h2>
                <ul className="space-y-4">
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Codice Fiscale / P.IVA</span>
                    <span className="font-medium text-slate-800">{data.codice_fiscale || 'Non specificato'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sito Web</span>
                    {data.sito_web ? (
                      <a href={data.sito_web.startsWith('http') ? data.sito_web : `https://${data.sito_web}`} target="_blank" rel="noopener noreferrer" className="font-medium text-green-600 hover:underline">
                        {data.sito_web}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-800">Non specificato</span>
                    )}
                  </li>
                  <li className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Profili Social</span>
                    <span className="font-medium text-slate-800">{data.profili_social || 'Non specificati'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* SEZIONE TAGS - Allineata allo standard Supabase */}
            {data.tags && data.tags.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Settori di Interesse</h2>
                <div className="flex flex-wrap gap-3">
                  {data.tags.map((item: any, i: number) => {
                    // Estraiamo il tag vero e proprio dall'oggetto di join
                    const tag = item.tag;
                    if (!tag) return null; // Fallback di sicurezza
                    
                    return (
                      <TagBadge key={tag.id || i} nome={tag.name} size="md" /> 
                    )
                  })}
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Associazione iscritta dal {new Date(data.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}