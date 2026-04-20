'use client'

import Link from 'next/link'
import TagBadge from '@/components/TagBadge'

export default function ProfiloAssociazione({ data, email }: { data: any, email: string }) {
  // Estraiamo le prime due lettere per il placeholder del logo
  const iniziali = data.nome?.substring(0, 2).toUpperCase() || 'AS'
  
  // Mappiamo in modo sicuro i tag
  const tags = data.tags?.map((item: any) => item.tag).filter(Boolean) || []

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Profilo Ente</h1>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link 
            href="/profilo/modifica"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-2xl transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-3.141 1.047a.875.875 0 01-1.11-.11l-.11-1.11a4.5 4.5 0 011.147-1.89L16.862 4.487z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
            </svg>
            <span className="hidden sm:inline">Modifica</span>
          </Link>
          <Link 
            href="/app/associazione"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 font-bold py-3 px-6 rounded-2xl transition-all active:scale-95"
          >
            Vai alla Dashboard
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* COLONNA SINISTRA: ID CARD ASSOCIAZIONE */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            {/* Sfondo colorato in cima alla card */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-600 to-teal-700 z-0"></div>
            
            {/* LOGO: Quadrato arrotondato (Squircle) per gli enti */}
            <div className="relative z-10 w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-4 mt-8">
              {data.foto_profilo_url ? (
                <img src={data.foto_profilo_url} alt="Logo Associazione" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-400">{iniziali}</span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-1 leading-tight">
              {data.nome}
            </h2>
            <p className="text-emerald-700 font-black text-xs uppercase tracking-widest mb-6 bg-emerald-50 px-3 py-1 rounded-full">
              {data.forma_giuridica || 'Associazione'}
            </p>
            
            <div className="w-full flex flex-col gap-4 text-left border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Pubblica</p>
                <p className="text-sm font-bold text-slate-800">{data.email_contatto || email}</p>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Telefono</p>
                {data.telefono ? (
                  <p className="text-sm font-bold text-slate-800">{data.telefono}</p>
                ) : (
                  <Link href="/profilo/modifica" className="text-sm text-slate-900 font-bold underline hover:text-slate-600 transition-colors">Aggiungi numero</Link>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sede Principale</p>
                {(data.citta || data.indirizzo_sede) ? (
                  <p className="text-sm font-bold text-slate-800">
                    {data.indirizzo_sede ? `${data.indirizzo_sede}, ` : ''}{data.citta || 'Città non specificata'}
                  </p>
                ) : (
                  <Link href="/profilo/modifica" className="text-sm text-slate-900 font-bold underline hover:text-slate-600 transition-colors">Aggiungi sede</Link>
                )}
              </div>
              
              {data.sito_web && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sito Web</p>
                  <a href={data.sito_web.startsWith('http') ? data.sito_web : `https://${data.sito_web}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-600 hover:underline truncate block">
                    {data.sito_web.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center px-4">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Iscrizione dal {new Date(data.created_at).toLocaleDateString('it-IT')}
             </p>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLI E SKILLS */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* SEZIONE MISSION */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-full text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
              </div>
              La nostra Mission
            </h3>
            {data.descrizione ? (
              <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{data.descrizione}</p>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 text-center">
                <p className="text-slate-500 font-medium mb-3">Non avete ancora descritto la vostra missione.</p>
                <Link href="/profilo/modifica" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-2 px-6 rounded-full shadow-sm hover:scale-105 transition-transform text-sm">
                  Aggiungi Mission
                </Link>
              </div>
            )}
          </div>

          {/* SEZIONE AREE DI INTERVENTO E DETTAGLI */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-8">
            
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-full text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                Settori di Intervento
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t: any) => (
                    <TagBadge key={t.id} nome={t.name} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 font-medium italic">Nessun settore selezionato.</p>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* ALTRE INFORMAZIONI */}
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-full text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                Dettagli Amministrativi
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Referente</span>
                  <span className="font-medium text-slate-800 block">{data.nome_referente || 'Non specificato'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Codice Fiscale / P.IVA</span>
                  <span className="font-medium text-slate-800 block">{data.codice_fiscale || 'Non specificato'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Profili Social</span>
                  <span className="font-medium text-slate-800 block">{data.profili_social || 'Nessun link social aggiunto'}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}