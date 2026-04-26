import Link from 'next/link';

const roles = [
  { 
    id: 'volontario', 
    title: 'Volontario', 
    subtitle: 'Cerco opportunità per candidarmi',
    themeClasses: 'hover:border-blue-500 group-hover:text-blue-500',
    isDisabled: false
  },
  { 
    id: 'associazione', 
    title: 'Associazione', 
    subtitle: 'Pubblico posizioni e gestisco candidature',
    themeClasses: 'hover:border-emerald-500 group-hover:text-emerald-500',
    isDisabled: false
  },
  { 
    id: 'impresa', 
    title: 'Impresa', 
    subtitle: 'Creo iniziative di impatto sociale',
    themeClasses: 'hover:border-violet-500 group-hover:text-violet-500',
    isDisabled: true 
  },
];

export default async function OnboardingRootPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ? `?redirectTo=${encodeURIComponent(params.redirectTo)}` : '';

  return (
    <main className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center bg-slate-50 px-4 py-8 md:p-10">
      <section className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Scegli il tuo ruolo</h1>
          <p className="mt-2 text-slate-600">Definisci il tuo percorso nella piattaforma.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((item) => {
            const isOff = item.isDisabled;

            // 1. Mettiamo il contenuto visivo in una variabile per non duplicarlo
            const innerContent = (
              <>
                <div className="flex items-start justify-between">
                  <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors ${!isOff ? item.themeClasses.split(' ')[1] : ''}`}>
                    {item.id}
                  </p>
                  
                  {isOff && (
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                      Prossimamente
                    </span>
                  )}
                </div>
                
                <h2 className="mt-2 text-xl font-black text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
              </>
            );

            // 2. Classi calcolate dinamicamente
            const cardClasses = `relative rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 block group ${
              isOff 
                ? 'opacity-60 cursor-not-allowed select-none bg-slate-50/50' 
                : `hover:shadow-md ${item.themeClasses}`
            }`;

            // 3. Il blocco IF che fa felice TypeScript
            if (isOff) {
              return (
                <div key={item.id} className={cardClasses}>
                  {innerContent}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={`/app/onboarding/${item.id}${redirectTo}`}
                className={cardClasses}
              >
                {innerContent}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}