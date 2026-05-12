'use server'

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

  // ==========================================================
  // 1. RENDER VOLONTARIO (Aggiornato con Categoria)
  // ==========================================================
  if (role === 'volontario') {
    const { data: vol } = await supabase
      .from('volontari')
      .select(`
        *, 
        tags:volontario_tags(tag:tags(id, name, description, categoria)), 
        competenze:volontario_competenze(competenza:competenze(id, name))
      `)
      .eq('id', user.id)
      .single()
      
    return <ProfiloVolontario data={vol!} email={user.email!} />
  }

  // ==========================================================
  // 🚀 2. RENDER ASSOCIAZIONE (Fix Categoria & Description)
  // ==========================================================
  if (role === 'associazione') {
    const { data: ass, error } = await supabase
      .from('associazioni')
      .select(`
        *,
        associazioni_trasparenza (*),
        associazioni_sedi (*),
        tags:associazione_tags(tag:tags(id, name, description, categoria))
      `)
      .eq('id', user.id)
      .single()

    if (error || !ass) {
      console.error("❌ Errore recupero dati associazione:", error?.message)
      redirect('/app/onboarding?role=associazione')
    }

    // DEBUG: Ora dovresti vedere la categoria popolata nel terminale
    console.log("🔍 DUMP PAYLOAD ASSOCIAZIONE:", JSON.stringify(ass.tags, null, 2))

    return <ProfiloAssociazione data={ass} email={user.email!} />
  }

  // ==========================================================
  // 3. RENDER IMPRESA
  // ==========================================================
  if (role === 'impresa') {
    const { data: imp } = await supabase
      .from('imprese')
      .select('*')
      .eq('id', user.id)
      .single()
    return <ProfiloImpresa data={imp!} email={user.email!} />
  }

  redirect('/app/onboarding')
}