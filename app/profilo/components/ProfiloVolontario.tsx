'use client'

import Link from 'next/link'
import TagBadge from '@/components/TagBadge'
import CompetenzaBadge from '@/components/CompetenzaBadge'

export default function ProfiloVolontario({ data, email }: { data: any, email: string }) {
  const iniziali = `${data.nome?.charAt(0) || ''}${data.cognome?.charAt(0) || 'V'}`.toUpperCase()
  
  const tags = data.tags?.map((t: any) => t.tag) || []
  const competenze = data.competenze?.map((c: any) => c.competenza) || []

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24">
      
      {/* HEADER PREMIUM */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Il mio profilo</h1>
        <Link 
          href="/profilo/modifica"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full transition-all active:scale-95 shadow-sm hover:shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-3.141 1.047a.875.875 0 01-1.11-.11l-.11-1.11a4.5 4.5 0 011.147-1.89L16.862 4.487z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
          </svg>
          <span className="hidden sm:inline">Modifica Profilo</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* COLONNA SINISTRA: ID CARD */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden group transition-all hover:shadow-md">
            {/* Sfondo colorato in cima alla card */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-slate-900 z-0"></div>
            
            <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-4 mt-8 transition-transform group-hover:scale-105">
              {data.foto_profilo_url ? (
                <img src={data.foto_profilo_url} alt="Profilo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-400">{iniziali}</span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {data.nome || data.cognome ? `${data.nome || ''} ${data.cognome || ''}` : 'Utente Volontario'}
            </h2>
            <p className="text-blue-600 font-bold text-sm mb-6 bg-blue-50 px-3 py-1 rounded-full">Membro della community</p>
            
            <div className="w-full flex flex-col gap-5 text-left border-t border-slate-100 pt-6">
              
              {/* Item: Email */}
              <div className="flex gap-3 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 mt-0.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Email</p>
                  <p className="text-sm font-bold text-slate-800 break-all">{data.email_contatto || email}</p>
                </div>
              </div>

              {/* Item: Telefono */}
              <div className="flex gap-3 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 mt-0.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <div className="w-full">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Telefono</p>
                  {data.telefono ? (
                    <p className="text-sm font-bold text-slate-800">{data.telefono}</p>
                  ) : (
                    <Link href="/profilo/modifica" className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                      + Aggiungi
                    </Link>
                  )}
                </div>
              </div>

              {/* Item: Posizione */}
              <div className="flex gap-3 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 mt-0.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div className="w-full">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Posizione</p>
                  {data.citta_residenza || data.cap ? (
                    <p className="text-sm font-bold text-slate-800">{data.citta_residenza || 'Città non specificata'} {data.cap ? `(${data.cap})` : ''}</p>
                  ) : (
                    <Link href="/profilo/modifica" className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                      + Aggiungi
                    </Link>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLI E SKILLS */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* SEZIONE BIO */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              Su di me
            </h3>
            {data.bio ? (
              <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{data.bio}</p>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <p className="text-slate-500 font-medium mb-3">Non hai ancora scritto niente su di te.</p>
                <Link href="/profilo/modifica" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-2 px-6 rounded-full shadow-sm hover:border-slate-300 transition-colors text-sm">
                  Aggiungi una Bio
                </Link>
              </div>
            )}
          </div>

          {/* SEZIONE SKILLS & TAGS */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 flex flex-col gap-10">
            
            {/* Competenze */}
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                Competenze Speciali
              </h3>
              {competenze.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competenze.map((c: any) => (
                    <CompetenzaBadge key={c.id} nome={c.name} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                  <p className="text-slate-500 font-medium mb-3">Fai sapere alle associazioni in cosa eccelli.</p>
                  <Link href="/profilo/modifica" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-2 px-6 rounded-full shadow-sm hover:border-slate-300 transition-colors text-sm">
                    Aggiungi Competenze
                  </Link>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Tags / Cause */}
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                Cause Supportate
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t: any) => (
                    <TagBadge key={t.id} nome={t.name} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                  <p className="text-slate-500 font-medium mb-3">Mostra le cause sociali che ti stanno più a cuore.</p>
                  <Link href="/profilo/modifica" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-2 px-6 rounded-full shadow-sm hover:border-slate-300 transition-colors text-sm">
                    Scegli le tue Cause
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}