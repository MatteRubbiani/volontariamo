import { getUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { VolontarioLayoutWrapper } from './components/VolontarioLayoutWrapper'

export default async function VolontarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getUserWithRole()
  
  let hasAziendale = false
  
  if (user?.id) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('impresa_dipendenti')
      .select('id')
      .eq('volontario_id', user.id)
      .maybeSingle()
    
    hasAziendale = !!data

    // 🚨 SPIA DI DEBUG SERVER
    console.log("=== DEBUG SERVER ===")
    console.log("Utente ID:", user.id)
    console.log("Risposta DB:", data)
    console.log("Errore DB:", error)
    console.log("hasAziendale calcolato:", hasAziendale)
  }

  return (
    <VolontarioLayoutWrapper 
      hasAziendale={hasAziendale}
      userEmail={user?.email} // 👈 ECCO L'AGGIUNTA FONDAMENTALE
    >
      {children}
    </VolontarioLayoutWrapper>
  )
}