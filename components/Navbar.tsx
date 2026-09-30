'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import NavbarUI from './NavbarUI'

export default function Navbar() {
  const pathname = usePathname()
  const { workspace, hasAziendale } = useWorkspace()

  const [authData, setAuthData] = useState<{
    email?: string
    role?: string
  }>({
    email: undefined,
    role: undefined,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchSessionAndRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setAuthData({ email: undefined, role: undefined })
          return
        }

        const { data: profile } = await supabase
          .from('profili')
          .select('role, ruolo')
          .eq('id', session.user.id)
          .maybeSingle()

        const userRole = profile?.role || profile?.ruolo || 'volontario'

        setAuthData({
          email: session.user.email,
          role: userRole,
        })
      } catch (err) {
        console.error('[Navbar Controller] Errore recupero sessione:', err)
      }
    }

    fetchSessionAndRole()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthData({ email: undefined, role: undefined })
      } else if (event === 'SIGNED_IN' && session) {
        fetchSessionAndRole()
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  // ⚡ PATH-SNIFFING SINCRONO: Se l'URL è /app/associazione/*,
  // sappiamo all'istante che siamo in modalità Ente senza attendere Supabase
  const isAssociazioneRoute = pathname?.startsWith('/app/associazione')
  const isVolontarioRoute = pathname?.startsWith('/app/volontario')

  const isAssociazione = isAssociazioneRoute || authData.role === 'associazione'
  const isVolontario = !isAssociazione && (isVolontarioRoute || authData.role === 'volontario')
  const isImpresa = !isAssociazione && !isVolontario && authData.role === 'impresa'
  
  const isLoggedIn = !!authData.email || isAssociazioneRoute || isVolontarioRoute
  const isAziendale = isVolontario && workspace === 'aziendale'

  let dashboardLink = '/app/volontario'
  if (isAssociazione) dashboardLink = '/app/associazione/oggi'
  if (isImpresa) dashboardLink = '/app/impresa'

  return (
    <NavbarUI
      email={authData.email}
      isLoggedIn={isLoggedIn}
      isVolontario={isVolontario}
      isAssociazione={isAssociazione}
      isImpresa={isImpresa}
      isAziendale={isAziendale}
      hasAziendale={hasAziendale}
      dashboardLink={dashboardLink}
      currentPath={pathname}
    />
  )
}