import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import NavbarUI from './NavbarUI'

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Singola query alla tabella hub "profili" per determinare il ruolo
  // Questo è molto più effeciente che fare 3 query separate!
  let dashboardLink = "/app/onboarding"
  let ruolo: string | null = null

  if (user) {
    const { data: profilo } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    if (profilo?.ruolo) {
      ruolo = profilo.ruolo
      dashboardLink = `/app/${ruolo}`
    }
  }

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
}