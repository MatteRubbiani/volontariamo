import { Suspense } from 'react'
import AssociazioniDataLoader from './AssociazioniDataLoader'
import AssociazioniMappaSkeleton from './AssociazioniMappaSkeleton'

export const metadata = {
  title: 'Esplora Associazioni | Volontariando', 
  description: 'Scopri le associazioni e gli Enti del Terzo Settore attivi sul tuo territorio.',
}

export default function AssociazioniPage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] w-full overflow-hidden relative bg-slate-100">
      {/* 🟢 Cambio pagina istantaneo a 0ms: Mostra subito lo Skeleton mentre il DataLoader recupera i dati */}
      <Suspense fallback={<AssociazioniMappaSkeleton />}>
        <AssociazioniDataLoader />
      </Suspense>
    </main>
  )
}