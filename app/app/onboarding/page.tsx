import Link from 'next/link';

const roles = [
  { id: 'volontario', title: 'Volontario', subtitle: 'Cerco opportunità per candidarmi' },
  { id: 'associazione', title: 'Associazione', subtitle: 'Pubblico posizioni e gestisco candidature' },
  { id: 'impresa', title: 'Impresa', subtitle: 'Creo iniziative di impatto sociale' },
];

export default async function OnboardingRootPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ? `?redirectTo=${encodeURIComponent(params.redirectTo)}` : '';

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 flex items-center justify-center">
      <section className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Scegli il tuo ruolo</h1>
          <p className="mt-2 text-slate-600">Definisci il tuo percorso nella piattaforma.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((item) => (
            <Link
              key={item.id}
              href={`/app/onboarding/${item.id}${redirectTo}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-blue-500 hover:shadow-md block group"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500">{item.id}</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}