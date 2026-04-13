import Link from 'next/link'

// Mock data per donazioni
const donazioniHistory = [
  {
    id: 1,
    associazione: 'Croce Rossa Italiana',
    importo: 5000,
    data: '2026-04-08',
    causa: 'Emergenza Sanitaria'
  },
  {
    id: 2,
    associazione: 'Greenpeace Italia',
    importo: 3000,
    data: '2026-03-15',
    causa: 'Protezione Ambiente'
  },
  {
    id: 3,
    associazione: 'Save the Children',
    importo: 7500,
    data: '2026-02-20',
    causa: 'Educazione Infanzia'
  }
]

// Mock data associazioni disponibili
const associazioniDisponibili = [
  {
    id: 1,
    nome: 'Medici Senza Frontiere',
    causa: 'Salute Globale',
    descrizione: 'Fornisce assistenza medica in paesi colpiti da crisi',
    icona: '🏥'
  },
  {
    id: 2,
    nome: 'Emergency',
    causa: 'Diritti Umani',
    descrizione: 'Ospedali e centri chirurgici in zone di conflitto',
    icona: '🚑'
  },
  {
    id: 3,
    nome: 'WWF Italia',
    causa: 'Biodiversità',
    descrizione: 'Conservazione della natura e della fauna selvatica',
    icona: '🌍'
  },
  {
    id: 4,
    nome: 'UNICEF',
    causa: 'Infanzia',
    descrizione: 'Protezione e assistenza ai bambini nel mondo',
    icona: '👶'
  }
]

export default function DonazioniPage() {
  const totaleDonazioni = donazioniHistory.reduce((sum, d) => sum + d.importo, 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <section className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Impatto Sociale ESG
          </h1>
          <p className="mt-2 text-slate-600">
            Sostenere le cause che contano per il tuo impatto ESG
          </p>

          {/* STAT GENERALE */}
          <div className="mt-6 bg-white rounded-3xl border border-emerald-100 p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Investimento ESG Totale</p>
            <p className="text-5xl font-black text-slate-900">€ {totaleDonazioni.toLocaleString('it-IT')}</p>
            <p className="mt-2 text-sm text-slate-600">{donazioniHistory.length} donazioni effettuate</p>
          </div>
        </section>

        <div className="grid gap-10 md:grid-cols-3">
          {/* COLONNA SINISTRA: STORICO DONAZIONI */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Storico Donazioni</h2>
            <div className="space-y-4">
              {donazioniHistory.map((donazione) => (
                <div
                  key={donazione.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {donazione.associazione}
                    </h3>
                    <span className="text-emerald-600 font-black text-sm">
                      +€ {donazione.importo.toLocaleString('it-IT')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">{donazione.causa}</p>
                  <p className="text-[10px] text-slate-400">{new Date(donazione.data).toLocaleDateString('it-IT')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* COLONNA DESTRA: ASSOCIAZIONI DISPONIBILI */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-slate-900">Associazioni da Sostenere</h2>
              <Link href="/esplora" className="text-violet-600 hover:text-violet-700 font-bold text-sm">
                Vedi tutte →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {associazioniDisponibili.map((associazione) => (
                <div
                  key={associazione.id}
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{associazione.icona}</span>
                    <span className="bg-violet-100 text-violet-800 px-3 py-1 rounded-lg text-[10px] font-bold">
                      {associazione.causa}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                    {associazione.nome}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {associazione.descrizione}
                  </p>
                  <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                    Dona Ora
                  </button>
                </div>
              ))}
            </div>

            {/* CTA ESPLORA */}
            <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-lg">
              <h3 className="text-2xl font-black mb-2">Cerchi Cause Specifiche?</h3>
              <p className="text-emerald-100 mb-4">
                Esplora l'elenco completo di associazioni e cause supportate dalla piattaforma.
              </p>
              <Link href="/esplora" className="inline-block bg-white text-emerald-600 font-black py-3 px-6 rounded-xl hover:bg-emerald-50 transition-colors">
                Esplora Associazioni
              </Link>
            </div>
          </div>
        </div>

        {/* SEZIONE "COMING SOON" */}
        <div className="mt-10 bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">🚀 Prossimamente</p>
          <h3 className="text-xl font-black text-slate-900 mb-2">Integrazioni Pagamenti</h3>
          <p className="text-slate-600">
            Presto potrai effettuare donazioni direttamente sulla piattaforma attraverso payment gateway sicuri.
          </p>
        </div>
      </div>
    </main>
  )
}
