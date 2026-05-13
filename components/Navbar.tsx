import { cache } from 'react'
import NavbarUI from '@/components/NavbarUI'
import { createClient } from '@/lib/supabase/server'

/**
 * MEMOIZED NAVBAR FUNCTION
 * Uses React cache() to prevent redundant database queries
 * This ensures consistent data across multiple renders
 */
const getUserProfile = cache(async (supabase: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { user: null, ruolo: null }
    }

    const { data: profilo, error } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[Navbar] Database query error:', error)
      // Return safe defaults instead of failing
      return { user, ruolo: null }
    }

    return { user, ruolo: profilo?.ruolo || null }
  } catch (error) {
    console.error('[Navbar] Unexpected error:', error)
    // Always render something instead of crashing
    return { user: null, ruolo: null }
  }
})

export default async function Navbar() {
  try {
    const supabase = await createClient()

    const { user, ruolo } = await getUserProfile(supabase)
    
    const dashboardLink = ruolo ? `/app/${ruolo}` : "/app/onboarding"

    // Converti il ruolo in flag boolean per compatibilità con NavbarUI
    return (
      <NavbarUI 
        email={user?.email}
        isVolontario={ruolo === 'volontario'}
        isAssociazione={ruolo === 'associazione'}
        isImpresa={ruolo === 'impresa'}
        dashboardLink={dashboardLink}
      />
    )
  } catch (error) {
    console.error('[Navbar] Fatal error during render:', error)
    // Render empty navbar rather than crashing the entire page
    return <NavbarUI email={undefined} isVolontario={false} isAssociazione={false} isImpresa={false} dashboardLink="/" />
  }
}