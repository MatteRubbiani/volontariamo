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
      .select('impresa_id') // 🛡️ FIX: 'impresa_id' esiste nella tabella, 'id' no
      .eq('volontario_id', user.id)
      .maybeSingle()
    
    hasAziendale = !!data

    if (error) {
      console.error("Errore verifica impresa_dipendenti:", error)
    }
  }

  return (
    <VolontarioLayoutWrapper 
      hasAziendale={hasAziendale}
      userEmail={user?.email}
    >
      {children}
    </VolontarioLayoutWrapper>
  )
}