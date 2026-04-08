import { redirect } from 'next/navigation'
import { getUserWithRole } from '@/lib/auth'

export default async function AssociazioneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await getUserWithRole()

  if (!user) redirect('/auth/login')
  if (!role) redirect('/app/onboarding')

  if (role === 'volontario') redirect('/app/volontario')
  if (role === 'impresa') redirect('/app/impresa')

  return <>{children}</>
}
