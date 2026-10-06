'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { Database } from '@/types/supabase'
import NavbarUI from './NavbarUI'

type RuoloUtente = Database['public']['Enums']['ruolo_utente']

interface AuthState {
  email?: string
  ruolo: RuoloUtente | null
  isLoading: boolean
}

export default function Navbar() {
  const pathname = usePathname()
  const { workspace, hasAziendale } = useWorkspace()

  const [authState, setAuthState] = useState<AuthState>({
    email: undefined,
    ruolo: null,
    isLoading: true,
  })

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  // Funzione atomica per sincronizzare utente e profilo
  const syncUserAndProfile = useCallback(async (user: any) => {
    if (!user) {
      setAuthState({ email: undefined, ruolo: null, isLoading: false })
      return
    }

    try {
      const { data: profilo } = await supabase
        .from('profili')
        .select('ruolo')
        .eq('id', user.id)
        .maybeSingle()

      setAuthState({
        email: user.email,
        ruolo: profilo?.ruolo ?? null,
        isLoading: false,
      })
    } catch (err) {
      console.error('[Navbar Controller] Errore fetch profilo:', err)
      setAuthState({
        email: user.email,
        ruolo: null,
        isLoading: false,
      })
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    // 1. Lettura iniziale diretta
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) {
        syncUserAndProfile(user)
      }
    })

    // 2. Listener completo: copre login, refresh del token e sessione iniziale
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setAuthState({ email: undefined, ruolo: null, isLoading: false })
      } else if (
        event === 'SIGNED_IN' || 
        event === 'TOKEN_REFRESHED' || 
        event === 'INITIAL_SESSION' || 
        event === 'USER_UPDATED'
      ) {
        syncUserAndProfile(session.user)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase, syncUserAndProfile])

  // Se siamo dentro /app, l'accesso è già garantito dal middleware
  const isAppRoute = pathname.startsWith('/app')
  const isLoggedIn = !!authState.email || (authState.isLoading && isAppRoute)

  const isAssociazioneRoute = pathname.startsWith('/app/associazione')
  const isVolontarioRoute = pathname.startsWith('/app/volontario')

  // Derivazione del ruolo: se siamo nella rotta dedicata o il ruolo è caricato
  const isAssociazione = authState.ruolo === 'associazione' || isAssociazioneRoute
  const isVolontario = authState.ruolo === 'volontario' || (isVolontarioRoute && !isAssociazioneRoute)
  const isImpresa = authState.ruolo === 'impresa'
  
  const isAziendale = isVolontario && workspace === 'aziendale'

  let dashboardLink = '/app/volontario'
  if (isAssociazione) dashboardLink = '/app/associazione/oggi'
  if (isImpresa) dashboardLink = '/app/impresa'

  return (
    <NavbarUI
      email={authState.email}
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