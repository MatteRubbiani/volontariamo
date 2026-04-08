import Link from 'next/link'

export default function EsploraPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Esplora le opportunita</h1>
        <p className="text-slate-600">
          Questa area ospitera il catalogo pubblico delle posizioni.
        </p>
        <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
          Torna alla home
        </Link>
      </div>
    </main>
  )
}
