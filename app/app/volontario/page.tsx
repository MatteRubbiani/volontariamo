import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import VolontarioDashboard from '@/components/VolontarioDashboard'

export const metadata = {
  title: 'Dashboard Volontario | Volontariando',
  description: 'Scopri le opportunità di volontariato sul tuo territorio.'
}

export default async function DashboardVolontario() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll() } 
      } 
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Profilo, legame aziendale e feed RPC in parallelo
  const [
    { data: profile }, 
    { data: dipendenteAziendale },
    { data: feedData, error: feedError }
  ] = await Promise.all([
    supabase.from('volontari').select('nome, citta_residenza').eq('id', user.id).maybeSingle(),
    supabase.from('impresa_dipendenti').select('impresa_id').eq('volontario_id', user.id).maybeSingle(),
    supabase.rpc('get_dashboard_volontario_feed', { p_volontario_id: user.id })
  ])

  if (feedError) {
    console.error("Errore get_dashboard_volontario_feed:", feedError)
  }

  const hasAziendale = Boolean(dipendenteAziendale?.impresa_id)
  const sections = feedData || { consigliate: [], vicine: [], ultime: [], una_tantum: [] }

  return (
    <VolontarioDashboard 
      nomeUtente={profile?.nome || 'Volontario'}
      cittaUtente={profile?.citta_residenza || null}
      sections={sections}
      hasAziendale={hasAziendale}
    />
  )
}