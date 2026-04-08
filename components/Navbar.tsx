import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import NavbarUI from './NavbarUI' // Importiamo la grafica!

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Identifichiamo il ruolo dell'utente
  let isVolontario = false
  let isAssociazione = false
  let dashboardLink = "/auth/registrazione/onboarding"

  if (user) {
    const [volRes, assRes] = await Promise.all([
      supabase.from('volontari').select('id').eq('id', user.id).single(),
      supabase.from('associazioni').select('id').eq('id', user.id).single()
    ])

    if (volRes.data) {
      isVolontario = true
      dashboardLink = "/app/volontario"
    }
    if (assRes.data) {
      isAssociazione = true
      dashboardLink = "/app/associazione"
    }
  }

  // 2. Passiamo tutti i dati al componente visivo
  return (
    <NavbarUI 
      email={user?.email}
      isVolontario={isVolontario}
      isAssociazione={isAssociazione}
      dashboardLink={dashboardLink}
    />
  )
}