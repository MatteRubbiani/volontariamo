// src/app/terms/page.tsx
export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Termini e Condizioni d'Uso</h1>
      <p className="text-sm text-slate-500 mb-8">Ultimo aggiornamento: Maggio 2026</p>
      
      <div className="prose prose-slate space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Oggetto del Servizio</h2>
          <p>
            Volontariando è una piattaforma tecnologica che funge da intermediario per connettere volontari e associazioni del territorio. Matteo Rubbiani non offre servizi di volontariato diretti e non è responsabile delle interazioni tra gli utenti.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Limitazione di Responsabilità</h2>
          <p>
            La piattaforma viene fornita "così com'è". Il titolare non si assume alcuna responsabilità per l'esattezza degli annunci pubblicati dalle associazioni o per il comportamento dei volontari durante le attività.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Account e Sicurezza</h2>
          <p>
            Gli utenti sono responsabili della custodia delle proprie credenziali di accesso (gestite in modo sicuro tramite protocolli crittografici). È vietato l'uso di identità false o la pubblicazione di contenuti inappropriati.
          </p>
        </section>
      </div>
    </div>
  );
}