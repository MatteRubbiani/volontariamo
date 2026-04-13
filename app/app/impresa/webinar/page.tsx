// Mock data webinar
const webinarUpcoming = [
  {
    id: 1,
    titolo: 'ESG Strategy 101: Fondamenti della Sostenibilità Aziendale',
    relatore: 'Prof. Giulia Rossi - PoliMi',
    data: '2026-04-18',
    ora: '15:00',
    durata: '120 min',
    categoria: 'Strategia',
    posti_disponibili: 45,
    descrizione: 'Introduzione ai principi ESG e come implementarli nella strategia aziendale.'
  },
  {
    id: 2,
    titolo: 'Il Volontariato Aziendale: Engagement del Team',
    relatore: 'Dott. Marco Brunetti - HRD Italia',
    data: '2026-04-25',
    ora: '10:00',
    durata: '90 min',
    categoria: 'Risorse Umane',
    posti_disponibili: 60,
    descrizione: 'Come strutturare programmi di volontariato che coinvolgono e motivano i dipendenti.'
  },
  {
    id: 3,
    titolo: 'Metriche di Impatto Sociale: Misurare il Valore Creato',
    relatore: 'Ing. Laura Conte - Impact Consulting',
    data: '2026-05-02',
    ora: '14:30',
    durata: '100 min',
    categoria: 'Impact Measurement',
    posti_disponibili: 35,
    descrizione: 'Metodologie per quantificare l\'impatto sociale e ambientale della tua azienda.'
  },
  {
    id: 4,
    titolo: 'Sostenibilità Ambientale nel Supply Chain',
    relatore: 'Dott. Giovanni Verde - Green Logistics',
    data: '2026-05-09',
    ora: '11:00',
    durata: '120 min',
    categoria: 'Ambiente',
    posti_disponibili: 50,
    descrizione: 'Strategie per ridurre l\'impronta carbonica nella supply chain aziendale.'
  },
  {
    id: 5,
    titolo: 'Reportistica ESG e Compliance Normativo',
    relatore: 'Avv. Francesca Neri - Studio Legale ESG',
    data: '2026-05-16',
    ora: '15:00',
    durata: '90 min',
    categoria: 'Compliance',
    posti_disponibili: 40,
    descrizione: 'Guida alla redazione del report di sostenibilità e normative vigenti.'
  },
  {
    id: 6,
    titolo: 'Parità di Genere e Inclusione sul Lavoro',
    relatore: 'Dott.ssa Silvia Moretti - Diversity Institute',
    data: '2026-05-23',
    ora: '16:00',
    durata: '100 min',
    categoria: 'Diversità',
    posti_disponibili: 55,
    descrizione: 'Come creare una cultura aziendale inclusiva e rispettosa della diversità.'
  }
]

const getCategoryColor = (categoria: string) => {
  switch (categoria) {
    case 'Strategia':
      return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' }
    case 'Risorse Umane':
      return { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' }
    case 'Impact Measurement':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' }
    case 'Ambiente':
      return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' }
    case 'Compliance':
      return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' }
    case 'Diversità':
      return { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' }
  }
}

export default function WebinarPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <section className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            📚 Webinar di Formazione CSR
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Sess ioni di formazione dedicate alla sostenibilità aziendale e all'impatto ESG
          </p>

          {/* STAT WEBINAR */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Webinar Disponibili</p>
              <p className="text-3xl font-black text-slate-900">{webinarUpcoming.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase text-violet-600 mb-2">Prossimo</p>
              <p className="text-lg font-bold text-slate-900">
                {new Date(webinarUpcoming[0].data).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* FILTRI (Mock) */}
        <section className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {['Tutti', 'Strategia', 'Risorse Umane', 'Ambiente', 'Compliance', 'Diversità'].map((filtro) => (
            <button
              key={filtro}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                filtro === 'Tutti'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-violet-300'
              }`}
            >
              {filtro}
            </button>
          ))}
        </section>

        {/* GRIGLIA WEBINAR */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {webinarUpcoming.map((webinar) => {
            const categoryColors = getCategoryColor(webinar.categoria)
            const dataWebinar = new Date(webinar.data)
            const isNew = dataWebinar < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

            return (
              <div
                key={webinar.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
              >
                {/* BADGE CATEGORIA */}
                <div className={`h-1 ${categoryColors.dot}`} />

                {/* CONTENUTO */}
                <div className="p-6">
                  {/* CATEGORIA + NEW */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${categoryColors.bg} ${categoryColors.text}`}>
                      {webinar.categoria}
                    </span>
                    {isNew && (
                      <span className="bg-violet-600 text-white px-2 py-1 rounded-lg text-[10px] font-black">
                        🆕 NEW
                      </span>
                    )}
                  </div>

                  {/* TITOLO */}
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                    {webinar.titolo}
                  </h3>

                  {/* DESCRIZIONE */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {webinar.descrizione}
                  </p>

                  {/* RELATORE */}
                  <div className="mb-4 pb-4 border-t border-slate-100 pt-4">
                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Relatore</p>
                    <p className="font-bold text-slate-900 text-sm">{webinar.relatore}</p>
                  </div>

                  {/* INFO DETTAGLI */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="mr-2">📅</span>
                      {new Date(webinar.data).toLocaleDateString('it-IT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      <span className="ml-3">🕐</span>
                      {webinar.ora}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="mr-2">⏱️</span>
                      {webinar.durata}
                      <span className="ml-3">👥</span>
                      {webinar.posti_disponibili} posti
                    </div>
                  </div>

                  {/* PULSANTE ISCRIZIONE */}
                  <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-2xl transition-colors">
                    Iscriviti Ora
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* SEZIONE INFORMAZIONI */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {/* CERTIFICATI */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-2xl font-black mb-2">Certificati di Partecipazione</h3>
            <p className="text-blue-100 mb-4">
              Ricevi un certificato per ogni webinar completato. Condividilo sui tuoi canali professionali.
            </p>
            <button className="bg-white text-blue-600 font-black py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
              Vedi i miei Certificati
            </button>
          </div>

          {/* ARCHIVIO REGISTRAZIONI */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-lg">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-2xl font-black mb-2">Archivio Registrazioni</h3>
            <p className="text-emerald-100 mb-4">
              Accedi alle registrazioni dei webinar passati. Completi di slide e materiale didattico.
            </p>
            <button className="bg-white text-emerald-600 font-black py-2 px-4 rounded-lg hover:bg-emerald-50 transition-colors">
              Visita l'Archivio
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
