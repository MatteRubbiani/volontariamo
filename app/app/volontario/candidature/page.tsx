import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MieCandidature() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  )

  // 1. Controllo Utente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Recuperiamo le candidature unendo i dati della posizione (INCLUSA LA FOTO)
  const { data: candidature, error } = await supabase
    .from('candidature')
    .select(`
      id,
      stato,
      created_at,
      posizione_id,
      posizioni (
        titolo,
        dove,
        quando,
        tipo,
        media_associazioni(url),
        associazioni(nome)
      )
    `)
    .eq('volontario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Errore recupero candidature:", error.message)
  }

  // Helper per le date calde
  const formattaData = (dataString: string | null, tipo: string) => {
    if (!dataString) return 'Data da definire';
    if (tipo === 'una_tantum') {
      try {
        const dateObj = new Date(dataString);
        return dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return dataString;
      }
    }
    return `Ogni ${dataString}`;
  }

  // Stili e label premium per gli stati (Senza Emoji)
  const normalizzaStato = (stato: string) => {
    if (stato === 'accettata') return 'accettato'
    if (stato === 'rifiutata') return 'rifiutato'
    return stato
  }

  const getStatusProps = (stato: string) => {
    switch (stato) {
      case 'accettato':
        return {
          label: 'Assegnata',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        }
      case 'rifiutato':
        return {
          label: 'Non Selezionato',
          style: 'bg-slate-100 text-slate-500 border-slate-200',
          dot: 'bg-slate-400'
        }
      default:
        return {
          label: 'In Attesa',
          style: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      
      {/* HEADER NATIVO PULITO */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1000px] mx-auto flex items-center gap-4">
          <Link href="/app/volontario" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-900">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="font-semibold text-slate-900 text-xl">Le tue candidature</h1>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-5 md:px-8 mt-8 md:mt-12">
        
        {!candidature || candidature.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Nessuna candidatura</h2>
            <p className="text-slate-500 mb-8 font-medium">Non hai ancora inviato nessuna richiesta di partecipazione.</p>
            <Link href="/esplora" className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-black transition-colors shadow-lg shadow-slate-200">
              Esplora attività
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {candidature.map((cand: any) => {
              const pos = cand.posizioni;
              if (!pos) return null; // Salta se la posizione è stata eliminata dal DB

              const imgUrl = pos.media_associazioni?.url;
              const iniziale = pos.titolo ? pos.titolo.charAt(0).toUpperCase() : 'V';
              const nomeAssoc = Array.isArray(pos.associazioni) ? pos.associazioni[0]?.nome : pos.associazioni?.nome || 'Associazione';
              const statoNormalizzato = normalizzaStato(cand.stato);
              const status = getStatusProps(statoNormalizzato);
              const dataFormattata = formattaData(pos.quando, pos.tipo);

              return (
                <div key={cand.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-300 flex flex-col md:flex-row gap-6">
                  
                  {/* 📸 MINIATURA IMMAGINE */}
                  <div className="w-full md:w-36 h-48 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative">
                    {imgUrl ? (
                      <img src={imgUrl} alt={pos.titolo} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-slate-300 text-5xl font-black">{iniziale}</span>
                      </div>
                    )}
                    
                    {/* Badge tipo (Mobile overlap, Desktop absolute) */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 uppercase tracking-widest shadow-sm">
                      {pos.tipo === 'una_tantum' ? 'Singolo' : 'Ricorrente'}
                    </div>
                  </div>

                  {/* 📝 INFO RIASSUNTIVE */}
                  <div className="flex-1 flex flex-col justify-center">
                    
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status.style}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        Inviata il {new Date(cand.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1 leading-tight">
                      {pos.titolo}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mb-4">
                      presso <span className="text-slate-700 font-semibold">{nomeAssoc}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        <span className="truncate max-w-[150px] md:max-w-xs">{pos.dove}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                        <span className="capitalize">{dataFormattata}</span>
                      </div>
                    </div>

                  </div>

                  {/* 🎯 AZIONI */}
                  <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 w-full md:w-40 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                    <Link 
                      href={`/posizione/${cand.posizione_id}`}
                      className="px-4 py-3 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 text-center transition-colors text-sm"
                    >
                      Vedi annuncio
                    </Link>
                    
                    {statoNormalizzato === 'accettato' && (
                      <Link 
                        href={`/app/volontario/chat/${cand.id}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-black shadow-lg shadow-slate-200 text-center transition-all text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        Messaggi
                      </Link>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
