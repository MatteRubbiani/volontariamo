import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black mb-4">Chi sei?</h1>
      <p className="text-slate-500 mb-10">Scegli la tua strada. Questa scelta è permanente.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link href="/onboarding/volontario" className="p-10 border-2 border-blue-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all">
          <span className="text-5xl block mb-4">🙋‍♂️</span>
          <h2 className="text-2xl font-bold text-blue-700">Volontario</h2>
        </Link>
        <Link href="/onboarding/associazione" className="p-10 border-2 border-green-100 rounded-3xl hover:border-green-500 hover:bg-green-50 transition-all">
          <span className="text-5xl block mb-4">🏛️</span>
          <h2 className="text-2xl font-bold text-green-700">Associazione</h2>
        </Link>
      </div>
    </div>
  )
}