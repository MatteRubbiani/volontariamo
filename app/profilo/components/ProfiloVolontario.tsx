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
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 px-5 rounded-full transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-3.141 1.047a.875.875 0 01-1.11-.11l-.11-1.11a4.5 4.5 0 011.147-1.89L16.862 4.487z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
          </svg>
          <span className="hidden sm:inline">Modifica</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* COLONNA SINISTRA: ID CARD */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            {/* Sfondo colorato in cima alla card */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
            
            <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-4 mt-8">
              {data.foto_profilo_url ? (
                <img src={data.foto_profilo_url} alt="Profilo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-400">{iniziali}</span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {data.nome || data.cognome ? `${data.nome || ''} ${data.cognome || ''}` : 'Utente Volontario'}
            </h2>
            <p className="text-slate-500 font-medium mb-6">Membro della community</p>
            
            <div className="w-full flex flex-col gap-4 text-left border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Posizione</p>
                {data.citta_residenza || data.cap ? (
                  <p className="text-sm font-bold text-slate-800">{data.citta_residenza || 'Città non specificata'} {data.cap ? `(${data.cap})` : ''}</p>
                ) : (
                  <Link href="/profilo/modifica" className="text-sm text-slate-900 font-bold underline hover:text-slate-600 transition-colors">Aggiungi posizione</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLI E SKILLS */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* SEZIONE BIO */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              Su di me
            </h3>
            {data.bio ? (
              <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{data.bio}</p>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 text-center">
                <p className="text-slate-500 font-medium mb-3">Non hai ancora scritto niente su di te.</p>
                <Link href="/profilo/modifica" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-2 px-6 rounded-full shadow-sm hover:scale-105 transition-transform text-sm">
                  Aggiungi una Bio
                </Link>
              </div>
            )}
          </div>

          {/* SEZIONE SKILLS & TAGS */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-8">
            
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full text-slate-700">
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
                <p className="text-sm text-slate-400 font-medium italic">Nessuna competenza inserita.</p>
              )}
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full text-slate-700">
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
                <p className="text-sm text-slate-400 font-medium italic">Nessun settore di interesse inserito.</p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}