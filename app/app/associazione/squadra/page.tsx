import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Clock, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Check, 
  X,
  MapPin
} from 'lucide-react'

// ============================================================================
// DATI MOCK STRUTTURATI SUL NUOVO SCHEMA (squadra_membri + volontari)
// ============================================================================
const MOCK_MEMBRI_ATTIVI = [
  {
    id: 'vol-1',
    nome: 'Chiara',
    cognome: 'Rossi',
    telefono: '+39 347 1234567',
    citta_residenza: 'Milano',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    data_ingresso: '15 Gennaio 2026',
    note: 'Disponibile per turni nel weekend'
  },
  {
    id: 'vol-2',
    nome: 'Matteo',
    cognome: 'Bianchi',
    telefono: '+39 338 9876543',
    citta_residenza: 'Bologna',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    data_ingresso: '03 Febbraio 2026',
    note: 'Coordinatore logistica mensa'
  },
  {
    id: 'vol-3',
    nome: 'Sofia',
    cognome: 'Colombo',
    telefono: '+39 349 5551234',
    citta_residenza: 'Monza',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    data_ingresso: '18 Febbraio 2026',
    note: 'Supporto doposcuola'
  },
  {
    id: 'vol-4',
    nome: 'Alessandro',
    cognome: 'Esposito',
    telefono: null,
    citta_residenza: 'Rozzano',
    avatar_url: null,
    data_ingresso: '01 Marzo 2026',
    note: null
  }
]

const MOCK_MEMBRI_IN_ATTESA = [
  {
    id: 'vol-5',
    nome: 'Elena',
    cognome: 'Ferrari',
    citta_residenza: 'Sesto San Giovanni',
    telefono: '+39 340 1122334',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    data_richiesta: 'Ieri alle 16:30'
  },
  {
    id: 'vol-6',
    nome: 'Davide',
    cognome: 'Romano',
    citta_residenza: 'Cinisello Balsamo',
    telefono: '+39 333 4455667',
    avatar_url: null,
    data_richiesta: '3 giorni fa'
  }
]

