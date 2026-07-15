'use client' // 🚨 Trasformiamo il contenitore in Client-Side per sbloccare l'ISR su tutto il sito

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import NavbarUI from '@/components/NavbarUI'

export default function Navbar() {
  const [authData, setAuthData] = useState({
    email: undefined as string | undefined,
    isVolontario: false,
    isAssociazione: false,
    isImpresa: false,
    dashboardLink: '/'
  })
  const [loading, setLoading] = useState(true)

  // Inizializziamo il client Supabase specifico per il Browser (Zero chiamate a cookies() server-side)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchUserAndRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user || null

        if (!user) {
          setAuthData({
            email: undefined,
            isVolontario: false,
            isAssociazione: false,
            isImpresa: false,
            dashboardLink: '/auth/login' // Fallback sicuro per utenti non loggati
          })
          setLoading(false)
          return
        }

        // Recuperiamo il ruolo dal client del browser
        const { data: profilo, error } = await supabase
          .from('profili')
          .select('ruolo')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        const ruolo = profilo?.ruolo || null
        const dashboardLink = ruolo ? `/app/${ruolo}` : "/app/onboarding"

        setAuthData({
          email: user.email,
          isVolontario: ruolo === 'volontario',
          isAssociazione: ruolo === 'associazione',
          isImpresa: ruolo === 'impresa',
          dashboardLink: dashboardLink
        })
      } catch (error) {
        console.error('[Navbar Client] Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndRole()

    // ✨ Ascoltiamo i cambi di stato (Login/Logout) in tempo reale per aggiornare la Navbar all'istante
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthData({ email: undefined, isVolontario: false, isAssociazione: false, isImpresa: false, dashboardLink: '/auth/login' })
      } else if (event === 'SIGNED_IN' && session) {
        fetchUserAndRole()
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  // Durante il primissimo rendering server o finché carica, mostriamo la Navbar con i dati vuoti (Skeleton state)
  // Questo permette a Next.js di pre-compilare la pagina come statica all'istante!
  if (loading) {
    return (
      <NavbarUI 
        email={undefined} 
        isVolontario={false} 
        isAssociazione={false} 
        isImpresa={false} 
        dashboardLink="/" 
      />
    )
  }

  return (
    <NavbarUI 
      email={authData.email}
      isVolontario={authData.isVolontario}
      isAssociazione={authData.isAssociazione}
      isImpresa={authData.isImpresa}
      dashboardLink={authData.dashboardLink}
    />
  )
}