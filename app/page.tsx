export const dynamic = 'force-dynamic'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type UserRole = 'volontario' | 'associazione' | 'impresa' | null

export default async function Index() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/esplora')

  const userId = session.user.id
  let role: UserRole = null

  // Preferred path: single profile table with role
  const { data: profile } = await supabase
    .from('profili')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  role = (profile?.role as UserRole | undefined) ?? null

  // Fallback path: infer role from role-specific tables
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

  if (role === 'volontario') redirect('/app/volontario')
  if (role === 'associazione') redirect('/app/associazione')
  if (role === 'impresa') redirect('/app/impresa')

  redirect('/app/onboarding')
}