export default async function SquadraAssociazionePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const sp = await searchParams
  const activeTab = sp?.tab === 'attesa' ? 'attesa' : 'attivi'

  const attivi = MOCK_MEMBRI_ATTIVI
  const inAttesa = MOCK_MEMBRI_IN_ATTESA

  // Server Action mock di simulazione
  async function aggiornaStatoMock(formData: FormData) {
    'use server'
    const idVolontario = formData.get('id') as string
    const nuovoStato = formData.get('stato') as string
    const currentTab = formData.get('tab') as string

    // In produzione qui eseguirai:
    // supabase.from('squadra_membri').update({ stato: nuovoStato }).eq('volontario_id', idVolontario)
    console.log(`[Mock Squadra] Aggiornato stato volontario ${idVolontario} a: ${nuovoStato}`)

    redirect(`/app/associazione/squadra?tab=${currentTab}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 font-sans text-slate-900 antialiased pb-32">
      
      {/* HEADER AIRBNB STYLE */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
          La tua Squadra
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
          Gestisci i volontari confermati e valuta le nuove richieste di ingresso.
        </p>
      </div>

      {/* SEGMENTED CONTROL TABS */}
      <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-8 w-full sm:w-max border border-slate-200/50">
        <Link 
          href="/app/associazione/squadra?tab=attivi"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attivi' 
              ? 'bg-white text-slate-950 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2]" />
          <span>Membri Attivi</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'attivi' ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/60 text-slate-600'
          }`}>
            {attivi.length}
          </span>
        </Link>
        <Link 
          href="/app/associazione/squadra?tab=attesa"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attesa' 
              ? 'bg-white text-slate-950 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 stroke-[2]" />
          <span>In Attesa</span>
          {inAttesa.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 animate-pulse">
              {inAttesa.length}
            </span>
          )}
        </Link>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: MEMBRI ATTIVI                                                 */}
      {/* ==================================================================== */}
      {activeTab === 'attivi' && (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
          
          {/* Intestazione Colonne Desktop */}
          <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex-1">Volontario</div>
            <div className="flex-1 text-center">Recapito Telefonico</div>
            <div className="flex-1 text-right">Azioni</div>
          </div>

          {attivi.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-slate-300 stroke-[1.5]" />
              </div>
              <p className="text-slate-900 font-bold text-sm">Nessun volontario attivo</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">
                I volontari accettati entreranno a far parte della squadra e compariranno in questo elenco.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80">
              {attivi.map((membro) => (
                <div 
                  key={membro.id} 
                  className="flex items-center justify-between px-5 md:px-6 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  
                  {/* Foto e Nominativo */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                      {membro.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={membro.avatar_url} 
                          alt={`${membro.nome} ${membro.cognome}`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span>{membro.nome.charAt(0)}{membro.cognome.charAt(0)}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {membro.nome} {membro.cognome}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{membro.citta_residenza}</span>
                      </p>
                    </div>
                  </div>

                  {/* Telefono */}
                  <div className="hidden md:flex flex-1 items-center justify-center text-xs text-slate-600 truncate px-4">
                    {membro.telefono ? (
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {membro.telefono}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Non specificato</span>
                    )}
                  </div>

                  {/* Azioni Rapide */}
                  <div className="flex items-center justify-end gap-2 flex-1 shrink-0">
                    <Link 
                      href={`/app/associazione/messaggi?volontario=${membro.id}`} 
                      className="p-2 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-950 rounded-xl transition-all border border-slate-100 active:scale-95"
                      title="Avvia conversazione"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2]" />
                    </Link>

                    <form action={aggiornaStatoMock}>
                      <input type="hidden" name="id" value={membro.id} />
                      <input type="hidden" name="stato" value="rimosso" />
                      <input type="hidden" name="tab" value="attivi" />
                      <button 
                        type="submit" 
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95" 
                        title="Rimuovi dalla squadra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: IN ATTESA                                                     */}
      {/* ==================================================================== */}
      {activeTab === 'attesa' && (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
          
          <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex-1">Richiedente</div>
            <div className="flex-1 text-right">Valutazione Richiesta</div>
          </div>

          {inAttesa.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              </div>
              <p className="text-slate-900 font-bold text-sm">Nessuna richiesta in sospeso</p>
              <p className="text-slate-400 text-xs mt-1">
                Tutte le candidature e le richieste sono state evase.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inAttesa.map((richiesta) => (
                <div 
                  key={richiesta.id} 
                  className="flex items-center justify-between px-5 md:px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  
                  {/* Profilo Richiedente */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                      {richiesta.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={richiesta.avatar_url} 
                          alt={`${richiesta.nome} ${richiesta.cognome}`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span>{richiesta.nome.charAt(0)}{richiesta.cognome.charAt(0)}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {richiesta.nome} {richiesta.cognome}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{richiesta.citta_residenza}</span>
                        <span className="mx-1">•</span>
                        <span>{richiesta.data_richiesta}</span>
                      </p>
                    </div>
                  </div>

                  {/* Azioni Accetta / Rifiuta */}
                  <div className="flex items-center justify-end gap-2.5 flex-1 shrink-0">
                    <form action={aggiornaStatoMock}>
                      <input type="hidden" name="id" value={richiesta.id} />
                      <input type="hidden" name="stato" value="rifiutato" />
                      <input type="hidden" name="tab" value="attesa" />
                      <button 
                        type="submit" 
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all active:scale-95 shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Ignora</span>
                      </button>
                    </form>

                    <form action={aggiornaStatoMock}>
                      <input type="hidden" name="id" value={richiesta.id} />
                      <input type="hidden" name="stato" value="attivo" />
                      <input type="hidden" name="tab" value="attesa" />
                      <button 
                        type="submit" 
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 rounded-xl transition-all shadow-xs active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Accetta</span>
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