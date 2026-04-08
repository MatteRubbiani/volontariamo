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

  const userId = user.id
  let role: UserRole = null

  const { data: profile } = await supabase
    .from('profili')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  role = (profile?.role as UserRole | undefined) ?? null

  if (!role) {
    const [{ data: vol }, { data: ass }, { data: imp }] = await Promise.all([
      supabase.from('volontari').select('id').eq('id', userId).maybeSingle(),
      supabase.from('associazioni').select('id').eq('id', userId).maybeSingle(),
      supabase.from('imprese').select('id').eq('id', userId).maybeSingle(),
    ])

    if (vol) role = 'volontario'
    else if (ass) role = 'associazione'
    else if (imp) role = 'impresa'
  }

  return { user, role }
}
