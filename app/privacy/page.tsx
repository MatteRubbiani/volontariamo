// src/app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Ultimo aggiornamento: Maggio 2026</p>
      
      <div className="prose prose-slate space-y-6 text-slate-700 text-sm leading-relaxed">
        
        <p>
          La presente Privacy Policy descrive le modalità di gestione dell'applicazione web <strong>Volontariando</strong> in riferimento al trattamento dei dati personali degli utenti che la consultano e vi si registrano, nel rispetto del Regolamento (UE) 2016/679 (GDPR).
        </p>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Titolare del Trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati è <strong>Matteo Rubbiani</strong>. <br />
            Indirizzo email di contatto: <a href="mailto:matterubbiani@gmail.com" className="text-primary underline">matterubbiani@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Finalità e Base Giuridica del Trattamento</h2>
          <p>I dati sono trattati esclusivamente per le seguenti finalità:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Erogazione del servizio:</strong> Permettere la registrazione, l'autenticazione e l'interazione tra volontari e associazioni (Base giuridica: <em>Esecuzione di un contratto</em>).</li>
            <li><strong>Miglioramento dell'applicazione:</strong> Analisi statistica anonimizzata dell'utilizzo dell'app (Base giuridica: <em>Legittimo interesse del titolare</em>).</li>
            <li><strong>Adempimento di obblighi di legge:</strong> Conservazione dei dati necessaria per rispondere a richieste delle autorità (Base giuridica: <em>Obbligo legale</em>).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Tipologie di Dati Raccolti</h2>
          <p>Tramite l'utilizzo della piattaforma, raccogliamo:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dati forniti volontariamente:</strong> Indirizzo email, password crittografata, nome, dati del profilo utente/associazione.</li>
            <li><strong>Dati di navigazione e utilizzo:</strong> Indirizzi IP, log di sistema, metriche di interazione tramite Vercel Analytics.</li>
            <li><strong>Dati di geolocalizzazione:</strong> Query di ricerca inserite nei moduli per l'autocompletamento degli indirizzi.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Servizi di Terze Parti e Trasferimento Extra-UE</h2>
          <p className="mb-2">Per fornire il servizio, ci avvaliamo di infrastrutture esterne. Alcuni di questi fornitori potrebbero trasferire dati al di fuori dello Spazio Economico Europeo (SEE), garantendo la conformità tramite Clausole Contrattuali Tipo (SCC) approvate dalla Commissione Europea:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Supabase (Supabase Inc., USA):</strong> Hosting del database e sistema di autenticazione.</li>
            <li><strong>Vercel (Vercel Inc., USA):</strong> Hosting del frontend e sistema di analisi del traffico (Vercel Analytics).</li>
            <li><strong>Google Maps Places API (Google Ireland Limited, Irlanda):</strong> Servizio per la gestione e validazione degli indirizzi inseriti dagli utenti.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. Conservazione dei Dati</h2>
          <p>
            I dati personali verranno conservati per il tempo strettamente necessario all'erogazione del servizio. I dati legati all'account verranno mantenuti fino alla richiesta di cancellazione del profilo da parte dell'utente, fatti salvi eventuali obblighi di conservazione imposti dalla legge.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">6. Diritti dell'Interessato</h2>
          <p className="mb-2">In base al GDPR (Artt. 15-22), l'utente ha il diritto di:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Richiedere l'accesso ai propri dati e riceverne copia.</li>
            <li>Richiedere la rettifica o l'aggiornamento dei dati inesatti.</li>
            <li>Richiedere la cancellazione dei dati ("Diritto all'oblio").</li>
            <li>Opporsi al trattamento o richiederne la limitazione.</li>
            <li><strong>Proporre reclamo a un'autorità di controllo:</strong> In Italia, il Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer" className="underline text-primary">garanteprivacy.it</a>).</li>
          </ul>
          <p className="mt-4">
            Per esercitare questi diritti, l'utente può contattare il Titolare all'indirizzo email indicato al Punto 1.
          </p>
        </section>

      </div>
    </div>
  );
}