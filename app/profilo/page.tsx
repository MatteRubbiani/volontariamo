import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfiloVolontario from './components/ProfiloVolontario'
import ProfiloAssociazione from './components/ProfiloAssociazione'
import ProfiloImpresa from './components/ProfiloImpresa'

export default async function ProfiloPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Leggiamo l'informazione del ruolo dalla tabella Hub "profili"
  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const role = profilo?.ruolo

  // RENDER in base al ruolo
  if (role === 'volontario') {
    const { data: vol } = await supabase
      .from('volontari')
      .select('*, tags:volontario_tags(tag:tags(id, name)), competenze:volontario_competenze(competenza:competenze(id, name))')
      .eq('id', user.id)
      .single()
    return <ProfiloVolontario data={vol!} email={user.email!} />
  }

  if (role === 'associazione') {
    const { data: ass } = await supabase
      .from('associazioni')
      .select('*, tags:associazione_tags(tag:tags(id, name))')
      .eq('id', user.id)
      .single()
    return <ProfiloAssociazione data={ass!} email={user.email!} />
  }

  if (role === 'impresa') {
    const { data: imp } = await supabase
      .from('imprese')
      .select('*')
      .eq('id', user.id)
      .single()
    return <ProfiloImpresa data={imp!} email={user.email!} />
  }

  // Non dovrebbe accadere mai: il middleware dovrebbe gestire questo
  redirect('/app/onboarding')
}