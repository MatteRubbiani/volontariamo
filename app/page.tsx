export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function Index() {
  // Il middleware (proxy.ts) gestisce tutti i redirect per gli utenti autenticati
  // Gli utenti non autenticati vanno all'onboarding oppure a /esplora
  // Questo component è reso inutile dal middleware, quindi reindirizza a /esplora
  redirect('/esplora')
}