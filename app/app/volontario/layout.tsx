import { getUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { VolontarioLayoutWrapper } from './components/VolontarioLayoutWrapper'

export default async function VolontarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getUserWithRole()
  
  return (
    <VolontarioLayoutWrapper 
      userEmail={user?.email}
    >
      {children}
    </VolontarioLayoutWrapper>
  )
}