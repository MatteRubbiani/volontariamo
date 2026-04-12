import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type UserRole = 'volontario' | 'associazione' | 'impresa' | null

export async function getUserWithRole() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, role: null as UserRole }
  }

  // Singola fonte di verità: la tabella hub "profili"
  // Il middleware (proxy.ts) garantisce che se siamo qui, l'utente ha una riga in profili
  const { data: profile } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile?.ruolo as UserRole | undefined) ?? null

  return { user, role }
}
