'use client'

import { usePathname } from 'next/navigation'

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Se l'utente sta navigando nell'area volontario, NASCONDIAMO la Navbar globale.
  // In questo modo lasciamo spazio a quella "camaleontica" del VolontarioLayout.
  if (pathname?.startsWith('/app/volontario')) {
    return null
  }

  // Per tutte le altre pagine (Homepage, Login, HR, Associazioni), mostriamo la Navbar normale.
  return <>{children}</>
}